"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, ShieldCheck } from "lucide-react";

declare global { interface Window { Razorpay?: any } }

function loadCheckout() {
  return new Promise<boolean>((res) => {
    if (window.Razorpay) return res(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => res(true);
    s.onerror = () => res(false);
    document.body.appendChild(s);
  });
}

type Props = {
  course: string; price: number; signedIn: boolean; enrolled: boolean; role?: string | null;
  defaultName?: string; defaultPhone?: string; next: string; dark?: boolean;
};

export default function EnrollButton({ course, price, signedIn, enrolled, role, next, dark }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(enrolled ? "enrolled" : "");

  if (done)
    return (
      <div className={"rounded-2xl p-4 " + (dark ? "bg-white/10 text-white" : "border border-green-200 bg-green-50 text-green-900")}>
        <p className="flex items-center gap-2 font-bold"><CheckCircle2 size={20} /> You&apos;re enrolled in this batch!</p>
        <p className="mt-1 text-sm opacity-80">{done !== "enrolled" ? `Payment ID ${done}. ` : ""}Live classes, notes, recordings and tests are in your course dashboard.</p>
        <Link href={`/learn/${course}`} className="mt-3 inline-flex rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900">Go to my classes →</Link>
      </div>
    );

  if (!signedIn)
    return (
      <div className="space-y-2">
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="btn w-full bg-amber-400 py-3.5 text-base font-bold text-slate-900 hover:bg-amber-300">Enrol now · ₹{price}</Link>
        <p className={"text-center text-xs " + (dark ? "text-white/70" : "text-slate-500")}>
          Create a free account to enrol. Already have one? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold underline">Log in</Link>
        </p>
      </div>
    );

  if (role && role !== "student")
    return <p className={"rounded-xl p-3 text-sm " + (dark ? "bg-white/10 text-white" : "bg-slate-100")}>Enrolment is for student accounts. Log in with a student account to buy this batch.</p>;

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("Please enter your name.");
    if (phone.replace(/\D/g, "").length !== 10) return setErr("Please enter a valid 10-digit mobile number.");
    setBusy(true);
    const ok = await loadCheckout();
    if (!ok) { setBusy(false); return setErr("Couldn't load Razorpay. Check your internet and try again."); }
    const r = await fetch("/api/razorpay/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course, name, phone }) });
    const o = await r.json();
    if (!r.ok) { setBusy(false); if (o.enrolled) return setDone("enrolled"); return setErr(o.error || "Could not start payment."); }

    const rzp = new window.Razorpay({
      key: o.key,
      order_id: o.order_id,
      amount: o.amount,
      currency: o.currency,
      name: "Nextute",
      description: o.title,
      image: `${location.origin}/logo.svg`,
      prefill: { name: o.name, email: o.email, contact: o.phone },
      notes: { course },
      theme: { color: "#1d3557" },
      modal: { ondismiss: () => setBusy(false) },
      handler: async (resp: any) => {
        const v = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
        const j = await v.json();
        setBusy(false);
        if (v.ok) { setDone(j.payment_id || resp.razorpay_payment_id); router.refresh(); }
        else setErr(j.error || "Payment verification failed.");
      },
    });
    rzp.on("payment.failed", (resp: any) => { setBusy(false); setErr(resp?.error?.description || "Payment failed. No money was taken — please try again."); });
    rzp.open();
  }

  return (
    <form onSubmit={pay} className="space-y-2">
      <input className="input bg-white text-slate-900 placeholder:text-slate-500" placeholder="Student's full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input bg-white text-slate-900 placeholder:text-slate-500" inputMode="numeric" maxLength={10} placeholder="Mobile number (WhatsApp)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
      {err && <p className={"text-sm " + (dark ? "text-amber-200" : "text-red-600")}>{err}</p>}
      <button disabled={busy} className="btn w-full bg-amber-400 py-3.5 text-base font-bold text-slate-900 hover:bg-amber-300 disabled:opacity-70">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />} Pay ₹{price} &amp; enrol
      </button>
      <p className={"flex items-center justify-center gap-1 text-xs " + (dark ? "text-white/70" : "text-slate-500")}><ShieldCheck size={14} /> Secure payment by Razorpay · UPI, cards, net banking</p>
    </form>
  );
}
