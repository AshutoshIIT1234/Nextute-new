import crypto from "crypto";

/** Server-only Razorpay helpers. Needs RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in Vercel env. */
export const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RZP_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const PAYMENTS_SECRET = process.env.NOTIFY_SECRET || "";
export const razorpayReady = () => !!(RZP_KEY_ID && RZP_SECRET);

function auth() {
  return "Basic " + Buffer.from(`${RZP_KEY_ID}:${RZP_SECRET}`).toString("base64");
}

export async function createOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: "INR", receipt, notes }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.description || "Could not create Razorpay order");
  return j as { id: string; amount: number; currency: string };
}

export async function fetchOrder(orderId: string) {
  const r = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, { headers: { Authorization: auth() } });
  if (!r.ok) return null;
  return (await r.json()) as { id: string; status: string; amount_paid: number; amount: number };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/** Checkout handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  if (!RZP_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", RZP_SECRET).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const s = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!s || !signature) return false;
  const expected = crypto.createHmac("sha256", s).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}
