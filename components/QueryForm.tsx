"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Batch } from "@/lib/utils";

type Props = {
  instituteId: string;
  instituteName: string;
  batches: Batch[];
  exams: string[];
  profile: { id: string; full_name: string | null; phone: string | null; email: string | null; class_level: string | null };
  alreadySentOn?: string | null;
};

export default function QueryForm({ instituteId, instituteName, batches, exams, profile, alreadySentOn }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    student_name: profile.full_name || "",
    student_phone: profile.phone || "",
    student_email: profile.email || "",
    class_level: profile.class_level || "",
    exam_interest: exams[0] || "",
    preferred_batch: "",
    message: "",
  });
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!/^[6-9]\d{9}$/.test(f.student_phone.replace(/\D/g, "").slice(-10))) return setErr("Please enter a valid 10-digit mobile number.");
    setBusy(true);
    const sb = createClient();
    const { error } = await sb.from("queries").insert({ ...f, student_phone: f.student_phone.replace(/\D/g, "").slice(-10), institute_id: instituteId, student_id: profile.id });
    if (!profile.phone) await sb.from("profiles").update({ phone: f.student_phone }).eq("id", profile.id);
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setDone(false); }} className="btn-primary w-full py-3 text-base">
        <Send size={18} /> {alreadySentOn ? "Send another enquiry" : "Send admission enquiry"}
      </button>
      {alreadySentOn && <p className="mt-2 text-center text-xs text-teal">✓ You sent an enquiry on {new Date(alreadySentOn).toLocaleDateString("en-IN")}</p>}
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="card max-h-[92vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="py-6 text-center">
                <CheckCircle2 size={56} className="mx-auto text-leaf" />
                <h3 className="mt-3 text-xl font-bold">Enquiry sent!</h3>
                <p className="mt-2 text-sm text-slate-600">{instituteName} will contact you on <b>{f.student_phone}</b> about admission. You can track it in your dashboard.</p>
                <div className="mt-5 flex justify-center gap-2">
                  <button onClick={() => setOpen(false)} className="btn-outline">Close</button>
                  <a href="/student" className="btn-primary">Go to dashboard</a>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold">Admission enquiry</h3>
                    <p className="text-sm text-slate-500">to {instituteName}</p>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} aria-label="Close"><X /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Student name *</label><input required className="input" value={f.student_name} onChange={up("student_name")} /></div>
                  <div><label className="label">Mobile number *</label><input required className="input" inputMode="tel" placeholder="10-digit mobile" value={f.student_phone} onChange={up("student_phone")} /></div>
                  <div><label className="label">Email</label><input type="email" className="input" value={f.student_email} onChange={up("student_email")} /></div>
                  <div><label className="label">Current class</label><input className="input" placeholder="e.g. Class 11" value={f.class_level} onChange={up("class_level")} /></div>
                  <div>
                    <label className="label">Interested in</label>
                    <select className="input" value={f.exam_interest} onChange={up("exam_interest")}>
                      {exams.map((e) => <option key={e}>{e}</option>)}
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Preferred batch</label>
                    <select className="input" value={f.preferred_batch} onChange={up("preferred_batch")}>
                      <option value="">Not sure yet</option>
                      {batches.map((b) => <option key={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
                <div><label className="label">Message (optional)</label><textarea rows={3} className="input" placeholder="Ask about fees, scholarship, demo class timing…" value={f.message} onChange={up("message")} /></div>
                {err && <p className="text-sm text-red-600">{err}</p>}
                <button disabled={busy} className="btn-primary w-full py-3">{busy ? "Sending…" : "Send enquiry"}</button>
                <p className="text-center text-xs text-slate-500">Your contact details are shared only with this institute.</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
