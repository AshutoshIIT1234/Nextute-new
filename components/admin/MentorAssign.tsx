"use client";
import { useState } from "react";
import { CheckCircle2, Loader2, UserMinus, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

type Mentor = { id: string; full_name: string | null; email: string | null; phone: string | null; mentor_subject: string | null; created_at: string };

export default function MentorAssign({ courses, mentors, initial }: { courses: { slug: string; title: string }[]; mentors: Mentor[]; initial: { course_slug: string; mentor_id: string }[] }) {
  const sb = createClient();
  const [links, setLinks] = useState(initial);
  const [busy, setBusy] = useState("");
  const has = (m: string, c: string) => links.some((l) => l.mentor_id === m && l.course_slug === c);

  async function toggle(m: string, c: string) {
    setBusy(m + c);
    if (has(m, c)) {
      const { error } = await sb.from("course_mentors").delete().eq("mentor_id", m).eq("course_slug", c);
      if (!error) setLinks(links.filter((l) => !(l.mentor_id === m && l.course_slug === c)));
      else alert(error.message);
    } else {
      const { error } = await sb.from("course_mentors").insert({ mentor_id: m, course_slug: c });
      if (!error) setLinks([...links, { mentor_id: m, course_slug: c }]);
      else alert(error.message);
    }
    setBusy("");
  }

  const pending = mentors.filter((m) => !links.some((l) => l.mentor_id === m.id));
  return (
    <section className="card p-5">
      <h2 className="font-bold">Mentors</h2>
      <p className="text-sm text-slate-500">People who signed up as mentors. Approve a mentor by assigning them to a course — they can then add live classes, notes and tests for it.</p>
      {pending.length > 0 && <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-900"><b>{pending.length}</b> mentor application{pending.length > 1 ? "s" : ""} waiting for approval.</p>}
      <div className="mt-4 divide-y divide-slate-100">
        {mentors.length === 0 && <p className="py-4 text-sm text-slate-500">No mentor sign-ups yet. Mentors sign up at /signup?role=mentor.</p>}
        {mentors.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{m.full_name || m.email} {!links.some((l) => l.mentor_id === m.id) && <span className="badge ml-1 bg-amber-100 text-amber-800">Pending</span>}</p>
              <p className="text-xs text-slate-500">{[m.mentor_subject, m.phone, m.email, `joined ${timeAgo(m.created_at)}`].filter(Boolean).join(" · ")}</p>
            </div>
            {courses.map((c) => (
              <button key={c.slug} disabled={busy === m.id + c.slug} onClick={() => toggle(m.id, c.slug)} className={has(m.id, c.slug) ? "btn-outline py-1.5 text-xs" : "btn-primary py-1.5 text-xs"}>
                {busy === m.id + c.slug ? <Loader2 size={14} className="animate-spin" /> : has(m.id, c.slug) ? <UserMinus size={14} /> : <UserPlus size={14} />}
                {has(m.id, c.slug) ? <>Remove from {c.title}</> : <>Approve for {c.title}</>}
              </button>
            ))}
            {links.some((l) => l.mentor_id === m.id) && <CheckCircle2 size={18} className="text-green-600" />}
          </div>
        ))}
      </div>
    </section>
  );
}
