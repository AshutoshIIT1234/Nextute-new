"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, Trash2, Pencil, CheckCircle2, Eye, EyeOff, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Test, Question } from "@/lib/learn";

const LETTERS = ["A", "B", "C", "D"];
type Key = { correct: number; explanation: string | null };
type Result = { user_id: string; name: string; phone: string; score: number; correct: number; wrong: number; skipped: number; attempts?: number };
const toLocal = (d: string | null) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const BLANK = { question: "", options: ["", "", "", ""], correct: -1, chapter: "", explanation: "" };

export default function TestEditor({ test, initialQuestions, initialKeys, results }: { test: Test; initialQuestions: Question[]; initialKeys: Record<string, Key>; results: Result[] }) {
  const sb = createClient();
  const router = useRouter();
  const [t, setT] = useState({ ...test, starts_at: toLocal(test.starts_at), ends_at: toLocal(test.ends_at) });
  const [qs, setQs] = useState(initialQuestions);
  const [keys, setKeys] = useState(initialKeys);
  const [q, setQ] = useState(BLANK);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function saveTest(publish?: boolean) {
    setErr(""); setMsg("");
    const is_published = publish === undefined ? t.is_published : publish;
    if (is_published && qs.length === 0) return setErr("Add at least one question before publishing.");
    if (is_published && qs.some((x) => keys[x.id]?.correct === undefined)) return setErr("Every question needs a correct answer before publishing.");
    setBusy("test");
    const { error } = await sb.from("course_tests").update({
      title: t.title.trim(), syllabus: t.syllabus?.trim() || null, duration_min: Number(t.duration_min) || 60,
      starts_at: t.starts_at ? new Date(t.starts_at).toISOString() : null, ends_at: t.ends_at ? new Date(t.ends_at).toISOString() : null,
      marks_correct: Number(t.marks_correct) || 0, marks_wrong: Number(t.marks_wrong) || 0, is_published,
    }).eq("id", test.id);
    setBusy("");
    if (error) return setErr(error.message);
    setT({ ...t, is_published });
    setMsg(publish === true ? "Published — students can now see this test." : publish === false ? "Unpublished." : "Saved ✓");
    router.refresh();
  }

  async function saveQuestion(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const options = q.options.map((o) => o.trim());
    if (!q.question.trim()) return setErr("Type the question.");
    if (options.some((o) => !o)) return setErr("Fill all four options.");
    if (q.correct < 0) return setErr("Tick the correct option.");
    setBusy("q");
    let id = editing;
    if (editing) {
      const { error } = await sb.from("test_questions").update({ question: q.question.trim(), options, chapter: q.chapter.trim() || null }).eq("id", editing);
      if (error) { setBusy(""); return setErr(error.message); }
    } else {
      const { data, error } = await sb.from("test_questions").insert({ test_id: test.id, position: qs.length + 1, question: q.question.trim(), options, chapter: q.chapter.trim() || null }).select("*").single();
      if (error) { setBusy(""); return setErr(error.message); }
      id = (data as Question).id;
      setQs([...qs, data as Question]);
    }
    const { error: kErr } = await sb.from("test_keys").upsert({ question_id: id!, correct: q.correct, explanation: q.explanation.trim() || null });
    setBusy("");
    if (kErr) return setErr(kErr.message);
    if (editing) setQs(qs.map((x) => (x.id === editing ? { ...x, question: q.question.trim(), options, chapter: q.chapter.trim() || null } : x)));
    setKeys({ ...keys, [id!]: { correct: q.correct, explanation: q.explanation.trim() || null } });
    setQ({ ...BLANK, chapter: q.chapter });
    setEditing(null);
  }

  function edit(x: Question) {
    setEditing(x.id);
    setQ({ question: x.question, options: [...x.options, "", "", "", ""].slice(0, 4), correct: keys[x.id]?.correct ?? -1, chapter: x.chapter || "", explanation: keys[x.id]?.explanation || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(x: Question) {
    if (!confirm("Delete this question?")) return;
    const { error } = await sb.from("test_questions").delete().eq("id", x.id);
    if (error) return alert(error.message);
    setQs(qs.filter((y) => y.id !== x.id));
  }

  const total = qs.length * (Number(t.marks_correct) || 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <section className="card space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-extrabold text-navy">Test settings</h1>
            {t.is_published ? <span className="badge bg-green-100 text-green-800">Published</span> : <span className="badge bg-slate-100 text-slate-600">Draft — hidden from students</span>}
          </div>
          <div><label className="label">Test name</label><input className="input" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} /></div>
          <div><label className="label">Syllabus</label><textarea rows={2} className="input" value={t.syllabus || ""} onChange={(e) => setT({ ...t, syllabus: e.target.value })} placeholder="e.g. Sets, relations, quadratic equations" /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><label className="label">Duration (min)</label><input inputMode="numeric" className="input" value={t.duration_min} onChange={(e) => setT({ ...t, duration_min: Number(e.target.value.replace(/\D/g, "")) as any })} /></div>
            <div><label className="label">Marks per correct</label><input inputMode="decimal" className="input" value={t.marks_correct} onChange={(e) => setT({ ...t, marks_correct: e.target.value as any })} /></div>
            <div><label className="label">Negative per wrong</label><input inputMode="decimal" className="input" value={t.marks_wrong} onChange={(e) => setT({ ...t, marks_wrong: e.target.value as any })} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Opens at (optional)</label><input type="datetime-local" className="input" value={t.starts_at || ""} onChange={(e) => setT({ ...t, starts_at: e.target.value })} /></div>
            <div><label className="label">Closes at (optional)</label><input type="datetime-local" className="input" value={t.ends_at || ""} onChange={(e) => setT({ ...t, ends_at: e.target.value })} /></div>
          </div>
          <p className="text-xs text-slate-500">{qs.length} questions · maximum marks {total}</p>
          {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
          {msg && <p className="rounded-lg bg-green-50 p-2 text-sm text-green-800">{msg}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => saveTest()} disabled={!!busy} className="btn-outline">{busy === "test" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save</button>
            {t.is_published
              ? <button onClick={() => saveTest(false)} disabled={!!busy} className="btn-outline"><EyeOff size={16} /> Unpublish</button>
              : <button onClick={() => saveTest(true)} disabled={!!busy} className="btn-primary"><Eye size={16} /> Publish to students</button>}
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-bold">Questions ({qs.length})</h2>
          <div className="space-y-3">
            {qs.length === 0 && <p className="card p-6 text-sm text-slate-500">No questions yet — add the first one using the form.</p>}
            {qs.map((x, n) => (
              <div key={x.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-slate-500">Q{n + 1}{x.chapter ? ` · ${x.chapter}` : ""}</p>
                  <div className="flex gap-1">
                    <button onClick={() => edit(x)} className="p-1 text-slate-500 hover:text-teal" aria-label="Edit"><Pencil size={15} /></button>
                    <button onClick={() => remove(x)} className="p-1 text-red-600" aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap font-semibold">{x.question}</p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {x.options.map((o, i) => <p key={i} className={"rounded-lg px-3 py-1.5 text-sm " + (keys[x.id]?.correct === i ? "bg-green-100 font-semibold text-green-900" : "bg-slate-50")}>{LETTERS[i]}. {o}</p>)}
                </div>
                {keys[x.id]?.correct === undefined && <p className="mt-2 text-xs font-semibold text-red-600">No correct answer set</p>}
              </div>
            ))}
          </div>
        </section>

        {results.length > 0 && (
          <section className="card overflow-x-auto">
            <h2 className="p-4 pb-0 font-bold">Results ({results.length} students · best attempt)</h2>
            <table className="mt-2 w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Rank</th><th>Student</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Skipped</th><th>Attempts</th></tr></thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.user_id} className="border-b border-slate-50"><td className="p-3 font-bold">#{i + 1}</td><td>{r.name}<span className="block text-xs text-slate-500">{r.phone}</span></td><td className="font-semibold">{r.score}</td><td>{r.correct}</td><td>{r.wrong}</td><td>{r.skipped}</td><td>{r.attempts || 1}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      <form onSubmit={saveQuestion} className="card h-fit space-y-3 p-5 lg:sticky lg:top-20">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">{editing ? "Edit question" : "Add a question"}</h2>
          {editing && <button type="button" onClick={() => { setEditing(null); setQ(BLANK); }} className="text-slate-400"><X size={18} /></button>}
        </div>
        <div><label className="label">Question *</label><textarea rows={3} className="input" value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} /></div>
        <p className="text-xs text-slate-500">Type the options and tick the correct one.</p>
        {q.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <button type="button" onClick={() => setQ({ ...q, correct: i })} className={"grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-bold " + (q.correct === i ? "border-green-600 bg-green-600 text-white" : "border-slate-300 text-slate-500")}>
              {q.correct === i ? <CheckCircle2 size={16} /> : LETTERS[i]}
            </button>
            <input className="input py-2" value={o} onChange={(e) => { const opts = [...q.options]; opts[i] = e.target.value; setQ({ ...q, options: opts }); }} placeholder={`Option ${LETTERS[i]}`} />
          </div>
        ))}
        <div><label className="label">Chapter (for the report)</label><input className="input" value={q.chapter} onChange={(e) => setQ({ ...q, chapter: e.target.value })} placeholder="e.g. Trigonometry" /></div>
        <div><label className="label">Explanation (shown after submit)</label><textarea rows={2} className="input" value={q.explanation} onChange={(e) => setQ({ ...q, explanation: e.target.value })} /></div>
        <button disabled={!!busy} className="btn-primary w-full">{busy === "q" ? <Loader2 size={16} className="animate-spin" /> : editing ? <Save size={16} /> : <Plus size={16} />} {editing ? "Save question" : "Add question"}</button>
      </form>
    </div>
  );
}
