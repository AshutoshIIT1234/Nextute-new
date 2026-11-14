"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, GraduationCap } from "lucide-react";
import { PATNA_AREAS, EXAMS } from "@/lib/constants";
import { useT } from "./LangProvider";
import NearMeButton from "./NearMeButton";

export default function HeroSearch() {
  const router = useRouter();
  const { t } = useT();
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [exam, setExam] = useState("");
  function go(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (area) p.set("area", area);
    if (exam) p.set("exam", exam);
    router.push("/institutes" + (p.toString() ? `?${p}` : ""));
  }
  return (
    <div>
    <form onSubmit={go} className="grid gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-navy/10 ring-1 ring-slate-200 md:grid-cols-[1.4fr_1fr_1fr_auto]">
      <label className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50">
        <Search size={18} className="shrink-0 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.ph")} className="w-full bg-transparent py-1.5 text-sm outline-none" />
      </label>
      <label className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50 md:border-l md:border-slate-200">
        <MapPin size={18} className="shrink-0 text-slate-400" />
        <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-transparent py-1.5 text-sm outline-none">
          <option value="">{t("search.anyArea")}</option>
          {PATNA_AREAS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50 md:border-l md:border-slate-200">
        <GraduationCap size={18} className="shrink-0 text-slate-400" />
        <select value={exam} onChange={(e) => setExam(e.target.value)} className="w-full bg-transparent py-1.5 text-sm outline-none">
          <option value="">{t("search.anyExam")}</option>
          {EXAMS.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>
      <button className="btn-primary px-6 py-3">{t("search.go")}</button>
    </form>
    <div className="mt-3"><NearMeButton base="/institutes" className="btn border border-teal/30 bg-white/80 text-teal hover:bg-teal-50" /></div>
    </div>
  );
}
