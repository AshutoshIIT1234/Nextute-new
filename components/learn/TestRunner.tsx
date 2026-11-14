"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Send, ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Question, Test } from "@/lib/learn";

const LETTERS = ["A", "B", "C", "D", "E"];

export default function TestRunner({ test, started, attemptNo = 1 }: { test: Test; started: string | null; attemptNo?: number }) {
  const sb = createClient();
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "running" | "submitting">(started ? "running" : "intro");
  const [startedAt, setStartedAt] = useState<string | null>(started);
  const [qs, setQs] = useState<Question[]>([]);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [flag, setFlag] = useState<Record<string, boolean>>({});
  const [i, setI] = useState(0);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());
  const key = `nt-test-${test.id}`;
  const submitted = useRef(false);

  async function load() {
    const { data, error } = await sb.from("test_questions").select("*").eq("test_id", test.id).order("position");
    if (error) return setErr(error.message);
    setQs((data || []) as Question[]);
    try { const saved = JSON.parse(localStorage.getItem(key) || "{}"); if (saved && typeof saved === "object") setAns(saved); } catch {}
  }
  useEffect(() => { if (started) load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(ans)); } catch {} }, [ans, key]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const endsAt = startedAt ? new Date(startedAt).getTime() + test.duration_min * 60000 : 0;
  const left = Math.max(0, Math.floor((endsAt - now) / 1000));
  useEffect(() => { if (phase === "running" && startedAt && qs.length && left === 0) submit(true); /* eslint-disable-next-line */ }, [left, phase, qs.length]);

  async function begin() {
    setErr("");
    const { data, error } = await sb.rpc("start_test", { p_test: test.id });
    if (error) return setErr(error.message);
    setStartedAt((data as any).started_at);
    setPhase("running");
    await load();
  }

  async function submit(auto = false) {
    if (submitted.current) return;
    if (!auto) {
      const unanswered = qs.length - Object.keys(ans).length;
      if (!confirmSubmit(unanswered)) return;
    }
    submitted.current = true;
    setPhase("submitting");
    const { error } = await sb.rpc("submit_test", { p_test: test.id, p_answers: ans });
    if (error) { submitted.current = false; setPhase("running"); return setErr(error.message); }
    try { localStorage.removeItem(key); } catch {}
    router.refresh();
  }

  const q = qs[i];
  const answered = useMemo(() => Object.keys(ans).length, [ans]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");

  if (phase === "intro")
    return (
      <div className="card mx-auto max-w-2xl p-6 md:p-8">
        <p className="text-sm font-semibold text-teal">{attemptNo > 1 ? `Attempt ${attemptNo}` : "First attempt"}</p>
        <h1 className="text-2xl font-extrabold text-navy">{test.title}</h1>
        {test.syllabus && <p className="mt-2 text-slate-600"><b>Syllabus:</b> {test.syllabus}</p>}
        <ul className="mt-5 space-y-2 text-sm text-slate-700">
          <li>• Duration: <b>{test.duration_min} minutes</b> — the timer starts when you click Start and can&apos;t be paused.</li>
          <li>• Marking: <b>+{test.marks_correct}</b> for a correct answer, <b>−{test.marks_wrong}</b> for a wrong answer, 0 for unanswered.</li>
          <li>• The test submits automatically when time runs out. You can reattempt it later to improve — your best score decides your rank.</li>
        </ul>
        {err && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <button onClick={begin} className="btn-primary mt-6 w-full py-3">Start test</button>
      </div>
    );

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="card p-5 md:p-6">
        {!q ? <p className="flex items-center gap-2 text-slate-500"><Loader2 className="animate-spin" size={16} /> Loading questions…</p> : (
          <>
            <div className="flex items-center justify-between gap-2 text-sm text-slate-500">
              <span>Question {i + 1} of {qs.length}{q.chapter ? ` · ${q.chapter}` : ""}</span>
              <button onClick={() => setFlag({ ...flag, [q.id]: !flag[q.id] })} className={"flex items-center gap-1 text-xs font-semibold " + (flag[q.id] ? "text-amber-600" : "text-slate-400")}><Flag size={14} /> {flag[q.id] ? "Marked for review" : "Mark for review"}</button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-lg font-semibold text-slate-900">{q.question}</p>
            {q.image_url && <img src={q.image_url} alt="" className="mt-3 max-h-72 rounded-xl border" />}
            <div className="mt-5 space-y-2">
              {q.options.map((o, k) => (
                <button key={k} onClick={() => setAns({ ...ans, [q.id]: k })} className={"flex w-full items-start gap-3 rounded-xl border p-3 text-left transition " + (ans[q.id] === k ? "border-teal bg-teal-50" : "border-slate-200 hover:border-teal")}>
                  <span className={"grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold " + (ans[q.id] === k ? "bg-teal text-white" : "bg-slate-100")}>{LETTERS[k]}</span>
                  <span className="pt-0.5">{o}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <button onClick={() => { const n = { ...ans }; delete n[q.id]; setAns(n); }} className="btn-ghost text-sm">Clear answer</button>
              <div className="flex gap-2">
                <button disabled={i === 0} onClick={() => setI(i - 1)} className="btn-outline"><ChevronLeft size={16} /> Previous</button>
                {i < qs.length - 1 ? <button onClick={() => setI(i + 1)} className="btn-primary">Next <ChevronRight size={16} /></button>
                  : <button onClick={() => submit()} className="btn-primary"><Send size={16} /> Submit</button>}
              </div>
            </div>
          </>
        )}
        {err && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      </div>
      <aside className="card h-fit p-5 lg:sticky lg:top-20">
        <p className={"flex items-center gap-2 text-2xl font-extrabold " + (left < 300 ? "text-red-600" : "text-navy")}><Clock size={22} /> {mm}:{ss}</p>
        <p className="text-xs text-slate-500">{answered} of {qs.length} answered</p>
        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {qs.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} className={"h-8 rounded-lg text-xs font-bold " + (k === i ? "ring-2 ring-navy " : "") + (flag[x.id] ? "bg-amber-400 text-white" : ans[x.id] !== undefined ? "bg-teal text-white" : "bg-slate-100 text-slate-600")}>{k + 1}</button>
          ))}
        </div>
        <button onClick={() => submit()} disabled={phase === "submitting"} className="btn-primary mt-5 w-full">{phase === "submitting" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit test</button>
      </aside>
    </div>
  );
}

function confirmSubmit(unanswered: number) {
  return window.confirm(unanswered > 0 ? `You have ${unanswered} unanswered question(s). Submit anyway?` : "Submit your test now?");
}
