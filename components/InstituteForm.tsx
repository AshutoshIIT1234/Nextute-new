"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Plus, Trash2, Upload, Video, Youtube, X, Save, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CITIES, CLASSES, EXAMS, BOARDS, FACILITIES, MODES, COURSE_TYPES, SUBJECTS } from "@/lib/constants";
import { areasFor, districtLabel } from "@/lib/bihar";
import { slugify, youtubeId, type Institute, type DemoVideo, type Faculty, type Batch } from "@/lib/utils";

type Mode = "owner" | "admin";
type Props = { initial?: Partial<Institute> | null; mode: Mode; userId: string; ownerEmail?: string | null };

const EMPTY: Partial<Institute> = {
  name: "", tagline: "", description: "", city: "Patna", area: "", address: "", pincode: "", map_url: "",
  contact_name: "", phone: "", whatsapp: "", email: "", website: "", established_year: undefined,
  classes: [], exams: [], subjects: [], boards: [], mode: "Offline", gender: "Co-ed",
  fee_min: undefined, fee_max: undefined, fee_note: "", scholarship: "", batch_size: undefined, timings: "",
  facilities: [], cover_image: "", photos: [], demo_videos: [], faculty: [], batches: [], results: [], course_types: ["Full course"],
};

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function ChipPicker({ options, value, onChange, allowCustom = false }: { options: string[]; value: string[]; onChange: (v: string[]) => void; allowCustom?: boolean }) {
  const [custom, setCustom] = useState("");
  const all = [...new Set([...options, ...value])];
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {all.map((o) => (
          <button type="button" key={o} onClick={() => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])} className={value.includes(o) ? "chip-active" : "chip"}>{o}</button>
        ))}
      </div>
      {allowCustom && (
        <div className="mt-2 flex max-w-sm gap-2">
          <input className="input py-2" placeholder="Add other…" value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (custom.trim()) { onChange([...value, custom.trim()]); setCustom(""); } } }} />
          <button type="button" className="btn-outline py-2" onClick={() => { if (custom.trim()) { onChange([...value, custom.trim()]); setCustom(""); } }}>Add</button>
        </div>
      )}
    </div>
  );
}

