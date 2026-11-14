"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Radio, PlayCircle, ArrowRightLeft, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { youtubeId } from "@/lib/utils";
import { liveState, fmtDateTime, type Video } from "@/lib/learn";

const EMPTY = { kind: "live" as "live" | "recorded", title: "", chapter: "", description: "", link: "", starts_at: "", duration_min: "90" };

export default function VideoManager({ slug, initial }: { slug: string; initial: Video[] }) {
  const sb = createClient();
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const id = youtubeId(f.link.trim()) || (/^[\w-]{11}$/.test(f.link.trim()) ? f.link.trim() : null);
    if (!f.title.trim()) return setErr("Enter a class title.");
    if (!id) return setErr("Paste a valid YouTube link, e.g. https://youtube.com/live/XXXXXXXXXXX or https://youtu.be/XXXXXXXXXXX");
    if (f.kind === "live" && !f.starts_at) return setErr("Choose the class date and time.");
    setBusy(true);
    const { data, error } = await sb.from("course_videos").insert({
      course_slug: slug, kind: f.kind, title: f.title.trim(), chapter: f.chapter.trim() || null, description: f.description.trim() || null,
      youtube_id: id, starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, duration_min: Number(f.duration_min) || 60,
    }).select("*").single();
    setBusy(false);
    if (error) return setErr(error.message);
    setRows([data as Video, ...rows]);
    setF({ ...EMPTY, kind: f.kind, chapter: f.chapter });
    router.refresh();
  }
  async function toRecorded(v: Video) {
    const { error } = await sb.from("course_videos").update({ kind: "recorded" }).eq("id", v.id);
    if (error) return alert(error.message);
    setRows(rows.map((r) => (r.id === v.id ? { ...r, kind: "recorded" } : r)));
  }
  async function remove(v: Video) {
    if (!confirm(`Delete "${v.title}"? Students will no longer see it.`)) return;
    const { error } = await sb.from("course_videos").delete().eq("id", v.id);
    if (error) return alert(error.message);
    setRows(rows.filter((r) => r.id !== v.id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={add} className="card h-fit space-y-3 p-5">
        <h2 className="font-bold">Add a class</h2>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {(["live", "recorded"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setF({ ...f, kind: k })} className={"flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold " + (f.kind === k ? "bg-white text-teal shadow" : "text-slate-600")}>
              {k === "live" ? <Radio size={15} /> : <PlayCircle size={15} />} {k === "live" ? "Live class" : "Recording"}
            </button>
          ))}
        </div>
        <div><label className="label">Title *</label><input className="input" value={f.title} onChange={up("title")} placeholder="e.g. Quadratic equations — Lecture 3" /></div>
        <div><label className="label">Chapter</label><input className="input" value={f.chapter} onChange={up("chapter")} placeholder="e.g. Algebra" /></div>
        <div><label className="label">YouTube link *</label><input className="input" value={f.link} onChange={up("link")} placeholder="https://youtube.com/live/…" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">{f.kind === "live" ? "Starts at *" : "Class date"}</label><input type="datetime-local" className="input" value={f.starts_at} onChange={up("starts_at")} /></div>
          <div><label className="label">Duration (min)</label><input inputMode="numeric" className="input" value={f.duration_min} onChange={up("duration_min")} /></div>
        </div>
        <div><label className="label">Description</label><textarea rows={2} className="input" value={f.description} onChange={up("description")} placeholder="Topics covered, homework…" /></div>
        {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} {f.kind === "live" ? "Schedule live class" : "Add recording"}</button>
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          <p className="flex items-center gap-1 font-bold"><Info size={14} /> YouTube setting</p>
          <p className="mt-1">In YouTube Studio set the stream / video visibility to <b>Unlisted</b> (not Private — Private videos can&apos;t play on websites) and keep it off your channel playlists. After the live class ends, the same link becomes the recording — just click <b>Move to recordings</b>.</p>
        </div>
      </form>

      <div className="space-y-6">
        {(["live", "recorded"] as const).map((kind) => {
          const list = rows.filter((r) => r.kind === kind);
          return (
            <section key={kind}>
              <h2 className="mb-2 font-bold">{kind === "live" ? "Live classes" : "Recorded lectures"} <span className="text-sm font-normal text-slate-500">({list.length})</span></h2>
              <div className="card divide-y divide-slate-100">
                {list.length === 0 && <p className="p-5 text-sm text-slate-500">Nothing here yet.</p>}
                {list.map((v) => {
                  const st = kind === "live" ? liveState(v) : null;
                  return (
                    <div key={v.id} className="flex flex-wrap items-center gap-3 p-4">
                      <img src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`} alt="" className="h-12 w-20 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{v.title}</p>
                        <p className="text-xs text-slate-500">{[v.chapter, fmtDateTime(v.starts_at || v.created_at), st === "live" ? "● LIVE NOW" : st === "ended" ? "ended" : st === "upcoming" ? "upcoming" : null].filter(Boolean).join(" · ")}</p>
                      </div>
                      {kind === "live" && <button onClick={() => toRecorded(v)} className="btn-outline py-1.5 text-xs"><ArrowRightLeft size={14} /> Move to recordings</button>}
                      <a href={`/learn/${slug}/watch/${v.id}`} target="_blank" className="btn-ghost py-1.5 text-xs">Preview</a>
                      <button onClick={() => remove(v)} className="p-1.5 text-red-600" aria-label="Delete"><Trash2 size={16} /></button>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
