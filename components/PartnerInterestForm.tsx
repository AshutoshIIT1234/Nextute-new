"use client";
import { useState } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const SERVICES = ["Test series automation", "Lecture planner", "Class notes upload"];

type Existing = { services: string[]; students_count: number | null } | null;

export default function PartnerInterestForm({ ownerId, instituteId, instituteName, contactName, phone, email, existing }: {
  ownerId: string; instituteId: string | null; instituteName: string; contactName: string; phone: string; email: string; existing: Existing;
}) {
  const [services, setServices] = useState<string[]>(existing?.services?.length ? existing.services : SERVICES);
  const [students, setStudents] = useState(existing?.students_count ? String(existing.students_count) : "");
  const [done, setDone] = useState(!!existing);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!services.length) return setErr("Pick at least one service.");
    setBusy(true);
    setErr("");
    const { error } = await createClient().from("partner_interest").upsert(
      { owner_id: ownerId, institute_id: instituteId, institute_name: instituteName, contact_name: contactName, phone, email, services, students_count: Number(students) || null },
      { onConflict: "owner_id" }
    );
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
  }

  if (done)
    return (
      <div className="rounded-2xl bg-white/10 p-5 text-white">
        <p className="flex items-center gap-2 font-bold"><CheckCircle2 size={20} /> You&apos;re on the early-access list!</p>
        <p className="mt-1 text-sm text-white/85">We&apos;ll contact you before launch with your personalised dashboard. Interested in: {services.join(", ")}.</p>
        <button onClick={() => setDone(false)} className="mt-3 text-xs font-semibold underline">Change my choices</button>
      </div>
    );

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 text-slate-800 shadow-lg">
      <p className="font-bold">Keep me updated</p>
      <p className="text-xs text-slate-500">Choose what your institute needs:</p>
      <div className="mt-3 space-y-2">
        {SERVICES.map((s) => (
          <label key={s} className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="accent-teal" checked={services.includes(s)} onChange={() => setServices(services.includes(s) ? services.filter((x) => x !== s) : [...services, s])} /> {s}
          </label>
        ))}
      </div>
      <input inputMode="numeric" placeholder="Approx. number of students (optional)" className="input mt-3 py-2" value={students} onChange={(e) => setStudents(e.target.value.replace(/\D/g, ""))} />
      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <button disabled={busy} className="btn-primary mt-3 w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />} Notify me at launch</button>
    </form>
  );
}