export default function InstituteForm({ initial, mode, userId, ownerEmail }: Props) {
  const router = useRouter();
  const sb = createClient();
  const [f, setF] = useState<Partial<Institute>>({ ...EMPTY, ...(initial || {}) });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [owner, setOwner] = useState(ownerEmail || "");
  const [yt, setYt] = useState({ title: "", teacher: "", subject: "", url: "" });
  const isNew = !initial?.id;
  const set = <K extends keyof Institute>(k: K, v: Institute[K] | any) => setF((p) => ({ ...p, [k]: v }));
  const txt = (k: keyof Institute) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value);
  const num = (k: keyof Institute) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value === "" ? null : Number(e.target.value.replace(/\D/g, "")));

  async function upload(file: File, kind: string): Promise<string | null> {
    const max = kind === "video" ? 50 : 8;
    if (file.size > max * 1024 * 1024) { setErr(`File too large — max ${max} MB${kind === "video" ? ". For longer videos, paste a YouTube link instead." : "."}`); return null; }
    setUploading(kind);
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `${userId}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const { error } = await sb.storage.from("media").upload(path, file, { cacheControl: "31536000", upsert: false });
    setUploading(null);
    if (error) { setErr("Upload failed: " + error.message); return null; }
    return sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }

  async function onPhotos(files: FileList | null) {
    if (!files) return;
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 12)) {
      const u = await upload(file, "photo");
      if (u) urls.push(u);
    }
    setF((p) => ({ ...p, photos: [...(p.photos || []), ...urls], cover_image: p.cover_image || urls[0] || "" }));
  }

  function addYoutube() {
    if (!yt.title.trim() || !youtubeId(yt.url)) return setErr("Enter a lecture title and a valid YouTube link.");
    setErr("");
    set("demo_videos", [...(f.demo_videos || []), { ...yt }]);
    setYt({ title: "", teacher: "", subject: "", url: "" });
  }
  async function addVideoFile(file?: File) {
    if (!file) return;
    if (!yt.title.trim()) return setErr("Enter a lecture title first, then choose the video file.");
    const u = await upload(file, "video");
    if (u) { set("demo_videos", [...(f.demo_videos || []), { ...yt, url: u }]); setYt({ title: "", teacher: "", subject: "", url: "" }); setErr(""); }
  }

  function listUpdate<T>(key: "faculty" | "batches" | "results" | "demo_videos", i: number, patch: Partial<T>) {
    const arr = [...((f[key] as any[]) || [])];
    arr[i] = { ...arr[i], ...patch };
    set(key, arr);
  }
  function listRemove(key: "faculty" | "batches" | "results" | "demo_videos" | "photos", i: number) {
    const arr = [...((f[key] as any[]) || [])];
    const [removed] = arr.splice(i, 1);
    if (key === "photos" && removed === f.cover_image) setF((p) => ({ ...p, photos: arr, cover_image: arr[0] || "" }));
    else set(key, arr);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk("");
    if (!f.name?.trim() || !f.area?.trim()) return setErr("Institute name and area are required.");
    if (!f.classes?.length && !f.exams?.length) return setErr("Select at least one class or course.");
    if (f.fee_min && f.fee_max && f.fee_min > f.fee_max) return setErr("Minimum fee can't be higher than maximum fee.");
    setBusy(true);

    const payload: Record<string, any> = {
      name: f.name.trim(), tagline: f.tagline || null, description: f.description || null, city: f.city || "Patna", area: f.area.trim(),
      address: f.address || null, pincode: f.pincode || null, map_url: f.map_url || null, contact_name: f.contact_name || null,
      phone: f.phone || null, whatsapp: f.whatsapp || null, email: f.email || null, website: f.website || null,
      established_year: f.established_year || null, classes: f.classes || [], exams: f.exams || [],
      subjects: (f.subjects || []).map((s) => s.trim()).filter(Boolean), boards: f.boards || [], mode: f.mode || "Offline", gender: f.gender || "Co-ed",
      fee_min: f.fee_min || null, fee_max: f.fee_max || null, fee_note: f.fee_note || null, scholarship: f.scholarship || null,
      batch_size: f.batch_size || null, timings: f.timings || null, facilities: f.facilities || [], cover_image: f.cover_image || null,
      photos: f.photos || [], demo_videos: f.demo_videos || [], faculty: (f.faculty || []).filter((x) => x.name),
      batches: (f.batches || []).filter((x) => x.name), results: (f.results || []).filter((x) => x.text),
      course_types: f.course_types?.length ? f.course_types : ["Full course"],
    };

    if (mode === "admin") {
      payload.status = f.status || "approved";
      payload.rejection_reason = f.status === "rejected" ? f.rejection_reason || null : null;
      payload.is_verified = !!f.is_verified;
      payload.is_featured = !!f.is_featured;
      payload.is_sample = !!f.is_sample;
      if (owner.trim()) {
        const { data: p } = await sb.from("profiles").select("id").eq("email", owner.trim().toLowerCase()).maybeSingle();
        if (!p) { setBusy(false); return setErr(`No account found with email ${owner}. Ask the institute to sign up first.`); }
        payload.owner_id = p.id;
      } else payload.owner_id = null;
    }

    let res;
    if (isNew) {
      payload.slug = `${slugify(f.name)}-${slugify(f.area)}`.slice(0, 70) + "-" + Math.random().toString(36).slice(2, 6);
      res = await sb.from("institutes").insert(payload).select("id, slug").single();
    } else {
      res = await sb.from("institutes").update(payload).eq("id", initial!.id!).select("id, slug").single();
    }
    setBusy(false);
    if (res.error) return setErr(res.error.message);
    setOk(isNew ? "Listing created!" : "Changes saved ✓");
    if (mode === "owner") router.push("/institute?saved=1");
    else router.push(`/admin/institutes?saved=1`);
    router.refresh();
  }

  const areaOptions = [...new Set([...areasFor(f.city || "Patna"), f.area || ""].filter(Boolean))];

  return (
    <form onSubmit={save} className="space-y-6">
      {mode === "admin" && (
        <Section title="Admin controls" desc="Only visible to Nextute admins.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={f.status || "approved"} onChange={txt("status")}>
                <option value="approved">Approved (live)</option><option value="pending">Pending review</option><option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Owner account email (optional)</label>
              <input className="input" placeholder="Link this listing to an institute's login" value={owner} onChange={(e) => setOwner(e.target.value)} />
            </div>
          </div>
          {f.status === "rejected" && <div><label className="label">Rejection reason (shown to owner)</label><input className="input" value={f.rejection_reason || ""} onChange={txt("rejection_reason")} /></div>}
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-teal" checked={!!f.is_verified} onChange={(e) => set("is_verified", e.target.checked)} /> Nextute verified</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-teal" checked={!!f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured</label>
            <label className="flex items-center gap-2"><input type="checkbox" className="accent-teal" checked={!!f.is_sample} onChange={(e) => set("is_sample", e.target.checked)} /> Sample / demo listing</label>
          </div>
        </Section>
      )}

      <Section title="Basic details" desc="This is what students see first.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Institute name *</label><input required className="input" value={f.name || ""} onChange={txt("name")} /></div>
          <div className="sm:col-span-2"><label className="label">Tagline</label><input className="input" maxLength={100} placeholder="e.g. Patna's most trusted NEET coaching since 2012" value={f.tagline || ""} onChange={txt("tagline")} /></div>
          <div className="sm:col-span-2"><label className="label">About the institute</label><textarea rows={5} className="input" placeholder="Teaching approach, achievements, what makes you different…" value={f.description || ""} onChange={txt("description")} /></div>
          <div><label className="label">Established (year)</label><input className="input" inputMode="numeric" maxLength={4} value={f.established_year ?? ""} onChange={num("established_year")} /></div>
          <div>
            <label className="label">Mode of teaching</label>
            <select className="input" value={f.mode} onChange={txt("mode")}>{MODES.map((m) => <option key={m}>{m}</option>)}</select>
          </div>
          <div>
            <label className="label">Students</label>
            <select className="input" value={f.gender || "Co-ed"} onChange={txt("gender")}><option>Co-ed</option><option>Girls only</option><option>Boys only</option></select>
          </div>
        </div>
      </Section>

      <Section title="Location">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">City *</label><select className="input" value={f.city} onChange={txt("city")}>{CITIES.map((c) => <option key={c} value={c}>{districtLabel(c)}</option>)}</select></div>
          <div>
            <label className="label">Area / locality *</label>
            <input required list="areas" className="input" placeholder="Start typing… e.g. Boring Road" value={f.area || ""} onChange={txt("area")} />
            <datalist id="areas">{areaOptions.map((a) => <option key={a} value={a} />)}</datalist>
          </div>
          <div className="sm:col-span-2"><label className="label">Full address</label><input className="input" value={f.address || ""} onChange={txt("address")} /></div>
          <div><label className="label">Pincode</label><input className="input" inputMode="numeric" maxLength={6} value={f.pincode || ""} onChange={txt("pincode")} /></div>
          <div><label className="label">Google Maps link</label><input className="input" placeholder="https://maps.app.goo.gl/…" value={f.map_url || ""} onChange={txt("map_url")} /></div>
        </div>
      </Section>

      <Section title="Contact details" desc="Shown only to signed-in students.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Contact person</label><input className="input" value={f.contact_name || ""} onChange={txt("contact_name")} /></div>
          <div><label className="label">Phone</label><input className="input" inputMode="tel" value={f.phone || ""} onChange={txt("phone")} /></div>
          <div><label className="label">WhatsApp number</label><input className="input" inputMode="tel" value={f.whatsapp || ""} onChange={txt("whatsapp")} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={f.email || ""} onChange={txt("email")} /></div>
          <div className="sm:col-span-2"><label className="label">Website / social page</label><input className="input" placeholder="https://" value={f.website || ""} onChange={txt("website")} /></div>
        </div>
      </Section>

      <Section title="Classes & courses">
        <div><label className="label">Classes taught *</label><ChipPicker options={CLASSES} value={f.classes || []} onChange={(v) => set("classes", v)} /></div>
        <div><label className="label">Competitive exams / courses</label><ChipPicker options={EXAMS} value={f.exams || []} onChange={(v) => set("exams", v)} allowCustom /></div>
        <div><label className="label">Boards</label><ChipPicker options={BOARDS} value={f.boards || []} onChange={(v) => set("boards", v)} /></div>
        <div><label className="label">Course type</label><ChipPicker options={COURSE_TYPES} value={f.course_types || []} onChange={(v) => set("course_types", v)} /><p className="mt-1 text-xs text-slate-500">Choose "Subject-wise" if students can join for a single subject (e.g. only Physics).</p></div>
        <div><label className="label">Subjects taught</label><ChipPicker options={SUBJECTS} value={(f.subjects || []).map((x) => x.trim()).filter(Boolean)} onChange={(v) => set("subjects", v)} allowCustom /></div>
      </Section>

      <Section title="Fees & schedule">
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Minimum fee / year (₹)</label><input className="input" inputMode="numeric" value={f.fee_min ?? ""} onChange={num("fee_min")} /></div>
          <div><label className="label">Maximum fee / year (₹)</label><input className="input" inputMode="numeric" value={f.fee_max ?? ""} onChange={num("fee_max")} /></div>
          <div><label className="label">Avg. students per batch</label><input className="input" inputMode="numeric" value={f.batch_size ?? ""} onChange={num("batch_size")} /></div>
          <div className="sm:col-span-3"><label className="label">Fee note</label><input className="input" placeholder="e.g. Installments available, includes study material" value={f.fee_note || ""} onChange={txt("fee_note")} /></div>
          <div className="sm:col-span-3"><label className="label">Scholarship</label><input className="input" placeholder="e.g. Up to 50% via scholarship test" value={f.scholarship || ""} onChange={txt("scholarship")} /></div>
          <div className="sm:col-span-3"><label className="label">Timings</label><input className="input" placeholder="e.g. Mon–Sat, 7 AM – 8 PM" value={f.timings || ""} onChange={txt("timings")} /></div>
        </div>
      </Section>

      <Section title="Facilities">
        <ChipPicker options={FACILITIES} value={f.facilities || []} onChange={(v) => set("facilities", v)} allowCustom />
      </Section>

      <Section title="Photographs" desc="Classrooms, library, building, labs. Up to 8 MB each. Click the star to set the cover photo.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(f.photos || []).map((p, i) => (
            <div key={p + i} className={"group relative aspect-[4/3] overflow-hidden rounded-xl border-2 " + (p === f.cover_image ? "border-teal" : "border-transparent")}>
              <img src={p} alt="" className="h-full w-full object-cover" />
              <div className="absolute right-1 top-1 flex gap-1">
                <button type="button" title="Set as cover" onClick={() => set("cover_image", p)} className="rounded-full bg-white/90 p-1"><Star size={14} className={p === f.cover_image ? "fill-amber-400 text-amber-400" : "text-slate-500"} /></button>
                <button type="button" title="Remove" onClick={() => listRemove("photos", i)} className="rounded-full bg-white/90 p-1 text-red-600"><X size={14} /></button>
              </div>
              {p === f.cover_image && <span className="absolute bottom-1 left-1 badge bg-teal text-white">Cover</span>}
            </div>
          ))}
          <label className="grid aspect-[4/3] cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-teal hover:text-teal">
            {uploading === "photo" ? <Loader2 className="animate-spin" /> : <span className="flex flex-col items-center gap-1"><ImagePlus /> Add photos</span>}
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPhotos(e.target.files)} />
          </label>
        </div>
      </Section>

      <Section title="Demo lectures" desc="Let students experience your teaching. Paste a YouTube link (recommended) or upload a short video (max 50 MB).">
        {(f.demo_videos || []).map((v: DemoVideo, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal">{youtubeId(v.url) ? <Youtube size={18} /> : <Video size={18} />}</span>
            <div className="min-w-0 flex-1">
              <input className="w-full bg-transparent text-sm font-semibold outline-none" value={v.title} onChange={(e) => listUpdate<DemoVideo>("demo_videos", i, { title: e.target.value })} />
              <p className="truncate text-xs text-slate-500">{[v.teacher, v.subject].filter(Boolean).join(" · ")} · {v.url}</p>
            </div>
            <button type="button" onClick={() => listRemove("demo_videos", i)} className="text-red-600"><Trash2 size={16} /></button>
          </div>
        ))}
        <div className="rounded-xl bg-slate-50 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <input className="input" placeholder="Lecture title *" value={yt.title} onChange={(e) => setYt({ ...yt, title: e.target.value })} />
            <input className="input" placeholder="Teacher name" value={yt.teacher} onChange={(e) => setYt({ ...yt, teacher: e.target.value })} />
            <input className="input" placeholder="Subject" value={yt.subject} onChange={(e) => setYt({ ...yt, subject: e.target.value })} />
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input className="input" placeholder="YouTube link — https://youtu.be/…" value={yt.url} onChange={(e) => setYt({ ...yt, url: e.target.value })} />
            <button type="button" onClick={addYoutube} className="btn-outline shrink-0"><Youtube size={16} /> Add link</button>
            <label className="btn-outline shrink-0 cursor-pointer">
              {uploading === "video" ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload video
              <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={(e) => addVideoFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </Section>

      <Section title="Faculty" desc="Teacher qualifications are one of the first things students compare.">
        {(f.faculty || []).map((t: Faculty, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[64px_1fr_1fr_1fr_1fr_auto] sm:items-center">
            <label className="relative grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
              {t.photo ? <img src={t.photo} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={18} />}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { const u = await upload(file, "faculty"); if (u) listUpdate<Faculty>("faculty", i, { photo: u }); } }} />
            </label>
            <input className="input" placeholder="Name" value={t.name} onChange={(e) => listUpdate<Faculty>("faculty", i, { name: e.target.value })} />
            <input className="input" placeholder="Subject" value={t.subject} onChange={(e) => listUpdate<Faculty>("faculty", i, { subject: e.target.value })} />
            <input className="input" placeholder="Qualification (e.g. M.Sc, IIT)" value={t.qualification} onChange={(e) => listUpdate<Faculty>("faculty", i, { qualification: e.target.value })} />
            <input className="input" placeholder="Experience (e.g. 8 years)" value={t.experience} onChange={(e) => listUpdate<Faculty>("faculty", i, { experience: e.target.value })} />
            <button type="button" onClick={() => listRemove("faculty", i)} className="text-red-600"><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={() => set("faculty", [...(f.faculty || []), { name: "", subject: "", qualification: "", experience: "" }])} className="btn-outline"><Plus size={16} /> Add teacher</button>
      </Section>

      <Section title="Batches" desc="Upcoming batches with timing and fee.">
        {(f.batches || []).map((b: Batch, i) => (
          <div key={i} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.6fr_auto] sm:items-center">
            <input className="input" placeholder="Batch name (e.g. Class 11 JEE)" value={b.name} onChange={(e) => listUpdate<Batch>("batches", i, { name: e.target.value })} />
            <input className="input" placeholder="Timing" value={b.timing || ""} onChange={(e) => listUpdate<Batch>("batches", i, { timing: e.target.value })} />
            <input className="input" type="date" value={b.start || ""} onChange={(e) => listUpdate<Batch>("batches", i, { start: e.target.value })} />
            <input className="input" placeholder="Fee ₹" inputMode="numeric" value={b.fee ?? ""} onChange={(e) => listUpdate<Batch>("batches", i, { fee: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
            <input className="input" placeholder="Seats" inputMode="numeric" value={b.seats ?? ""} onChange={(e) => listUpdate<Batch>("batches", i, { seats: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
            <button type="button" onClick={() => listRemove("batches", i)} className="text-red-600"><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={() => set("batches", [...(f.batches || []), { name: "", timing: "", start: "", fee: undefined, seats: undefined }])} className="btn-outline"><Plus size={16} /> Add batch</button>
      </Section>

      <Section title="Results & achievements" desc="Optional. Only add results you can verify.">
        {(f.results || []).map((r, i) => (
          <div key={i} className="flex gap-3">
            <input className="input w-28" placeholder="Year" value={r.year} onChange={(e) => listUpdate<{ year: string; text: string }>("results", i, { year: e.target.value })} />
            <input className="input" placeholder="e.g. 12 students qualified JEE Advanced" value={r.text} onChange={(e) => listUpdate<{ year: string; text: string }>("results", i, { text: e.target.value })} />
            <button type="button" onClick={() => listRemove("results", i)} className="text-red-600"><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={() => set("results", [...(f.results || []), { year: String(new Date().getFullYear()), text: "" }])} className="btn-outline"><Plus size={16} /> Add result</button>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            {err && <span className="text-red-600">{err}</span>}
            {ok && <span className="text-green-700">{ok}</span>}
            {!err && !ok && mode === "owner" && <span className="text-slate-500">{isNew ? "Your listing will go live after a quick review by the Nextute team." : "Edits to a rejected listing are re-submitted for review."}</span>}
          </div>
          <button disabled={busy || !!uploading} className="btn-primary px-6">{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {isNew ? "Submit listing" : "Save changes"}</button>
        </div>
      </div>
    </form>
  );
}
