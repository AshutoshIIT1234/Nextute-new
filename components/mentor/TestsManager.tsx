"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtDateTime, type Test } from "@/lib/learn";

export default function TestsManager({ slug, initial, attempts }: { slug: string; initial: Test[]; attempts: Record<string, number> }) {
  const sb = createClient();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setErr("Enter a test name.");
    setBusy(true);
    const { data, error } = await sb.from("course_tests").insert({ course_slug: slug, title: title.trim() }).select("id").single();
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/mentor/${slug}/test/${data!.id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={create} className="card h-fit space-y-3 p-5">
        <h2 className="font-bold">Create a test</h2>
        <div><label className="label">Test name *</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly Test 1 — Algebra" /></div>
        {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create & add questions</button>
        <p className="text-xs text-slate-500">Next you&apos;ll set syllabus, duration, schedule and marking, then add MCQs. Students see the test only after you publish it.</p>
      </form>
      <div className="card divide-y divide-slate-100">
        {initial.length === 0 && <p className="p-6 text-sm text-slate-500">No tests yet.</p>}
        {initial.map((t) => (
          <Link key={t.id} href={`/mentor/${slug}/test/${t.id}`} className="flex items-center gap-3 p-4 hover:bg-slate-50">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.title}</p>
              <p className="text-xs text-slate-500">{t.duration_min} min · {t.starts_at ? fmtDateTime(t.starts_at) : "anytime"} · {attempts[t.id] || 0} submitted</p>
            </div>
            {t.is_published ? <span className="badge bg-green-100 text-green-800">Published</span> : <span className="badge bg-slate-100 text-slate-600">Draft</span>}
            <ChevronRight size={16} className="text-slate-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
