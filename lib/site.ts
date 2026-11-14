import { EXAMS, PATNA_AREAS, CITIES } from "./constants";
import { slugify } from "./utils";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nextute-chi.vercel.app";

/** SEO landing-page slugs, e.g. "neet-coaching-in-kankarbagh-patna", "coaching-in-boring-road-patna", "jee-main-coaching-in-patna". */
export function landingSlug(opts: { exam?: string; area?: string; city?: string }) {
  const loc = opts.area ? `${slugify(opts.area)}-patna` : slugify(opts.city || "Patna");
  return `${opts.exam ? slugify(opts.exam) + "-" : ""}coaching-in-${loc}`;
}

export function parseLanding(slug: string): { exam?: string; area?: string; city: string } | null {
  const m = slug.match(/^(?:(.+)-)?coaching-in-(.+)$/);
  if (!m) return null;
  const [, examSlug, locSlug] = m;
  let exam: string | undefined;
  if (examSlug) {
    exam = EXAMS.find((e) => slugify(e) === examSlug);
    if (!exam) return null;
  }
  const area = PATNA_AREAS.find((a) => `${slugify(a)}-patna` === locSlug);
  if (area) return { exam, area, city: "Patna" };
  const city = CITIES.find((c) => slugify(c) === locSlug);
  if (city) return { exam, city };
  return null;
}

export const POPULAR_EXAMS = ["JEE Main", "NEET", "Foundation", "Board Exams", "BPSC", "SSC"];
