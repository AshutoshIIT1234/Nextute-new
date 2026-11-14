import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import { SITE_URL, landingSlug, POPULAR_EXAMS } from "@/lib/site";
import { PATNA_AREAS, EXAMS } from "@/lib/constants";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data } = await sb.from("institutes").select("slug,area,exams,created_at").eq("status", "approved");
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/institutes`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/for-institutes`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/courses/nda-maths-april-2027`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/courses`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/compare`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];
  const landing = new Set<string>();
  landing.add(landingSlug({ city: "Patna" }));
  EXAMS.forEach((e) => landing.add(landingSlug({ exam: e })));
  PATNA_AREAS.forEach((a) => landing.add(landingSlug({ area: a })));
  POPULAR_EXAMS.forEach((e) => PATNA_AREAS.forEach((a) => landing.add(landingSlug({ exam: e, area: a }))));
  (data || []).forEach((i: any) => {
    urls.push({ url: `${SITE_URL}/institutes/${i.slug}`, lastModified: new Date(i.created_at), changeFrequency: "weekly", priority: 0.8 });
    if (PATNA_AREAS.includes(i.area)) (i.exams || []).forEach((e: string) => EXAMS.includes(e) && landing.add(landingSlug({ exam: e, area: i.area })));
  });
  landing.forEach((s) => urls.push({ url: `${SITE_URL}/coaching/${s}`, changeFrequency: "weekly", priority: 0.7 }));
  return urls;
}
