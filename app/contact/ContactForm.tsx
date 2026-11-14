"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const CATS = ["Institute listing", "Registration / login", "Enquiry not answered", "Report incorrect information", "Partnership", "General"];

export default function ContactForm({ userId, defaults }: { userId: string | null; defaults: { name: string; email: string; phone: string; category: string } }) {
  const [f, setF] = useState({ ...defaults, subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.email && !f.phone) return setErr("Please give an email or phone so we can reach you.");
    setBusy(true);
    const { error } = await createClient().from("support_tickets").insert({ ...f, user_id: userId });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
  }
  if (done) return <div className="py-8 text-center"><CheckCircle2 size={52} className="mx-auto text-leaf" /><p className="mt-3 text-lg font-bold">Ticket received</p><p className="text-sm text-slate-600">Our team will get back to you shortly.</p></div>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Name *</label><input required className="input" value={f.name} onChange={up("name")} /></div>
        <div><label className="label">Topic</label><select className="input" value={f.category} onChange={up("category")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={up("email")} /></div>
        <div><label className="label">Phone</label><input className="input" value={f.phone} onChange={up("phone")} /></div>
      </div>
      <div><label className="label">Subject</label><input className="input" value={f.subject} onChange={up("subject")} /></div>
      <div><label className="label">How can we help? *</label><textarea required rows={5} className="input" value={f.message} onChange={up("message")} /></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={busy} className="btn-primary w-full py-3">{busy ? "Sending…" : "Submit ticket"}</button>
    </form>
  );
}
