"use client";
import { useState } from "react";
import { Upload, Loader2, Trash2, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtDateTime, type Note } from "@/lib/learn";
import NoteButton from "@/components/learn/NoteButton";

export default function NotesManager({ slug, initial }: { slug: string; initial: Note[] }) {
  const sb = createClient();
  const [rows, setRows] = useState(initial);
  const [title, setTitle] = useState("");
  const [chapter, setChapter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!file) return setErr("Choose a PDF or image file.");
    if (file.size > 50 * 1024 * 1024) return setErr("File too large — max 50 MB.");
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${slug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error: upErr } = await sb.storage.from("course-files").upload(path, file, { contentType: file.type || undefined });
    if (upErr) { setBusy(false); return setErr("Upload failed: " + upErr.message); }
    const { data, error } = await sb.from("course_notes").insert({
      course_slug: slug, title: title.trim() || file.name.replace(/\.[^.]+$/, ""), chapter: chapter.trim() || null,
      file_path: path, file_name: file.name, size_bytes: file.size,
    }).select("*").single();
    setBusy(false);
    if (error) return setErr(error.message);
    setRows([data as Note, ...rows]);
    setTitle(""); setFile(null);
    const input = document.getElementById("note-file") as HTMLInputElement | null;
    if (input) input.value = "";
  }
  async function remove(n: Note) {
    if (!confirm(`Delete "${n.title}"?`)) return;
    await sb.storage.from("course-files").remove([n.file_path]);
    const { error } = await sb.from("course_notes").delete().eq("id", n.id);
    if (error) return alert(error.message);
    setRows(rows.filter((r) => r.id !== n.id));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={upload} className="card h-fit space-y-3 p-5">
        <h2 className="font-bold">Upload notes</h2>
        <div><label className="label">Title</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lecture 3 — Quadratic equations notes" /></div>
        <div><label className="label">Chapter / subject</label><input className="input" value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="e.g. Algebra" /></div>
        <div>
          <label className="label">File (PDF or image) *</label>
          <input id="note-file" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:font-semibold file:text-teal" />
        </div>
        {err && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{err}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload</button>
        <p className="text-xs text-slate-500">Files are private — only enrolled students of this course can open them.</p>
      </form>
      <div className="card divide-y divide-slate-100">
        {rows.length === 0 && <p className="p-6 text-sm text-slate-500">No notes uploaded yet.</p>}
        {rows.map((n) => (
          <div key={n.id} className="flex flex-wrap items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><FileText size={18} /></span>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{n.title}</p><p className="text-xs text-slate-500">{[n.chapter, fmtDateTime(n.created_at), n.size_bytes ? `${(n.size_bytes / 1048576).toFixed(1)} MB` : null].filter(Boolean).join(" · ")}</p></div>
            <NoteButton path={n.file_path} />
            <button onClick={() => remove(n)} className="p-1.5 text-red-600" aria-label="Delete"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
