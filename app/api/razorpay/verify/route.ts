import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/server";
import { fetchOrder, verifyPaymentSignature, PAYMENTS_SECRET } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { supabase, user } = await getSession();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const orderId = String(b.razorpay_order_id || "");
  const paymentId = String(b.razorpay_payment_id || "");
  const sig = String(b.razorpay_signature || "");

  if (!verifyPaymentSignature(orderId, paymentId, sig))
    return NextResponse.json({ error: "Payment could not be verified. If money was deducted, contact us with your payment ID." }, { status: 400 });

  // Make sure the order belongs to this student
  const { data: row } = await supabase.from("course_enrollments").select("id").eq("razorpay_order_id", orderId).eq("user_id", user.id).maybeSingle();
  if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Double-check with Razorpay that the order is actually paid
  const order = await fetchOrder(orderId);
  if (order && order.status !== "paid" && order.amount_paid < order.amount)
    return NextResponse.json({ error: "Payment is still processing. Refresh in a minute." }, { status: 202 });

  const { error } = await supabase.rpc("confirm_enrollment", { p_order: orderId, p_payment: paymentId, p_secret: PAYMENTS_SECRET });
  if (error) return NextResponse.json({ error: "Payment received but enrolment failed to save. Please contact us with ID " + paymentId }, { status: 500 });
  return NextResponse.json({ ok: true, payment_id: paymentId });
}
