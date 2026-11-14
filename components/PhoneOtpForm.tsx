"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, CLASSES } from "@/lib/constants";
import { districtLabel } from "@/lib/bihar";

/** Mobile-number login / signup with a one-time SMS code (Supabase phone auth). */
export default function PhoneOtpForm({ mode, next = "/dashboard" }: { mode: "login" | "signup"; next?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [f, setF] = useState({ full_name: "", role: "student", city: "Patna", class_level: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const e164 = "+91" + phone.replace(/\D/g, "").slice(-10);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, "").slice(-10))) return setErr("Enter a valid 10-digit mobile number.");
    if (mode === "signup" && !f.full_name.trim()) return setErr("Please enter your name.");
    setBusy(true);
    const { error } = await createClient().auth.signInWithOtp({
      phone: e164,
      options: {
        shouldCreateUser: mode === "signup",
        data: mode === "signup" ? { ...f, full_name: f.full_name.trim(), phone: e164.slice(-10), class_level: f.role === "student" ? f.class_level : null } : undefined,
      },
    });
    setBusy(false);
    if (error) return setErr(mode === "login" && /signups not allowed|not found/i.test(error.message) ? "No account with this number yet — please sign up first." : error.message);
    setStep("code");
  }
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await createClient().auth.verifyOtp({ phone: e164, token: code.trim(), type: "sms" });
    setBusy(false);
    if (error) return setErr(error.message);
    router.replace(mode === "signup" && f.role === "institute" ? "/institute/listing" : next);
    router.refresh();
  }

  if (step === "code")
    return (
      <form onSubmit={verify} className="space-y-4">
        <p className="text-sm text-slate-600">Enter the 6-digit code sent to <b>{e164}</b>.</p>
        <input autoFocus inputMode="numeric" maxLength={6} className="input text-center text-2xl tracking-[0.5em]" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <button disabled={busy || code.length < 6} className="btn-primary w-full py-3">{busy && <Loader2 size={16} className="animate-spin" />} Verify & continue</button>
        <button type="button" onClick={() => { setStep("phone"); setCode(""); }} className="btn-ghost w-full text-sm">Change number / resend</button>
      </form>
    );

  return (
    <form onSubmit={send} className="space-y-4">
      {mode === "signup" && (
        <>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {[["student", "Student / parent"], ["institute", "I run an institute"]].map(([r, l]) => (
              <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={"rounded-lg px-3 py-2 text-sm font-semibold " + (f.role === r ? "bg-white text-teal shadow" : "text-slate-600")}>{l}</button>
            ))}
          </div>
          <div><label className="label">Full name</label><input required className="input" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">City</label><select className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>{CITIES.map((c) => <option key={c} value={c}>{districtLabel(c)}</option>)}</select></div>
            {f.role === "student" && <div><label className="label">Class</label><select className="input" value={f.class_level} onChange={(e) => setF({ ...f, class_level: e.target.value })}><option value="">Select</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></div>}
          </div>
        </>
      )}
      <div>
        <label className="label">Mobile number</label>
        <div className="flex">
          <span className="grid place-items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-600">+91</span>
          <input required inputMode="tel" placeholder="10-digit mobile" className="input rounded-l-none" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn-primary w-full py-3">{busy ? <Loader2 size={16} className="animate-spin" /> : <Smartphone size={16} />} Send OTP</button>
    </form>
  );
}
