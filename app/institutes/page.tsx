import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { LocateFixed } from "lucide-react";
import Filters from "@/components/Filters";
import SortSelect from "@/components/SortSelect";
import InstituteCard from "@/components/InstituteCard";
import NearMeButton from "@/components/NearMeButton";
import ViewToggle from "@/components/ViewToggle";
import MapView from "@/components/MapView";
import ComingSoon from "@/components/ComingSoon";
import { districtLabel } from "@/lib/bihar";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_COLS } from "@/lib/constants";
import { distanceKm } from "@/lib/geo";
import { getT } from "@/lib/lang-server";
import type { Institute } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Explore coaching institutes in Patna",
  description: "Search and filter coaching institutes in Patna by area, course, fees and facilities. Compare and send admission enquiries free.",
};

const PAGE = 12;
type SP = Record<string, string | undefined>;
const list = (v?: string) => (v ? v.split(",").filter(Boolean) : []);

export default async function InstitutesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { t } = await getT();
  const page = Math.max(1, Number(sp.page) || 1);
  const me: [number, number] | null = Number(sp.lat) && Number(sp.lng) ? [Number(sp.lat), Number(sp.lng)] : null;
  const isMap = sp.view === "map";
  const km = Number(sp.km) || 0;
  const byDistance = !!me && (sp.sort === "near" || !sp.sort || !!km);

  let q = supabase.from("institutes").select(PUBLIC_COLS, { count: "exact" }).eq("status", "approved");
  const text = (sp.q || "").replace(/[,()%*]/g, " ").trim();
  if (text) q = q.or(`name.ilike.%${text}%,area.ilike.%${text}%,tagline.ilike.%${text}%`);
  if (sp.city) q = q.eq("city", sp.city);
  if (list(sp.area).length) q = q.in("area", list(sp.area));
  if (sp.class) q = q.contains("classes", [sp.class]);
  if (list(sp.exam).length) q = q.overlaps("exams", list(sp.exam));
  if (sp.mode) q = q.eq("mode", sp.mode);
  if (list(sp.subject).length) q = q.overlaps("subjects", list(sp.subject));
  if (sp.ctype) q = q.contains("course_types", [sp.ctype]);
  if (Number(sp.fmax)) q = q.lte("fee_min", Number(sp.fmax));
  if (Number(sp.fmin)) q = q.gte("fee_max", Number(sp.fmin));
  if (list(sp.facilities).length) q = q.contains("facilities", list(sp.facilities));
  if (sp.verified === "1") q = q.eq("is_verified", true);
  if (sp.featured === "1") q = q.eq("is_featured", true);
  if (sp.demos === "1") q = q.gt("demo_count", 0);
  if (Number(sp.rating)) q = q.gte("rating", Number(sp.rating));

  switch (sp.sort) {
    case "fee_asc": q = q.order("fee_min", { ascending: true, nullsFirst: false }); break;
    case "fee_desc": q = q.order("fee_max", { ascending: false, nullsFirst: false }); break;
    case "rating": q = q.order("rating", { ascending: false }).order("review_count", { ascending: false }); break;
    case "popular": q = q.order("review_count", { ascending: false }).order("demo_count", { ascending: false }); break;
    case "newest": q = q.order("created_at", { ascending: false }); break;
    default: q = q.order("is_featured", { ascending: false }).order("is_verified", { ascending: false }).order("rating", { ascending: false }).order("created_at", { ascending: false });
  }

  // Distance sorting and the map need the whole result set (capped), then paginate here.
  const fetchAll = byDistance || isMap || (!!me && !!km);
  const { data, count, error } = fetchAll ? await q.range(0, 299) : await q.range((page - 1) * PAGE, page * PAGE - 1);
  let all = (data || []) as Institute[];
  if (me) all = all.map((i) => ({ ...i, distance: i.lat != null && i.lng != null ? distanceKm(me, [i.lat, i.lng]) : undefined }));
  if (me && km) all = all.filter((i) => i.distance != null && i.distance <= km);
  if (byDistance) all.sort((a, b) => (a.distance ?? 1e9) - (b.distance ?? 1e9));
  const items = fetchAll && !isMap ? all.slice((page - 1) * PAGE, page * PAGE) : all;
  const total = me && km ? all.length : count || 0;
  const pages = isMap ? 1 : Math.ceil(total / PAGE);
  const place = list(sp.area).length ? list(sp.area).join(", ") + (sp.city ? `, ${districtLabel(sp.city)}` : "") : sp.city ? districtLabel(sp.city) : "";

  const heading = [list(sp.exam).join(", "), "coaching institutes", list(sp.area).length ? `in ${list(sp.area).join(", ")}` : `in ${sp.city ? districtLabel(sp.city) : "Patna & Bihar"}`].filter(Boolean).join(" ");
  const pageHref = (n: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    p.set("page", String(n));
    return `/institutes?${p}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold capitalize text-navy md:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("list.sub")}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Suspense><Filters /></Suspense>
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              <b className="text-slate-900">{total}</b> {t("list.found")}
              {byDistance && <span className="ml-2 inline-flex items-center gap-1 text-teal"><LocateFixed size={14} /> {t("list.nearest")}</span>}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Suspense><NearMeButton className="btn-outline py-2" /></Suspense>
              <Suspense><ViewToggle /></Suspense>
              <Suspense><SortSelect /></Suspense>
            </div>
          </div>
          {error && <p className="card p-4 text-sm text-red-600">Couldn&apos;t load institutes: {error.message}</p>}
          {isMap && items.length > 0 && <div className="mb-6"><MapView items={items} me={me} /></div>}
          {items.length === 0 && !error && place && !km ? (
            <ComingSoon place={place} />
          ) : items.length === 0 && !error ? (
            <div className="card p-10 text-center">
              <p className="text-lg font-semibold">{t("list.none")}</p>
              <p className="mt-1 text-sm text-slate-500">{t("list.noneSub")}</p>
              <Link href="/institutes" className="btn-primary mt-4">{t("list.clear")}</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((i) => <InstituteCard key={i.id} inst={i} />)}
            </div>
          )}
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && <Link href={pageHref(page - 1)} className="btn-outline">{t("list.prev")}</Link>}
              <span className="text-sm text-slate-600">{t("list.page")} {page} / {pages}</span>
              {page < pages && <Link href={pageHref(page + 1)} className="btn-outline">{t("list.next")}</Link>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
