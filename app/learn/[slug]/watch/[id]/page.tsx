import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, PlayCircle } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { courseAccess, liveState, fmtDateTime, type Video } from "@/lib/learn";
import SecurePlayer from "@/components/learn/SecurePlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Class", robots: { index: false } };

export default async function Watch({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { supabase, user, profile } = await getSession();
  if (!user) redirect(`/login?next=/learn/${slug}/watch/${id}`);
  const { course, isAdmin, isMentor, isEnrolled } = await courseAccess(supabase, slug, user, profile);
  if (!course) notFound();
  if (!isAdmin && !isMentor && !isEnrolled) redirect(`/courses/${slug}`);
  const { data } = await supabase.from("course_videos").select("*").eq("id", id).eq("course_slug", slug).maybeSingle();
  const v = data as Video | null;
  if (!v) notFound();
  const st = v.kind === "live" ? liveState(v) : "recorded";
  const canWatch = st !== "upcoming" || isMentor || isAdmin;
  const { data: more } = await supabase.from("course_videos").select("id,title,chapter,starts_at,created_at").eq("course_slug", slug).eq("kind", "recorded").neq("id", id).order("created_at", { ascending: false }).limit(8);
  const watermark = `${profile?.full_name || user.email} · ${profile?.phone || user.email}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link href={`/learn/${slug}?tab=${v.kind === "live" ? "live" : "recorded"}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-teal"><ArrowLeft size={16} /> Back to course</Link>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {canWatch ? (
            <SecurePlayer videoId={v.youtube_id} watermark={watermark} live={st === "live"} />
          ) : (
            <div className="grid aspect-video place-items-center rounded-2xl bg-[#0f1f33] p-6 text-center text-white">
              <div><CalendarClock className="mx-auto text-amber-300" size={40} /><p className="mt-3 text-lg font-bold">Class starts {fmtDateTime(v.starts_at)}</p><p className="text-sm text-white/70">The class opens here 15 minutes before it starts.</p></div>
            </div>
          )}
          <h1 className="mt-4 text-xl font-extrabold text-navy md:text-2xl">{v.title}</h1>
          <p className="text-sm text-slate-500">{[v.chapter, fmtDateTime(v.starts_at || v.created_at)].filter(Boolean).join(" · ")}</p>
          {v.description && <p className="mt-3 text-slate-700">{v.description}</p>}
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">This lecture is only for enrolled Nextute students. Please don&apos;t share or record it.</p>
        </div>
        <aside>
          <h2 className="mb-2 font-bold">More recordings</h2>
          <div className="card divide-y divide-slate-100">
            {(more || []).length === 0 && <p className="p-4 text-sm text-slate-500">No other recordings yet.</p>}
            {(more || []).map((m: any) => (
              <Link key={m.id} href={`/learn/${slug}/watch/${m.id}`} className="flex items-start gap-3 p-3 hover:bg-slate-50">
                <PlayCircle size={18} className="mt-0.5 shrink-0 text-teal" />
                <span><span className="block text-sm font-semibold">{m.title}</span><span className="text-xs text-slate-500">{m.chapter || fmtDateTime(m.starts_at || m.created_at)}</span></span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
