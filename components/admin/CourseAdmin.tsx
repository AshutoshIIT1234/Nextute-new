"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Course = { slug: string; title: string; price: number; mentor_name: string | null; mentor_photo: string | null; batch_start: string | null; is_active: boolean };

export default function CourseAdmin({ course, adminId }: { course: Course; adminId: string }) {
  const sb = createClient();
  const router = useRouter();
  const [c, setC] = useState(course);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return setMsg("Photo too large — max 8 MB.");
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${adminId}/mentor-${c.slug}-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file, { cacheControl: "31536000" });
    if (error) { setBusy(false); return setMsg("Upload failed: " + error.message); }
    const url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    const { error: e2 } = await sb.from("courses").update({ mentor_photo: url }).eq("slug", c.slug);
    setBusy(false);
    if (e2) return setMsg(e2.message);
    setC({ ...c, mentor_photo: url });
    setMsg("Mentor photo updated ✓");
    router.refresh();
  }

  async function save() {
    setBusy(true);
    const { error } = await sb.from("courses").update({ title: c.title, price: c.price, mentor_name: c.mentor_name, batch_start: c.batch_start, is_active: c.is_active }).eq("slug", c.slug);
    setBusy(false);
    setMsg(error ? error.message : "Saved ✓");
    router.refresh();
  }

  return (
    <div className="card grid gap-5 p-5 md:grid-cols-[160px_1fr]">
      <label className="relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500 hover:ring-2 hover:ring-teal">
        {c.mentor_photo ? <img src={c.mentor_photo} alt="" className="h-full w-full object-cover" /> : <span className="flex flex-col items-center gap-1 text-xs"><ImagePlus /> Upload mentor photo</span>}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/60"><Loader2 className="animate-spin" /></span>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} /></div>
        <div><label className="label">Price (₹)</label><input className="input" inputMode="numeric" value={c.price} onChange={(e) => setC({ ...c, price: Number(e.target.value.replace(/\D/g, "")) || 0 })} /></div>
        <div><label className="label">Batch starts</label><input className="input" value={c.batch_start || ""} onChange={(e) => setC({ ...c, batch_start: e.target.value })} /></div>
        <div><label className="label">Mentor</label><input className="input" value={c.mentor_name || ""} onChange={(e) => setC({ ...c, mentor_name: e.target.value })} /></div>
        <label className="flex items-center gap-2 self-end text-sm"><input type="checkbox" className="accent-teal" checked={c.is_active} onChange={(e) => setC({ ...c, is_active: e.target.checked })} /> Open for enrolment</label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button onClick={save} disabled={busy} className="btn-primary"><Save size={16} /> Save</button>
          <a href={`/courses/${c.slug}`} target="_blank" className="btn-outline">View page</a>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </div>
    </div>
  );
}
