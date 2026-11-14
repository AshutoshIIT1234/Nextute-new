import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio, PlayCircle, FileText, ClipboardCheck, CalendarClock, Clock, Lock, ChevronRight, Trophy } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { courseAccess, liveState, testState, fmtDateTime, groupBy, type Video, type Note, type Test } from "@/lib/learn";
import NoteButton from "@/components/learn/NoteButton";
import ReattemptButton from "@/components/learn/ReattemptButton";
import { TestsTrendChart } from "@/components/learn/Charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "My course" };

const TABS = [
  ["live", "Live classes", Radio],
  ["recorded", "Recorded lectures", PlayCircle],
  ["notes", "Class notes", FileText],
  ["tests", "Test series", ClipboardCheck],
] as const;

export default async function LearnCourse({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = TABS.some(([k]) => k === rawTab) ? rawTab! : "live";
  const { supabase, user, profile } = await getSession();
  if (!user) redirect(`/login?next=/learn/${slug}`);
  const { course, isAdmin, isMentor, isEnrolled } = await courseAccess(supabase, slug, user, profile);
  if (!course) redirect("/courses");
  if (!isAdmin && !isMentor && !isEnrolled) redirect(`/courses/${slug}`);

  const [{ data: videos }, { data: notes }, { data: tests }, { data: attempts }] = await Promise.all([
    supabase.from("course_videos").select("*").eq("course_slug", slug).order("starts_at", { ascending: true, nullsFirst: false }),
    supabase.from("course_notes").select("*").eq("course_slug", slug).order("created_at", { ascending: false }),
    supabase.from("course_tests").select("*").eq("course_slug", slug).eq("is_published", true).order("starts_at", { ascending: true, nullsFirst: false }),
    supabase.rpc("my_test_overview", { p_slug: slug }),
  ]);
  const all = (videos || []) as Video[];
  const live = all.filter((v) => v.kind === "live" && liveState(v) !== "ended");
  const recorded = all.filter((v) => v.kind === "recorded").sort((a, b) => +new Date(b.starts_at || b.created_at) - +new Date(a.starts_at || a.created_at));
  const notesList = (notes || []) as Note[];
  const testList = (tests || []) as Test[];
  const overview = (Array.isArray(attempts) ? attempts : []) as any[];
  const attemptBy = new Map(overview.map((a: any) => [a.test_id, a]));
  const attempted = overview.filter((o) => Number(o.attempts) > 0);
  const counts: Record<string, number> = { live: live.length, recorded: recorded.length, notes: notesList.length, tests: testList.length };
  const liveNow = live.find((v) => liveState(v) === "live");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl bg-[#0f1f33] p-6 text-white md:p-8">
        <p className="text-sm text-white/70">My course</p>
        <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{course.title}</h1>
        <p className="mt-1 text-sm text-white/70">Mentor {course.mentor_name} · Starts {course.batch_start}</p>
        {(isMentor || isAdmin) && <Link href={`/mentor/${slug}`} className="mt-3 inline-block text-sm font-semibold text-amber-300 underline">Open mentor dashboard →</Link>}
        {liveNow && (
          <Link href={`/learn/${slug}/watch/${liveNow.id}`} className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-red-600 p-4 hover:bg-red-700">
            <span className="flex items-center gap-3"><span className="h-3 w-3 animate-pulse rounded-full bg-white" /><span><b>Live now:</b> {liveNow.title}</span></span>
            <span className="btn bg-white text-red-700">Join class</span>
          </Link>
        )}
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {TABS.map(([k, label, Icon]) => (
          <Link key={k} href={`/learn/${slug}?tab=${k}`} className={"flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold " + (tab === k ? "bg-navy text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-teal")}>
            <Icon size={16} /> {label} <span className={"rounded-full px-1.5 text-xs " + (tab === k ? "bg-white/20" : "bg-slate-100")}>{counts[k]}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "live" && (
          live.length === 0 ? <Empty text="No live classes scheduled right now. Your mentor will add the next class here." /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {live.map((v) => {
                const st = liveState(v);
                return (
                  <div key={v.id} className="card flex flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold">{v.title}</p>
                      {st === "live" ? <span className="badge bg-red-100 text-red-700">● LIVE</span> : <span className="badge bg-amber-100 text-amber-800">Upcoming</span>}
                    </div>
                    {v.chapter && <p className="text-sm text-slate-500">{v.chapter}</p>}
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600"><CalendarClock size={15} /> {fmtDateTime(v.starts_at)} · {v.duration_min || 60} min</p>
                    {v.description && <p className="mt-2 text-sm text-slate-600">{v.description}</p>}
                    <div className="mt-4">
                      {st === "live" ? <Link href={`/learn/${slug}/watch/${v.id}`} className="btn bg-red-600 text-white hover:bg-red-700">Join live class</Link>
                        : <span className="btn cursor-default bg-slate-100 text-slate-500"><Lock size={14} /> Opens 15 min before start</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "recorded" && (
          recorded.length === 0 ? <Empty text="Recordings appear here after each live class." /> : (
            <div className="space-y-6">
              {groupBy(recorded, (v) => v.chapter || "General").map(([ch, list]) => (
                <section key={ch}>
                  <h2 className="mb-2 font-bold text-navy">{ch}</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((v) => (
                      <Link key={v.id} href={`/learn/${slug}/watch/${v.id}`} className="card group overflow-hidden hover:border-teal">
                        <div className="relative aspect-video bg-[#0f1f33]">
                          <img src={`https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-80" />
                          <PlayCircle size={44} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
                        </div>
                        <div className="p-4">
                          <p className="font-semibold group-hover:text-teal">{v.title}</p>
                          <p className="text-xs text-slate-500">{fmtDateTime(v.starts_at || v.created_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {tab === "notes" && (
          notesList.length === 0 ? <Empty text="Your mentor's class notes will appear here." /> : (
            <div className="space-y-6">
              {groupBy(notesList, (n) => n.chapter || "General").map(([ch, list]) => (
                <section key={ch}>
                  <h2 className="mb-2 font-bold text-navy">{ch}</h2>
                  <div className="card divide-y divide-slate-100">
                    {list.map((n) => (
                      <div key={n.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><FileText size={18} /></span>
                          <div><p className="font-semibold">{n.title}</p><p className="text-xs text-slate-500">{fmtDateTime(n.created_at)}{n.size_bytes ? ` · ${(n.size_bytes / 1048576).toFixed(1)} MB` : ""}</p></div>
                        </div>
                        <NoteButton path={n.file_path} label="View notes" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        )}

        {tab === "tests" && (
          testList.length === 0 ? <Empty text="Tests will be published here by your mentor." /> : (
            <div className="space-y-6">
              {attempted.length > 0 && (
                <section className="card p-5">
                  <h2 className="flex items-center gap-2 font-bold"><Trophy size={18} className="text-teal" /> My performance</h2>
                  <p className="text-xs text-slate-500">Your best marks and rank in every test you attempted. Rank uses each student&apos;s best attempt.</p>
                  {attempted.length > 1 && <div className="mt-4"><TestsTrendChart rows={attempted.map((o) => ({ title: o.title, you: o.best, average: o.average, topper: o.topper, max: Number(o.max_marks) }))} /></div>}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="py-2">Test</th><th>Attempts</th><th>Best marks</th><th>Rank</th><th>Topper</th><th>Average</th><th>Lowest</th><th></th></tr></thead>
                      <tbody>
                        {attempted.map((o) => (
                          <tr key={o.test_id} className="border-b border-slate-50">
                            <td className="py-2.5 font-semibold">{o.title}</td>
                            <td>{o.attempts}</td>
                            <td className="font-bold text-navy">{o.best} <span className="font-normal text-slate-400">/ {o.max_marks}</span></td>
                            <td className="font-bold text-teal">#{o.rank} <span className="font-normal text-slate-400">of {o.participants}</span></td>
                            <td>{o.topper}</td><td>{o.average}</td><td>{o.lowest}</td>
                            <td><Link href={`/learn/${slug}/test/${o.test_id}`} className="text-xs font-semibold text-teal hover:underline">Report →</Link></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {testList.map((t) => {
                  const a: any = attemptBy.get(t.id);
                  const tried = a && Number(a.attempts) > 0;
                  const st = testState(t);
                  return (
                    <div key={t.id} className="card flex flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold">{t.title}</p>
                        {tried ? <span className="badge bg-green-100 text-green-800">{a.attempts} attempt{Number(a.attempts) > 1 ? "s" : ""}</span> : st === "upcoming" ? <span className="badge bg-amber-100 text-amber-800">Upcoming</span> : st === "closed" ? <span className="badge bg-slate-100 text-slate-600">Closed</span> : <span className="badge bg-teal-50 text-teal">Open</span>}
                      </div>
                      {t.syllabus && <p className="mt-1 text-sm text-slate-600"><b>Syllabus:</b> {t.syllabus}</p>}
                      <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={14} /> {t.duration_min} min</span>
                        <span>+{t.marks_correct} / −{t.marks_wrong}</span>
                        {t.starts_at && <span className="flex items-center gap-1"><CalendarClock size={14} /> {fmtDateTime(t.starts_at)}</span>}
                      </p>
                      {tried && <p className="mt-2 text-sm"><b className="text-navy">Best {a.best}</b> / {a.max_marks} · <b className="text-teal">Rank #{a.rank}</b> of {a.participants}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tried ? (
                          <>
                            <Link href={`/learn/${slug}/test/${t.id}`} className="btn-outline"><Trophy size={15} /> View report <ChevronRight size={14} /></Link>
                            {st === "open" && <ReattemptButton testId={t.id} href={`/learn/${slug}/test/${t.id}`} className="btn-primary" />}
                          </>
                        ) : st === "open" ? <Link href={`/learn/${slug}/test/${t.id}`} className="btn-primary">Start test</Link>
                          : st === "upcoming" ? <span className="btn cursor-default bg-slate-100 text-slate-500"><Lock size={14} /> Opens {fmtDateTime(t.starts_at)}</span>
                          : <span className="text-sm text-slate-500">This test is closed.</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="card p-10 text-center text-slate-500">{text}</p>;
}
