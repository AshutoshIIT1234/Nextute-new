"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CITIES, CLASSES } from "@/lib/constants";
import { districtLabel } from "@/lib/bihar";

export default function ProfileForm({ profile, showClass = true }: { profile: { id: string; full_name: string | null; phone: string | null; city: string | null; class_level: string | null }; showClass?: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ full_name: profile.full_name || "", phone: profile.phone || "", city: profile.city || "Patna", class_level: profile.class_level || "" });
  const [msg, setMsg] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await createClient().from("profiles").update(f).eq("id", profile.id);
    setMsg(error ? error.message : "Saved ✓");
    router.refresh();
  }
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form onSubmit={save} className="space-y-3">
      <div><label className="label">Name</label><input className="input" value={f.full_name} onChange={up("full_name")} /></div>
      <div><label className="label">Mobile</label><input className="input" value={f.phone} onChange={up("phone")} /></div>
      <div><label className="label">City</label><select className="input" value={f.city} onChange={up("city")}>{CITIES.map((c) => <option key={c} value={c}>{districtLabel(c)}</option>)}</select></div>
      {showClass && <div><label className="label">Class</label><select className="input" value={f.class_level} onChange={up("class_level")}><option value="">Select</option>{CLASSES.map((c) => <option key={c}>{c}</option>)}</select></div>}
      <div className="flex items-center gap-3"><button className="btn-primary">Save profile</button>{msg && <span className="text-sm text-slate-600">{msg}</span>}</div>
    </form>
  );
}
