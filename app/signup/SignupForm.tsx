"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Building2, MailCheck, Presentation } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, CLASSES } from "@/lib/constants";
import { districtLabel } from "@/lib/bihar";

export default function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const init = sp.get("role");
  const [role, setRole] = useState<"student" | "institute" | "mentor">(init === "institute" || init === "mentor" ? init : "student");
  const next = sp.get("next") || (role === "institute" ? "/institute/listing" : role === "mentor" ? "/mentor" : "/institutes");
  const [f, setF] = useState({ full_name: "", email: "", phone: "", password: "", city: "Patna", class_level: "", mentor_subject: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const phone = f.phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) return setErr("Enter a valid 10-digit mobile number.");
    if (f.password.length < 8) return setErr("Password must be at least 8 characters.");
    setBusy(true);
    if (role === "mentor" && !f.mentor_subject.trim()) { setBusy(false); return setErr("Tell us which subject you teach."); }
    const dest = role === "institute" ? "/institute/listing" : role === "mentor" ? "/mentor" : next;
    const { data, error } = await createClient().auth.signUp({
      email: f.email.trim(),
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(dest)}`,
        data: { full_name: f.full_name.trim(), phone, role, city: f.city, class_level: role === "student" ? f.class_level : null, mentor_subject: role === "mentor" ? f.mentor_subject.trim() : null },
      },
    });
    setBusy(false);
    if (error) return setErr(error.message);
    if (data.session) {
      router.replace(dest);
      router.refresh();
    } else setSent(true);
  }

  if (sent)
    return (
      <div className="py-6 text-center">
        <MailCheck size={56} className="mx-auto text-teal" />
        <h2 className="mt-3 text-xl font-bold">Verify your email</h2>
        <p className="mt-2 text-sm text-slate-600">We sent a confirmation link to <b>{f.email}</b>. Click it to activate your account, then you&apos;ll be logged in automatically.</p>
        <Link href="/login" className="btn-outline mt-5">Back to log in</Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
        {([["student", "Student / parent", GraduationCap], ["institute", "Institute", Building2], ["mentor", "Mentor", Presentation]] as const).map(([r, l, Icon]) => (
          <button type="button" key={r} onClick={() => setRole(r)} className={"flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition " + (role === r ? "bg-white text-teal shadow" : "text-slate-600")}>
            <Icon size={16} /> {l}
          </button>
        ))}
      </div>
      <div><label className="label">{role === "institute" ? "Owner / contact person name" : "Full name"}</label><input required className="input" value={f.full_name} onChange={up("full_name")} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Email</label><input type="email" required className="input" value={f.email} onChange={up("email")} /></div>
        <div><label className="label">Mobile number</label><input required inputMode="tel" placeholder="10-digit" className="input" value={f.phone} onChange={up("phone")} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">City</label>
          <select className="input" value={f.city} onChange={up("city")}>{CITIES.map((c) => <option key={c} value={c}>{districtLabel(c)}</option>)}</select>
        </div>
        {role === "mentor" && (
          <div><label className="label">Subject you teach</label><input className="input" value={f.mentor_subject} onChange={up("mentor_subject")} placeholder="e.g. NDA Maths" /></div>
        )}
        {role === "student" && (
          <div>
            <label className="label">Class</label>
            <select className="input" value={f.class_level} onChange={up("class_level")}>
              <option value="">Select</option>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>
      <div><label className="label">Password</label><input type="password" required minLength={8} autoComplete="new-password" className="input" value={f.password} onChange={up("password")} placeholder="At least 8 characters" /></div>
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn-primary w-full py-3">{busy ? "Creating account…" : role === "institute" ? "Create account & list institute" : role === "mentor" ? "Apply as mentor" : "Create free account"}</button>
      {role === "mentor" ? <p className="text-center text-xs text-slate-500">Mentor accounts are approved by the Nextute team before you can teach.</p> : <p className="text-center text-xs text-slate-500">By signing up you agree to be contacted by institutes you send enquiries to.</p>}
      <p className="text-center text-sm text-slate-600">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-teal">Log in</Link></p>
    </form>
  );
}
