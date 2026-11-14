import { FileText, CalendarRange, ClipboardCheck, BarChart3, Clock, Printer, IndianRupee, Sparkles, Trophy, Target } from "lucide-react";

export const APP_LAUNCH = "25 November 2026";

/** Marketing block for the Nextute Partner App (test ecosystem, lecture planner, class notes). */
export default function PartnerAppFeatures({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-red-700">Today&apos;s test process</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {[
              [Clock, "Teachers or helpers pick questions by hand"],
              [Printer, "Print, distribute and collect papers"],
              [ClipboardCheck, "Check every copy and hand back answer sheets"],
              [IndianRupee, "Hours of staff time and printing cost every week"],
            ].map(([I, t]) => { const Icon = I as typeof Clock; return <li key={t as string} className="flex items-start gap-2"><Icon size={16} className="mt-0.5 shrink-0 text-red-500" /> {t as string}</li>; })}
          </ul>
        </div>
        <div className="rounded-2xl border border-green-100 bg-leaf-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-green-800">With the Nextute Partner App</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {[
              "Your own personalised institute dashboard",
              "Tests created, taken and checked online — no printing",
              "Instant results and chapter-wise reports for every student",
              "Notes and lecture plan always available to students",
            ].map((t) => <li key={t} className="flex items-start gap-2"><Sparkles size={16} className="mt-0.5 shrink-0 text-green-700" /> {t}</li>)}
          </ul>
        </div>
      </div>

      <div className={"grid gap-4 " + (compact ? "md:grid-cols-3" : "md:grid-cols-3")}>
        <div className="card p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal"><FileText size={20} /></span>
          <h3 className="mt-3 font-bold">Class notes</h3>
          <p className="mt-1 text-sm text-slate-600">Upload notes lecture-wise, chapter-wise or subject-wise. Students view and download them anytime.</p>
        </div>
        <div className="card p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal"><CalendarRange size={20} /></span>
          <h3 className="mt-3 font-bold">Lecture planner</h3>
          <p className="mt-1 text-sm text-slate-600">Show how many days each chapter takes and which topic is covered on which day — students and parents always know the plan.</p>
        </div>
        <div className="card p-5">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal"><ClipboardCheck size={20} /></span>
          <h3 className="mt-3 font-bold">Test series</h3>
          <p className="mt-1 text-sm text-slate-600">Schedule tests with syllabus, marks and duration. Students take them online and get results the moment they finish.</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <div className="p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-navy"><BarChart3 size={18} className="text-teal" /> Detailed report after every test</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><Target size={16} className="mt-0.5 shrink-0 text-teal" /> Chapter-wise analysis — how many questions right from each chapter</li>
              <li className="flex gap-2"><Trophy size={16} className="mt-0.5 shrink-0 text-teal" /> Compare with topper&apos;s marks, class average and lowest marks</li>
              <li className="flex gap-2"><Sparkles size={16} className="mt-0.5 shrink-0 text-teal" /> Where to improve and a strategy for the next test</li>
            </ul>
          </div>
          <div className="bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase text-slate-400">Sample report · Physics Test 4</p>
            <div className="mt-3 space-y-2 text-sm">
              {[["Kinematics", 90], ["Laws of Motion", 70], ["Work & Energy", 45]].map(([c, v]) => (
                <div key={c as string}>
                  <div className="flex justify-between text-xs"><span>{c as string}</span><span className="font-semibold">{v as number}%</span></div>
                  <div className="mt-1 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full brand-gradient" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              {[["You", "68"], ["Topper", "92"], ["Average", "61"], ["Lowest", "24"]].map(([l, v]) => (
                <div key={l} className="rounded-lg bg-white p-2 shadow-sm"><p className="text-base font-extrabold text-navy">{v}</p><p className="text-slate-500">{l}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
