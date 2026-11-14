import Link from "next/link";
import { Shield, ArrowRight, BadgeCheck, GitCompareArrows, PlayCircle, Search, MessageSquareText, Building2, Atom, Stethoscope, BookOpen, Landmark, Calculator, Languages } from "lucide-react";
import HeroSearch from "@/components/HeroSearch";
import InstituteCard from "@/components/InstituteCard";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_COLS, PATNA_AREAS } from "@/lib/constants";
import type { Institute } from "@/lib/utils";
import { getT } from "@/lib/lang-server";
import { landingSlug, POPULAR_EXAMS } from "@/lib/site";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  { label: "cat.jee", exam: "JEE Main", icon: Atom },
  { label: "cat.neet", exam: "NEET", icon: Stethoscope },
  { label: "cat.found", exam: "Foundation", icon: BookOpen },
  { label: "cat.board", exam: "Board Exams", icon: Calculator },
  { label: "cat.bpsc", exam: "BPSC", icon: Landmark },
  { label: "cat.ssc", exam: "SSC", icon: Building2 },
  { label: "cat.eng", exam: "Spoken English", icon: Languages },
];

export default async function Home() {
  const supabase = await createClient();
  const { t } = await getT();
  const [{ data: featured }, { data: stats }, { data: areaRows }] = await Promise.all([
    supabase.from("institutes").select(PUBLIC_COLS).eq("status", "approved")
      .order("is_featured", { ascending: false }).order("is_verified", { ascending: false }).order("created_at", { ascending: false }).limit(6),
    supabase.rpc("platform_stats"),
    supabase.from("institutes").select("area").eq("status", "approved"),
  ]);
  const areaCount = new Map<string, number>();
  (areaRows || []).forEach((r: { area: string }) => areaCount.set(r.area, (areaCount.get(r.area) || 0) + 1));
  const areas = [...new Set([...areaCount.keys(), ...PATNA_AREAS])].slice(0, 12);
  const s = (stats || {}) as { institutes?: number; areas?: number; demos?: number; students?: number };

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_80%_0%,#d3efe8_0%,transparent_60%),radial-gradient(50%_50%_at_0%_100%,#f1f9ea_0%,transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:pt-20">
          <div className="max-w-3xl">
            <span className="chip-active">{t("hero.badge")}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-navy md:text-6xl">
              {t("hero.t1")} <span className="brand-text">{t("hero.t2")}</span> {t("hero.t3")}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              {t("hero.sub")}
            </p>
          </div>
          <div className="mt-8 max-w-5xl"><HeroSearch /></div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["JEE Main", "NEET", "Foundation", "Board Exams", "BPSC"].map((e) => (
              <Link key={e} href={`/institutes?exam=${encodeURIComponent(e)}`} className="chip hover:border-teal hover:text-teal">{e}</Link>
            ))}
          </div>
          <div className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              [s.institutes ?? 0, t("stats.institutes")],
              [s.areas ?? 0, t("stats.areas")],
              [s.demos ?? 0, t("stats.demos")],
              ["₹0", t("stats.free")],
            ].map(([n, l]) => (
              <div key={String(l)} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <p className="text-2xl font-extrabold text-navy">{n}</p>
                <p className="text-xs text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-2">
        <Link href="/courses/nda-maths-april-2027" className="group flex flex-col gap-4 overflow-hidden rounded-3xl bg-[#0f1f33] p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400 text-slate-900"><Shield size={28} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">New · Defence aspirants</p>
              <p className="text-xl font-extrabold md:text-2xl">BRAHMASTRA — Nextute&apos;s Ultimate NDA Maths Batch at just ₹999</p>
              <p className="text-sm text-white/75">Mentor Aditya Tiwari · 290/300 in Maths · faced the SSB 9 times · IIT Patna Alumni</p>
            </div>
          </div>
          <span className="btn shrink-0 bg-amber-400 font-bold text-slate-900 group-hover:bg-amber-300">Enrol now <ArrowRight size={16} /></span>
        </Link>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl font-bold text-navy">{t("home.preparing")}</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {CATEGORIES.map(({ label, exam, icon: Icon }) => (
            <Link key={label} href={`/coaching/${landingSlug({ exam })}`} className="card group flex flex-col items-start gap-3 p-4 hover:border-teal">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal group-hover:bg-teal group-hover:text-white"><Icon size={20} /></span>
              <span className="text-sm font-semibold">{t(label as any)}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy">{t("home.top")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("home.topSub")}</p>
          </div>
          <Link href="/institutes" className="btn-outline hidden sm:inline-flex">{t("home.viewAll")} <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(featured as Institute[] | null)?.map((i) => <InstituteCard key={i.id} inst={i} />)}
        </div>
        {!featured?.length && <p className="card mt-6 p-8 text-center text-slate-500">{t("home.empty")}</p>}
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl font-bold text-navy">{t("home.byArea")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("home.byAreaSub")}</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {areas.map((a) => (
            <Link key={a} href={`/coaching/${landingSlug({ area: a })}`} className="card flex items-center justify-between p-4 text-sm font-semibold hover:border-teal hover:text-teal">
              {a}
              <span className="text-xs font-normal text-slate-400">{areaCount.get(a) || 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="text-xl font-bold text-navy">{t("home.popular")}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {POPULAR_EXAMS.flatMap((e) => [
            <Link key={e} href={`/coaching/${landingSlug({ exam: e })}`} className="chip hover:border-teal hover:text-teal">{e} coaching in Patna</Link>,
            ...areas.slice(0, 3).map((a) => (
              <Link key={e + a} href={`/coaching/${landingSlug({ exam: e, area: a })}`} className="chip hover:border-teal hover:text-teal">{e} coaching in {a}</Link>
            )),
          ])}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="card overflow-hidden p-8 md:p-12">
          <h2 className="text-2xl font-bold text-navy md:text-3xl">{t("home.how")}</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-4">
            {[
              [Search, t("how.1t"), t("how.1d")],
              [PlayCircle, t("how.2t"), t("how.2d")],
              [GitCompareArrows, t("how.3t"), t("how.3d")],
              [MessageSquareText, t("how.4t"), t("how.4d")],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof Search;
              return (
                <div key={i}>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl brand-gradient text-white"><I size={22} /></span>
                  <h3 className="mt-4 font-bold">{i + 1}. {t as string}</h3>
                  <p className="mt-1 text-sm text-slate-600">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="brand-gradient flex flex-col items-start justify-between gap-6 rounded-3xl p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white/80"><BadgeCheck size={18} /> {t("home.instBadge")}</p>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">{t("home.instTitle")}</h2>
            <p className="mt-2 max-w-xl text-white/85">{t("home.instSub")}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/signup?role=institute" className="btn bg-white text-navy hover:bg-slate-100">{t("home.register")}</Link>
            <Link href="/for-institutes" className="btn border border-white/40 text-white hover:bg-white/10">{t("home.learnMore")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
