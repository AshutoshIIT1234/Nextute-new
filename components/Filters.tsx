"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SlidersHorizontal, X, Search } from "lucide-react";
import { CITIES, CLASSES, EXAMS, FACILITIES, MODES, FEE_PRESETS, SUBJECTS, COURSE_TYPES, DISTANCES } from "@/lib/constants";
import { areasFor, districtLabel } from "@/lib/bihar";
import { useT } from "./LangProvider";

function list(v: string | null) {
  return v ? v.split(",").filter(Boolean) : [];
}

export default function Filters({ extraAreas = [] }: { extraAreas?: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(sp.get("q") || "");
  const [areaFilter, setAreaFilter] = useState("");
  const [fmin, setFmin] = useState(sp.get("fmin") || "");
  const [fmax, setFmax] = useState(sp.get("fmax") || "");
  useEffect(() => { setQ(sp.get("q") || ""); setFmin(sp.get("fmin") || ""); setFmax(sp.get("fmax") || ""); }, [sp]);

  function push(mut: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("page");
    start(() => router.replace(`${pathname}?${p.toString()}`, { scroll: false }));
  }
  const setOne = (k: string, v: string) => push((p) => (v ? p.set(k, v) : p.delete(k)));
  const toggleIn = (k: string, v: string) =>
    push((p) => {
      const cur = list(p.get(k));
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      next.length ? p.set(k, next.join(",")) : p.delete(k);
    });

  const city = sp.get("city") || "";
  const areas = [...new Set([...extraAreas, ...areasFor(city || "Patna")])].filter((a) => a.toLowerCase().includes(areaFilter.toLowerCase()));
  const km = sp.get("km") || "";
  const [locErr, setLocErr] = useState("");
  function setDistance(v: string) {
    if (!v) return push((p) => { p.delete("km"); });
    if (sp.get("lat") && sp.get("lng")) return push((p) => { p.set("km", v); p.set("sort", "near"); });
    if (!navigator.geolocation) return setLocErr(t("near.denied"));
    navigator.geolocation.getCurrentPosition(
      (pos) => push((p) => { p.set("lat", pos.coords.latitude.toFixed(4)); p.set("lng", pos.coords.longitude.toFixed(4)); p.set("km", v); p.set("sort", "near"); }),
      () => setLocErr(t("near.denied")),
      { timeout: 10000, maximumAge: 600000 }
    );
  }
  const selSubjects = list(sp.get("subject"));
  const selAreas = list(sp.get("area"));
  const selExams = list(sp.get("exam"));
  const selFac = list(sp.get("facilities"));
  const activeCount = [...sp.keys()].filter((k) => !["sort", "page", "view", "lat", "lng"].includes(k)).length;

  const body = (
    <div className={"space-y-6 " + (pending ? "opacity-70" : "")}>
      <form onSubmit={(e) => { e.preventDefault(); setOne("q", q.trim()); }}>
        <label className="label">{t("f.search")}</label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("f.searchPh")} className="input pl-9" />
        </div>
      </form>

      <div>
        <label className="label">{t("f.city")}</label>
        <select className="input" value={city} onChange={(e) => push((p) => { e.target.value ? p.set("city", e.target.value) : p.delete("city"); p.delete("area"); })}>
          <option value="">{t("f.allCities")}</option>
          {CITIES.map((c) => <option key={c} value={c}>{districtLabel(c)}</option>)}
        </select>
      </div>

      <div>
        <label className="label">{t("f.area")}{city ? ` — ${districtLabel(city)}` : " — Patna"} {selAreas.length > 0 && <span className="text-teal">({selAreas.length})</span>}</label>
        <input value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} placeholder={t("f.findArea")} className="input mb-2 py-2" />
        <div className="max-h-44 space-y-1 overflow-y-auto pr-1">
          {areas.map((a) => (
            <label key={a} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-slate-50">
              <input type="checkbox" className="accent-teal" checked={selAreas.includes(a)} onChange={() => toggleIn("area", a)} /> {a}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t("f.within")}</label>
        <div className="flex flex-wrap gap-1.5">
          {DISTANCES.map((d) => (
            <button key={d} type="button" onClick={() => setDistance(km === String(d) ? "" : String(d))} className={km === String(d) ? "chip-active" : "chip"}>{d} km</button>
          ))}
        </div>
        {locErr && <p className="mt-1 text-xs text-amber-700">{locErr}</p>}
      </div>

      <div>
        <label className="label">{t("f.ctype")}</label>
        <div className="flex flex-wrap gap-1.5">
          {COURSE_TYPES.map((c) => (
            <button key={c} type="button" onClick={() => setOne("ctype", sp.get("ctype") === c ? "" : c)} className={sp.get("ctype") === c ? "chip-active" : "chip"}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t("f.subject")}</label>
        <div className="flex flex-wrap gap-1.5">
          {SUBJECTS.map((c) => (
            <button key={c} type="button" onClick={() => toggleIn("subject", c)} className={selSubjects.includes(c) ? "chip-active" : "chip"}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t("f.class")}</label>
        <div className="flex flex-wrap gap-1.5">
          {CLASSES.map((c) => (
            <button key={c} type="button" onClick={() => setOne("class", sp.get("class") === c ? "" : c)} className={sp.get("class") === c ? "chip-active" : "chip"}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t("f.exam")}</label>
        <div className="flex flex-wrap gap-1.5">
          {EXAMS.map((c) => (
            <button key={c} type="button" onClick={() => toggleIn("exam", c)} className={selExams.includes(c) ? "chip-active" : "chip"}>{c}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t("f.fee")}</label>
        <div className="flex flex-wrap gap-1.5">
          {FEE_PRESETS.map((f) => {
            const active = (sp.get("fmin") || "0") === String(f.min) && (sp.get("fmax") || "0") === String(f.max);
            return (
              <button key={f.label} type="button" className={active ? "chip-active" : "chip"}
                onClick={() => push((p) => {
                  if (active) { p.delete("fmin"); p.delete("fmax"); return; }
                  f.min ? p.set("fmin", String(f.min)) : p.delete("fmin");
                  f.max ? p.set("fmax", String(f.max)) : p.delete("fmax");
                })}>
                {f.label}
              </button>
            );
          })}
        </div>
        <form className="mt-2 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); push((p) => { fmin ? p.set("fmin", fmin) : p.delete("fmin"); fmax ? p.set("fmax", fmax) : p.delete("fmax"); }); }}>
          <input inputMode="numeric" value={fmin} onChange={(e) => setFmin(e.target.value.replace(/\D/g, ""))} placeholder="Min ₹" className="input py-2" />
          <span className="text-slate-400">–</span>
          <input inputMode="numeric" value={fmax} onChange={(e) => setFmax(e.target.value.replace(/\D/g, ""))} placeholder="Max ₹" className="input py-2" />
          <button className="btn-outline px-3 py-2">Go</button>
        </form>
      </div>

      <div>
        <label className="label">{t("f.mode")}</label>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button key={m} type="button" onClick={() => setOne("mode", sp.get("mode") === m ? "" : m)} className={sp.get("mode") === m ? "chip-active" : "chip"}>{m}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">{t("f.facilities")}</label>
        <div className="grid grid-cols-1 gap-1">
          {FACILITIES.map((f) => (
            <label key={f} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-slate-50">
              <input type="checkbox" className="accent-teal" checked={selFac.includes(f)} onChange={() => toggleIn("facilities", f)} /> {f}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="label">{t("f.more")}</label>
        {[
          ["verified", t("f.verified")],
          ["demos", t("f.demos")],
          ["featured", t("f.featured")],
        ].map(([k, l]) => (
          <label key={k} className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="accent-teal" checked={sp.get(k) === "1"} onChange={(e) => setOne(k, e.target.checked ? "1" : "")} /> {l}
          </label>
        ))}
        <select className="input mt-2" value={sp.get("rating") || ""} onChange={(e) => setOne("rating", e.target.value)}>
          <option value="">{t("f.anyRating")}</option>
          <option value="4.5">4.5★ & above</option>
          <option value="4">4★ & above</option>
          <option value="3">3★ & above</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <button onClick={() => setOpen(true)} className="btn-outline">
          <SlidersHorizontal size={16} /> {t("f.filters")} {activeCount > 0 && <span className="rounded-full bg-teal px-1.5 text-xs text-white">{activeCount}</span>}
        </button>
        {activeCount > 0 && <button onClick={() => router.replace(pathname)} className="btn-ghost text-sm">{t("f.clear")}</button>}
      </div>
      <aside className="hidden lg:block">
        <div className="card sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold"><SlidersHorizontal size={16} /> {t("f.title")}</h3>
            {activeCount > 0 && <button onClick={() => router.replace(pathname)} className="text-xs font-semibold text-teal">{t("f.clear")}</button>}
          </div>
          {body}
        </div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-[88%] max-w-sm overflow-y-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold">{t("f.title")}</h3>
              <button onClick={() => setOpen(false)} aria-label="Close"><X /></button>
            </div>
            {body}
            <button onClick={() => setOpen(false)} className="btn-primary mt-6 w-full">{t("f.show")}</button>
          </div>
        </div>
      )}
    </>
  );
}
