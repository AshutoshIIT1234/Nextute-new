import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Trophy, Target, Lightbulb, BarChart3, TrendingUp } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { courseAccess, testState, fmtDateTime, type Test, type Attempt, type Question } from "@/lib/learn";
import TestRunner from "@/components/learn/TestRunner";
import ReattemptButton from "@/components/learn/ReattemptButton";
import { AttemptsChart, CompareChart } from "@/components/learn/Charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Test", robots: { index: false } };
const LETTERS = ["A", "B", "C", "D", "E"];
type Hist = { attempt_no: number; score: number; correct: number; wrong: number; skipped: number; submitted_at: string; rank: number };

export default async function TestPage({ params, searchParams }: { params: Promise<{ slug: string; id: string }>; searchParams: Promise<{ attempt?: string }> }) {
  const { slug, id } = await params;
  const { attempt: attemptParam } = await searchParams;
  const { supabase, user, profile } = await getSession();
  if (!user) redirect(`/login?next=/learn/${slug}/test/${id}`);
  const { course, isAdmin, isMentor, isEnrolled } = await courseAccess(supabase, slug, user, profile);
  if (!course) notFound();
  if (!isAdmin && !isMentor && !isEnrolled) redirect(`/courses/${slug}`);
  const { data: t } = await supabase.from("course_tests").select("*").eq("id", id).eq("course_slug", slug).maybeSingle();
  const test = t as Test | null;
  if (!test) notFound();
  const { data: rows } = await supabase.from("test_attempts").select("*").eq("test_id", id).eq("user_id", user.id).order("attempt_no");
  const attempts = (rows || []) as (Attempt & { attempt_no: number })[];
  const open = attempts.find((a) => !a.submitted_at);
  const done = attempts.filter((a) => a.submitted_at);
  const st = testState(test);
  const here = `/learn/${slug}/test/${id}`;
  const back = <Link href={`/learn/${slug}?tab=tests`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-teal"><ArrowLeft size={16} /> Back to tests</Link>;

  if (open || !done.length) {
    if (!open && st !== "open")
      return <div className="mx-auto max-w-2xl px-4 py-8">{back}<p className="card mt-4 p-8 text-center text-slate-600">{st === "upcoming" ? `This test opens ${fmtDateTime(test.starts_at)}.` : "This test is closed."}</p></div>;
    return <div className="mx-auto max-w-6xl px-4 py-6">{back}<div className="mt-4"><TestRunner test={test} started={open?.started_at || null} attemptNo={open?.attempt_no || done.length + 1} /></div></div>;
  }

  // ---- Report ----
  const view = done.find((a) => String(a.attempt_no) === attemptParam) || done[done.length - 1];
  const { data: qs } = await supabase.from("test_questions").select("*").eq("test_id", id).order("position");
  const questions = (qs || []) as Question[];
  const ids = questions.map((q) => q.id);
  const [{ data: keys }, { data: summary }] = await Promise.all([
    ids.length ? supabase.from("test_keys").select("*").in("question_id", ids) : Promise.resolve({ data: [] as any[] }),
    supabase.rpc("test_summary", { p_test: id }),
  ]);
  const keyBy = new Map((keys || []).map((k: any) => [k.question_id, k]));
  const s = (summary || {}) as { participants?: number; topper?: number; average?: number; lowest?: number; my_best?: number; my_rank?: number; attempts?: Hist[] };
  const hist = (s.attempts || []) as Hist[];
  const viewRank = hist.find((h) => h.attempt_no === view.attempt_no)?.rank;
  const maxMarks = questions.length * Number(test.marks_correct);
  const chapters = Object.entries(view.chapter_stats || {}).map(([ch, v]) => ({ ch, ...v, pct: v.total ? Math.round((v.correct / v.total) * 100) : 0 })).sort((x, y) => x.pct - y.pct);
  const weak = chapters.filter((c) => c.pct < 60);
  const accuracy = view.correct! + view.wrong! > 0 ? Math.round((view.correct! / (view.correct! + view.wrong!)) * 100) : 0;
  const prev = hist.find((h) => h.attempt_no === view.attempt_no - 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {back}
      <div className="mt-4 rounded-3xl bg-[#0f1f33] p-6 text-white md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-white/70">Test report · Attempt {view.attempt_no} of {done.length}</p>
            <h1 className="text-2xl font-extrabold">{test.title}</h1>
          </div>
          {st === "open" && <ReattemptButton testId={id} href={here} className="btn bg-amber-400 font-bold text-slate-900 hover:bg-amber-300" />}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["This attempt", `${view.score} / ${maxMarks}`], ["Rank (this attempt)", viewRank ? `#${viewRank} of ${s.participants}` : "—"], ["Your best", `${s.my_best ?? "—"} · #${s.my_rank ?? "—"}`], ["Topper", s.topper ?? "—"], ["Class average", s.average ?? "—"]].map(([l, v]) => (
            <div key={l as string} className="rounded-2xl bg-white/10 p-3"><p className="text-xl font-extrabold text-amber-300">{v as any}</p><p className="text-xs text-white/70">{l}</p></div>
          ))}
        </div>
        <p className="mt-4 flex flex-wrap gap-4 text-sm text-white/80">
          <span className="flex items-center gap-1"><CheckCircle2 size={15} className="text-lime-300" /> {view.correct} correct</span>
          <span className="flex items-center gap-1"><XCircle size={15} className="text-red-300" /> {view.wrong} wrong</span>
          <span className="flex items-center gap-1"><MinusCircle size={15} /> {view.skipped} skipped</span>
          <span className="flex items-center gap-1"><Target size={15} /> {accuracy}% accuracy</span>
          {prev && <span className="flex items-center gap-1"><TrendingUp size={15} /> {Number(view.score) - Number(prev.score) >= 0 ? "+" : ""}{(Number(view.score) - Number(prev.score)).toFixed(2)} marks vs attempt {prev.attempt_no}</span>}
        </p>
        {done.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {done.map((a) => (
              <Link key={a.attempt_no} href={`${here}?attempt=${a.attempt_no}`} className={"rounded-full px-3 py-1 text-xs font-semibold " + (a.attempt_no === view.attempt_no ? "bg-white text-navy" : "bg-white/10 text-white hover:bg-white/20")}>Attempt {a.attempt_no} · {a.score}</Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold"><BarChart3 size={18} className="text-teal" /> Marks vs rank in every attempt</h2>
          <p className="text-xs text-slate-500">Bars show your marks, the dotted line shows your rank (#1 is best).</p>
          <div className="mt-3"><AttemptsChart attempts={hist} maxMarks={maxMarks} /></div>
        </section>
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold"><Trophy size={18} className="text-teal" /> You vs the class</h2>
          <p className="text-xs text-slate-500">Attempt {view.attempt_no} compared with every student&apos;s best score ({s.participants} students).</p>
          <div className="mt-3"><CompareChart topper={Number(s.topper ?? 0)} average={Number(s.average ?? 0)} lowest={Number(s.lowest ?? 0)} you={Number(view.score ?? 0)} maxMarks={maxMarks} /></div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold"><Target size={18} className="text-teal" /> Chapter-wise analysis</h2>
          <div className="mt-4 space-y-3">
            {chapters.map((c) => (
              <div key={c.ch}>
                <div className="flex justify-between text-sm"><span>{c.ch}</span><span className="font-semibold">{c.correct}/{c.total} · {c.pct}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-slate-100"><div className={"h-2 rounded-full " + (c.pct >= 75 ? "bg-green-500" : c.pct >= 50 ? "bg-amber-400" : "bg-red-500")} style={{ width: `${c.pct}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold"><Lightbulb size={18} className="text-amber-500" /> How to improve</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {weak.length ? weak.map((c) => <li key={c.ch}>• <b>{c.ch}</b>: only {c.correct} of {c.total} right. Re-watch this chapter&apos;s lectures, revise the notes and solve 20 practice questions, then reattempt.</li>)
              : <li>• Great work — 60%+ in every chapter. Push for speed: aim to finish 10 minutes early next time.</li>}
            {view.wrong! > view.correct! / 2 && <li>• You lost {(view.wrong! * Number(test.marks_wrong)).toFixed(2)} marks to negative marking. Attempt a question only when you can eliminate at least two options.</li>}
            {view.skipped! > questions.length / 4 && <li>• You skipped {view.skipped} questions. Practise timed sets to build speed.</li>}
            {s.topper != null && view.score != null && <li>• You are {Math.max(0, Number(s.topper) - Number(view.score)).toFixed(2)} marks behind the topper.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 font-bold">Answer review · Attempt {view.attempt_no}</h2>
        <div className="space-y-3">
          {questions.map((q, n) => {
            const k: any = keyBy.get(q.id);
            const mine = view.answers?.[q.id];
            const ok = mine !== undefined && k && Number(mine) === k.correct;
            return (
              <div key={q.id} className={"card p-4 " + (mine === undefined ? "" : ok ? "border-green-200" : "border-red-200")}>
                <p className="text-sm text-slate-500">Q{n + 1}{q.chapter ? ` · ${q.chapter}` : ""} · {mine === undefined ? "Skipped" : ok ? `+${test.marks_correct}` : `−${test.marks_wrong}`}</p>
                <p className="mt-1 whitespace-pre-wrap font-semibold">{q.question}</p>
                {q.image_url && <img src={q.image_url} alt="" className="mt-2 max-h-56 rounded-lg border" />}
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, i) => (
                    <p key={i} className={"rounded-lg px-3 py-1.5 text-sm " + (k?.correct === i ? "bg-green-100 text-green-900" : Number(mine) === i ? "bg-red-100 text-red-900" : "bg-slate-50")}>{LETTERS[i]}. {o}</p>
                  ))}
                </div>
                {k?.explanation && <p className="mt-2 text-sm text-slate-600"><b>Explanation:</b> {k.explanation}</p>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
