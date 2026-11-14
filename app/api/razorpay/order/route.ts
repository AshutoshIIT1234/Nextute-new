import { NextResponse } from "next/server";
import { getSession } from "@/lib/supabase/server";
import { createOrder, razorpayReady, RZP_KEY_ID } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!razorpayReady()) return NextResponse.json({ error: "Online payment is being set up. Please try again shortly or call us." }, { status: 503 });
  const { supabase, user, profile } = await getSession();
  if (!user) return NextResponse.json({ error: "Please log in to enrol." }, { status: 401 });
  if (profile?.role && profile.role !== "student") return NextResponse.json({ error: "Please use a student account to enrol." }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const slug = String(b.course || "");
  const name = String(b.name || profile?.full_name || "").trim().slice(0, 80);
  const phone = String(b.phone || profile?.phone || "").replace(/\D/g, "").slice(-10);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (phone.length !== 10) return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });

  const { data: course } = await supabase.from("courses").select("slug,title,price,is_active").eq("slug", slug).maybeSingle();
  if (!course || !course.is_active) return NextResponse.json({ error: "This course is not open for enrolment." }, { status: 404 });

  const { data: paid } = await supabase.from("course_enrollments").select("id").eq("user_id", user.id).eq("course_slug", slug).eq("status", "paid").limit(1);
  if (paid?.length) return NextResponse.json({ error: "You are already enrolled in this batch.", enrolled: true }, { status: 409 });

  try {
    const order = await createOrder(course.price, `nt_${Date.now().toString(36)}`, { course: slug, user_id: user.id, phone });
    const { error } = await supabase.from("course_enrollments").insert({
      user_id: user.id, course_slug: slug, razorpay_order_id: order.id, name, phone, email: user.email,
    });
    if (error) throw new Error(error.message);
    if (!profile?.phone) await supabase.from("profiles").update({ phone }).eq("id", user.id);
    return NextResponse.json({ key: RZP_KEY_ID, order_id: order.id, amount: order.amount, currency: order.currency, title: course.title, name, phone, email: user.email });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Could not start payment." }, { status: 500 });
  }
}
