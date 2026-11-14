import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

/**
 * Called by Supabase database triggers on: new admission enquiry ("query"), new support ticket ("ticket"),
 * and new Partner App interest ("app_interest").
 *  - Always emails ALERT_EMAIL (default contact@nextute.com) via FormSubmit.
 *    FormSubmit sends a one-time "Activate" email to that inbox first — click it once.
 *  - For enquiries, also WhatsApps the institute when WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set.
 */
const ALERT_EMAIL = process.env.ALERT_EMAIL || "contact@nextute.com";

const SUBJECTS: Record<string, (b: any) => string> = {
  query: (b) => `New admission enquiry: ${b.student_name} → ${b.institute_name}`,
  ticket: (b) => `New support ticket: ${b.subject || b.category} (${b.name})`,
  app_interest: (b) => `Partner App interest: ${b.institute_name}`,
  enrollment: (b) => `New course payment ₹${b.amount}: ${b.name} (${b.course})`,
};
const FIELDS: Record<string, [string, string][]> = {
  query: [["Institute", "institute_name"], ["Area", "institute_area"], ["Student", "student_name"], ["Phone", "student_phone"], ["Email", "student_email"], ["Class", "class_level"], ["Interested in", "exam_interest"], ["Preferred batch", "preferred_batch"], ["Message", "message"]],
  ticket: [["Name", "name"], ["Phone", "phone"], ["Email", "email"], ["Topic", "category"], ["Subject", "subject"], ["Message", "message"]],
  enrollment: [["Student", "name"], ["Phone", "phone"], ["Email", "email"], ["Course", "course"], ["Amount (₹)", "amount"], ["Razorpay payment ID", "payment_id"], ["Order ID", "order_id"]],
  app_interest: [["Institute", "institute_name"], ["Contact", "contact_name"], ["Phone", "phone"], ["Email", "email"], ["Services", "services"], ["Students", "students_count"]],
};

async function sendEmail(b: any) {
  const type = FIELDS[b.type] ? b.type : "ticket";
  const payload: Record<string, string> = { _subject: SUBJECTS[type](b), _template: "table", _captcha: "false" };
  for (const [label, key] of FIELDS[type]) if (b[key]) payload[label] = String(b[key]);
  payload["Open admin"] = `${SITE_URL}/admin${type === "query" ? "/queries" : type === "ticket" ? "/tickets" : type === "enrollment" ? "/courses" : "/waitlist"}`;
  const r = await fetch(`https://formsubmit.co/ajax/${ALERT_EMAIL}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Origin: SITE_URL, Referer: `${SITE_URL}/` },
    body: JSON.stringify(payload),
  });
  return r.status;
}

async function sendWhatsApp(b: any) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || b.type !== "query") return "skipped";
  const to = [b.institute_whatsapp || b.institute_phone, process.env.ADMIN_WHATSAPP]
    .filter(Boolean).map((n: string) => String(n).replace(/\D/g, "").slice(-10)).filter((n: string) => n.length === 10).map((n: string) => "91" + n);
  const params = [b.institute_name, b.student_name, b.student_phone, b.exam_interest || b.class_level || "General"].map((t) => ({ type: "text", text: String(t || "-").slice(0, 60) }));
  return Promise.all([...new Set(to)].map((num) =>
    fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: num, type: "template",
        template: { name: process.env.WHATSAPP_TEMPLATE || "new_enquiry", language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" }, components: [{ type: "body", parameters: params }] } }),
    }).then((r) => r.status)
  ));
}

export async function POST(req: Request) {
  if (!process.env.NOTIFY_SECRET || req.headers.get("x-webhook-secret") !== process.env.NOTIFY_SECRET)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const [email, whatsapp] = await Promise.all([sendEmail(b).catch((e) => String(e)), sendWhatsApp(b).catch((e) => String(e))]);
  return NextResponse.json({ email, whatsapp });
}
