"use client";
import Link from "next/link";
import { BadgeCheck, MapPin, PlayCircle, Star, Users, GitCompareArrows, Check, Sparkles } from "lucide-react";
import Cover from "./Cover";
import { useCompare } from "./CompareContext";
import { feeRange, type Institute } from "@/lib/utils";
import { useT } from "./LangProvider";

export default function InstituteCard({ inst }: { inst: Institute }) {
  const { has, toggle } = useCompare();
  const inCompare = has(inst.id);
  const { t } = useT();
  return (
    <div className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/institutes/${inst.slug}`} className="relative block aspect-[16/9] overflow-hidden bg-slate-100">
        <Cover src={inst.cover_image || inst.photos?.[0]} name={inst.name} className="transition duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {inst.is_featured && <span className="badge bg-amber-400 text-amber-950"><Sparkles size={12} /> {t("card.featured")}</span>}
          {inst.is_sample && <span className="badge bg-white/90 text-slate-600">{t("card.sample")}</span>}
        </div>
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="badge bg-black/60 text-white">{inst.mode}</span>
          {inst.demo_count > 0 && (
            <span className="badge bg-black/60 text-white"><PlayCircle size={12} /> {inst.demo_count} {t("card.demos")}</span>
          )}
          {inst.photos?.length > 0 && <span className="badge bg-black/60 text-white">{inst.photos.length} {t("card.photos")}</span>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/institutes/${inst.slug}`} className="min-w-0">
            <h3 className="flex items-center gap-1.5 truncate text-base font-bold text-slate-900 group-hover:text-teal">
              <span className="truncate">{inst.name}</span>
              {inst.is_verified && <BadgeCheck size={17} className="shrink-0 text-teal" aria-label="Verified" />}
            </h3>
          </Link>
          {inst.review_count > 0 ? (
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-leaf-50 px-1.5 py-0.5 text-xs font-bold text-green-800">
              <Star size={12} className="fill-current" /> {Number(inst.rating).toFixed(1)}
            </span>
          ) : (
            <span className="shrink-0 rounded-lg bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">{t("card.new")}</span>
          )}
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} /> {inst.area}, {inst.city}{inst.distance != null && <b className="ml-1 text-teal">· {inst.distance.toFixed(1)} {t("card.away")}</b>}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {inst.exams.slice(0, 3).map((e) => (
            <span key={e} className="badge bg-teal-50 text-teal">{e}</span>
          ))}
          {inst.exams.length > 3 && <span className="badge bg-slate-100 text-slate-600">+{inst.exams.length - 3}</span>}
        </div>
        <p className="mt-3 line-clamp-1 text-xs text-slate-500">
          {inst.facilities.slice(0, 4).join(" · ")}{inst.facilities.length > 4 ? ` · +${inst.facilities.length - 4} more` : ""}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{t("card.fees")}</p>
            <p className="text-lg font-extrabold text-navy">{feeRange(inst.fee_min, inst.fee_max)}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {inst.batch_size ? (<><Users size={13} /> ~{inst.batch_size}{t("card.batch")}</>) : null}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => toggle({ id: inst.id, name: inst.name, area: inst.area })}
            className={inCompare ? "btn border border-teal bg-teal-50 py-2 text-teal" : "btn-outline py-2"}
          >
            {inCompare ? <Check size={15} /> : <GitCompareArrows size={15} />} {inCompare ? t("card.added") : t("card.compare")}
          </button>
          <Link href={`/institutes/${inst.slug}`} className="btn-primary py-2">{t("card.view")}</Link>
        </div>
      </div>
    </div>
  );
}
