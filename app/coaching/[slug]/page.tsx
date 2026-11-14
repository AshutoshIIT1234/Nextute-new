import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, BadgeCheck, IndianRupee, Building2 } from "lucide-react";
import InstituteCard from "@/components/InstituteCard";
import ComingSoon from "@/components/ComingSoon";
import { createClient } from "@/lib/supabase/server";
import { PUBLIC_COLS, PATNA_AREAS, EXAMS } from "@/lib/constants";
import { landingSlug, parseLanding, POPULAR_EXAMS, SITE_URL } from "@/lib/site";
import { inrShort, type Institute } from "@/lib/utils";

export const dynamic = "force-dynamic";

function titleFor(p: { exam?: string; area?: string; city: string }) {
  const where = p.area ? `${p.area}, ${p.city}` : p.city;
  return `${p.exam ? `${p.exam} Coaching` : "Coaching Institutes"} in ${where}`;
}

async function load(p: { exam?: string; area?: string; city: string }) {
  const sb = await createClient();
  let q = sb.from("institutes").select(PUBLIC_COLS).eq("status", "approved").eq("city", p.city);
  if (p.area) q = q.eq("area", p.area);
  if (p.exam) q = q.contains("exams", [p.exam]);
  const { data } = await q.order("is_featured", { ascending: false }).order("is_verified", { ascending: false }).order("rating", { ascending: false }).limit(60);
  return (data || []) as Institute[];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = parseLanding(slug);
  if (!p) return { title: "Not found" };
  const title = `${titleFor(p)} — Fees, Faculty & Reviews`;
  const description = `Compare the best ${p.exam ? p.exam + " " : ""}coaching institutes in ${p.area ? p.area + ", " : ""}${p.city}. See fees, facilities, faculty qualifications, photos and demo lectures. Send a free admission enquiry on Nextute.`;
  return { title, description, alternates: { canonical: `/coaching/${slug}` }, openGraph: { title, description, url: `/coaching/${slug}` } };
}

export default async function Landing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = parseLanding(slug);
  if (!p) notFound();
  const items = await load(p);
  const title = titleFor(p);
  const fees = items.map((i) => i.fee_min).filter((n): n is number => !!n);
  const minFee = fees.length ? Math.min(...fees) : null;
  const maxFee = Math.max(0, ...items.map((i) => i.fee_max || 0)) || null;
  const verified = items.filter((i) => i.is_verified).length;
  const where = p.area ? `${p.area}, ${p.city}` : p.city;
  const exploreHref = `/institutes?${new URLSearchParams({ ...(p.exam ? { exam: p.exam } : {}), ...(p.area ? { area: p.area } : { city: p.city }) })}`;

  const faqs = [
    { q: `How many ${p.exam ? p.exam + " " : ""}coaching institutes are there in ${where}?`, a: items.length ? `Nextute lists ${items.length} ${p.exam ? p.exam + " " : ""}coaching institute${items.length > 1 ? "s" : ""} in ${where}, of which ${verified} ${verified === 1 ? "is" : "are"} verified by the Nextute team.` : `No institutes are listed here yet. New institutes are added every week — check nearby areas or contact Nextute for help.` },
    { q: `What is the fee for ${p.exam ? p.exam + " " : ""}coaching in ${where}?`, a: minFee ? `Yearly fees range from about ${inrShort(minFee)} to ${inrShort(maxFee)} depending on the institute, class and batch. Many institutes offer installments and scholarship tests.` : `Fees vary by institute and batch. Send an enquiry to get the exact fee structure.` },
    { q: `How do I choose the right coaching in ${where}?`, a: `Compare institutes on faculty qualifications, batch size, fees, test series and distance from home. On Nextute you can watch demo lectures, compare up to 3 institutes side by side and send a free admission enquiry.` },
  ];
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "ItemList", name: title, itemListElement: items.slice(0, 20).map((i, k) => ({ "@type": "ListItem", position: k + 1, url: `${SITE_URL}/institutes/${i.slug}`, name: i.name })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  const relatedAreas = PATNA_AREAS.filter((a) => a !== p.area).slice(0, 12);
  const relatedExams = (p.exam ? EXAMS.filter((e) => e !== p.exam) : POPULAR_EXAMS).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-teal">Home</Link> / <Link href="/institutes" className="hover:text-teal">Institutes</Link> / <span className="text-slate-800">{title}</span>
      </nav>
      <h1 className="mt-3 text-3xl font-extrabold text-navy md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        Looking for the best {p.exam ? `${p.exam} ` : ""}coaching in {where}? Compare {items.length || "local"} institutes on fees, facilities, faculty and demo lectures — and send a free admission enquiry in one click.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4"><Building2 className="text-teal" /><div><p className="text-xl font-extrabold text-navy">{items.length}</p><p className="text-xs text-slate-500">Institutes</p></div></div>
        <div className="card flex items-center gap-3 p-4"><BadgeCheck className="text-teal" /><div><p className="text-xl font-extrabold text-navy">{verified}</p><p className="text-xs text-slate-500">Nextute verified</p></div></div>
        <div className="card flex items-center gap-3 p-4"><IndianRupee className="text-teal" /><div><p className="text-xl font-extrabold text-navy">{minFee ? `${inrShort(minFee)} – ${inrShort(maxFee)}` : "—"}</p><p className="text-xs text-slate-500">Fee range / year</p></div></div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Institutes</h2>
        <Link href={exploreHref} className="btn-outline">Filter & compare</Link>
      </div>
      {items.length ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((i) => <InstituteCard key={i.id} inst={i} />)}</div>
      ) : (
        <div className="mt-4"><ComingSoon place={where} /></div>
      )}

      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">Frequently asked questions</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {faqs.map((f) => (
            <details key={f.q} className="group py-3">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="flex items-center gap-2 font-bold"><MapPin size={18} className="text-teal" /> {p.exam ? `${p.exam} coaching in other areas` : "Coaching in other areas"}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedAreas.map((a) => <Link key={a} href={`/coaching/${landingSlug({ exam: p.exam, area: a })}`} className="chip hover:border-teal hover:text-teal">{a}</Link>)}
          </div>
        </div>
        <div>
          <h2 className="font-bold">Other courses in {where}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedExams.map((e) => <Link key={e} href={`/coaching/${landingSlug({ exam: e, area: p.area, city: p.city })}`} className="chip hover:border-teal hover:text-teal">{e} coaching</Link>)}
          </div>
        </div>
      </section>
    </div>
  );
}
