import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import { verifyWebhookSignature, PAYMENTS_SECRET } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

/**
 * Optional backup: Razorpay Dashboard → Settings → Webhooks → URL https://nextute-chi.vercel.app/api/razorpay/webhook,
 * events "payment.captured" + "order.paid", and the same secret in Vercel env RAZORPAY_WEBHOOK_SECRET.
 * Confirms enrolments even if the student closes the browser right after paying.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature") || ""))
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  const ev = JSON.parse(raw);
  const pay = ev?.payload?.payment?.entity;
  if ((ev.event === "payment.captured" || ev.event === "order.paid") && pay?.order_id) {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    await sb.rpc("confirm_enrollment", { p_order: pay.order_id, p_payment: pay.id, p_secret: PAYMENTS_SECRET });
  }
  return NextResponse.json({ ok: true });
}
