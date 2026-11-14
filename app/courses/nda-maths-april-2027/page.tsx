import Link from "next/link";
import type { Metadata } from "next";
import {
  Shield, Anchor, Plane, Target, Trophy, GraduationCap, Medal, CalendarDays, CheckCircle2, BookOpen,
  Timer, ClipboardCheck, MessageCircleQuestion, Zap, Users, Star,
} from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import EnrollButton from "@/components/EnrollButton";
import { SITE_URL } from "@/lib/site";
import { SUPPORT_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";
const SLUG = "nda-maths-april-2027";
const PATH = `/courses/${SLUG}`;

export const metadata: Metadata = {
  title: "BRAHMASTRA — Nextute's Ultimate NDA Maths Batch | ₹999 | Mentor Aditya Tiwari (IIT Patna Alumni)",
  description: "Join BRAHMASTRA, Nextute's Ultimate NDA Maths Batch (from 12 November 2026), for ₹999. Learn from Aditya Tiwari — 290/300 in Maths, faced the SSB 9 times, IIT Patna alumni. For aspirants of the Indian Army, Navy and Air Force.",
  alternates: { canonical: PATH },
  openGraph: { title: "BRAHMASTRA — Nextute's Ultimate NDA Maths Batch", description: "Complete NDA Maths preparation for ₹999 with mentor Aditya Tiwari (IIT Patna Alumni).", url: PATH },
};

const INCLUDED = [
  [BookOpen, "Complete NDA Maths syllabus", "Every chapter of the NDA Mathematics paper, taught from basics to exam level."],
  [Target, "Previous-year questions", "NDA PYQs solved chapter by chapter, so you know exactly what UPSC asks."],
  [ClipboardCheck, "Tests with chapter-wise reports", "Regular tests with your score next to the topper's and the class average, and a clear plan for what to improve."],
  [Zap, "Speed & accuracy techniques", "Shortcuts and elimination tricks to finish 120 questions in 2½ hours, with negative marking in mind."],
  [MessageCircleQuestion, "Doubt support", "Ask your doubts directly to the mentor and get them cleared."],
  [Medal, "SSB guidance", "Tips from a mentor who has faced the SSB interview 9 times — what to expect after you clear the written exam."],
] as const;

const SYLLABUS = [
  ["Algebra", "Sets, relations, complex numbers, quadratic equations, binomial theorem, sequences & series, permutations & combinations, logarithms"],
  ["Matrices & Determinants", "Types of matrices, operations, determinants, adjoint and inverse, solving linear equations"],
  ["Trigonometry", "Angles, identities, multiple & sub-multiple angles, inverse trigonometric functions, heights & distances, properties of triangles"],
  ["Analytical Geometry (2D & 3D)", "Straight lines, circles, conic sections, direction cosines, planes and lines in space, spheres"],
  ["Differential Calculus", "Functions, limits, continuity, derivatives, maxima & minima, applications"],
  ["Integral Calculus & Differential Equations", "Indefinite & definite integrals, area under curves, order & degree, solving first-order equations"],
  ["Vector Algebra", "Vectors in 2D & 3D, dot and cross products, applications"],
  ["Statistics & Probability", "Mean, median, mode, variance, correlation & regression, probability, binomial distribution"],
];

const FAQ = [
  ["When does the batch start?", "The batch started on 12 November 2026 and admissions are still open. After you enrol, our team will share the class schedule and joining details with you on WhatsApp."],
  ["What is the fee?", "₹999 for the NDA Maths batch. You can pay securely online through Razorpay using UPI, debit/credit card, net banking or wallets."],
  ["Who should join?", "Class 11, Class 12 and 12th-pass students preparing for the NDA exam who want to join the Indian Army, Navy or Air Force and want to make Maths their strongest section."],
  ["Why focus on Maths?", "Maths is 300 of the 900 marks in the NDA written exam. A strong Maths score makes clearing the written cut-off and reaching the SSB much easier."],
  ["How do I know my payment worked?", "You'll see \"You're enrolled\" on this page and on your Nextute dashboard straight away, and Razorpay emails you a receipt. If money is deducted but you don't see it, call us with your payment ID."],
];

export default async function NdaMathsPage() {
  const { supabase, user, profile } = await getSession();
  const [{ data: course }, { data: mine }] = await Promise.all([
    supabase.from("courses").select("*").eq("slug", SLUG).maybeSingle(),
    user ? supabase.from("course_enrollments").select("id").eq("user_id", user.id).eq("course_slug", SLUG).eq("status", "paid").limit(1) : Promise.resolve({ data: [] as any[] }),
  ]);
  const price: number = course?.price ?? 999;
  const photo: string | null = course?.mentor_photo ?? null;
  const enrolled = !!mine?.length;
  const enrollProps = {
    course: SLUG, price, signedIn: !!user, enrolled, role: profile?.role,
    defaultName: profile?.full_name || "", defaultPhone: profile?.phone || "", next: PATH,
  };

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Course",
    name: "BRAHMASTRA — Nextute's Ultimate NDA Maths Batch", description: metadata.description,
    provider: { "@type": "Organization", name: "Nextute", sameAs: SITE_URL },
    offers: { "@type": "Offer", price, priceCurrency: "INR", url: `${SITE_URL}${PATH}`, category: "Paid" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Blended", startDate: "2026-11-12", instructor: { "@type": "Person", name: "Aditya Tiwari" } },
  };

  return (
    <div className="pb-24 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0f1f33] text-white">
        <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,#fff_0,#fff_1px,transparent_1px,transparent_14px)]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#4b5d2a]/50 blur-3xl" />
        <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-teal/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 md:py-20 lg:grid-cols-[1.2fr_420px] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
              <Star size={13} className="fill-amber-300 text-amber-300" /> Batch from 12 November 2026 · Admissions open
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-none tracking-wider md:text-7xl">
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-lime-300 bg-clip-text text-transparent">BRAHMASTRA</span>
            </h1>
            <p className="mt-3 text-xl font-bold text-white md:text-2xl">Nextute&apos;s Ultimate NDA Maths Batch</p>
            <p className="mt-2 text-lg font-semibold text-amber-200/90">Crack NDA Maths. Earn your uniform.</p>
            <p className="mt-5 max-w-xl text-lg text-white/80">
              A focused Maths batch for students who dream of serving the nation in the <b className="text-white">Indian Army, Navy and Air Force</b> — mentored by Aditya Tiwari, an IIT Patna alumni who scored 290/300 in Maths.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {[[Shield, "Army"], [Anchor, "Navy"], [Plane, "Air Force"]].map(([I, l]) => {
                const Icon = I as typeof Shield;
                return <span key={l as string} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold"><Icon size={18} className="text-amber-300" /> {l as string}</span>;
              })}
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[["290/300", "Mentor's Maths score"], ["9×", "SSB interviews faced"], ["IIT", "Patna alumni"]].map(([n, l]) => (
                <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-2xl font-extrabold text-amber-300">{n}</p>
                  <p className="text-xs text-white/70">{l}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="enrol" className="rounded-3xl border border-white/15 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
            <p className="text-sm font-semibold text-white/70">BRAHMASTRA · NDA Maths Batch</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-5xl font-extrabold">₹{price}</p>
              <p className="pb-1.5 text-sm text-white/70">full batch</p>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-white/85">
              {["Complete NDA Maths syllabus", "PYQs + tests with chapter-wise reports", "Doubt support from the mentor", "SSB guidance"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-lime-300" /> {t}</li>
              ))}
            </ul>
            <div className="mt-6"><EnrollButton {...enrollProps} dark /></div>
          </div>
        </div>
      </section>

      {/* Why Maths */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-teal">Why Maths decides your NDA result</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy">300 of 900 written marks come from Maths</h2>
            <p className="mt-3 text-slate-600">
              The NDA written exam has two papers: Mathematics (300 marks) and the General Ability Test (600 marks). Maths is the section where well-prepared students pull ahead — and where many lose marks to time pressure and negative marking. This batch is built to make Maths your strongest section.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[[BookOpen, "120", "Questions"], [Trophy, "300", "Marks"], [Timer, "2½ hrs", "Duration"], [Target, "+2.5 / −0.83", "Per question"]].map(([I, n, l]) => {
              const Icon = I as typeof Timer;
              return (
                <div key={l as string} className="card p-5">
                  <Icon size={20} className="text-teal" />
                  <p className="mt-3 text-2xl font-extrabold text-navy">{n as string}</p>
                  <p className="text-sm text-slate-500">{l as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mentor */}
      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-sm font-bold uppercase tracking-wider text-teal">Your mentor</p>
          <div className="card mt-4 grid overflow-hidden md:grid-cols-[320px_1fr]">
            <div className="relative bg-[#0f1f33]">
              {photo ? (
                <img src={photo} alt="Aditya Tiwari, NDA Maths mentor" className="h-full max-h-[420px] w-full object-cover" />
              ) : (
                <div className="grid aspect-square place-items-center bg-gradient-to-br from-[#0f1f33] via-[#1d3557] to-[#4b5d2a]">
                  <span className="text-7xl font-extrabold tracking-tight text-white/90">AT</span>
                </div>
              )}
              <span className="absolute bottom-3 left-3 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-slate-900">NDA Maths Mentor</span>
            </div>
            <div className="p-6 md:p-8">
              <h2 className="text-3xl font-extrabold text-navy">Aditya Tiwari</h2>
              <p className="mt-1 flex items-center gap-2 text-slate-600"><GraduationCap size={18} className="text-teal" /> IIT Patna Alumni</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[[Trophy, "290 / 300", "Scored in Maths"], [Medal, "9 times", "Faced the SSB"], [GraduationCap, "IIT Patna", "Alumni"]].map(([I, n, l]) => {
                  const Icon = I as typeof Trophy;
                  return (
                    <div key={l as string} className="rounded-2xl border border-slate-200 p-4">
                      <Icon size={20} className="text-amber-500" />
                      <p className="mt-2 text-xl font-extrabold text-navy">{n as string}</p>
                      <p className="text-xs text-slate-500">{l as string}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-slate-600">
                Aditya has been exactly where you are. He scored 290 out of 300 in Maths and has faced the Services Selection Board 9 times, so he knows both halves of the journey — the written exam and the SSB. In this batch he teaches the methods that helped him, and shares what really happens at the SSB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-3xl font-extrabold text-navy">What you get for ₹{price}</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {INCLUDED.map(([I, t, d]) => {
            const Icon = I as typeof BookOpen;
            return (
              <div key={t} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0f1f33] text-amber-300"><Icon size={20} /></span>
                <h3 className="mt-4 font-bold">{t}</h3>
                <p className="mt-1 text-sm text-slate-600">{d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Syllabus */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <h2 className="text-3xl font-extrabold text-navy">NDA Maths syllabus we cover</h2>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {SYLLABUS.map(([t, d], i) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full brand-gradient text-sm font-bold text-white">{i + 1}</span>
              <div><p className="font-bold">{t}</p><p className="mt-0.5 text-sm text-slate-600">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for + CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-6 rounded-3xl bg-[#0f1f33] p-8 text-white md:grid-cols-[1fr_380px] md:p-10">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">Built for future officers</h2>
            <ul className="mt-5 space-y-3 text-white/85">
              {[
                [Users, "Class 11, Class 12 and 12th-pass students preparing for NDA"],
                [Shield, "Aspirants with a passion to join the Indian Army, Navy or Air Force"],
                [Target, "Students who find Maths hard or slow and want it to become their scoring section"],
                [CalendarDays, "Anyone who wants a structured plan — batch from 12 November 2026"],
              ].map(([I, t]) => {
                const Icon = I as typeof Users;
                return <li key={t as string} className="flex gap-3"><Icon size={20} className="mt-0.5 shrink-0 text-amber-300" /> {t as string}</li>;
              })}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/[0.07] p-5">
            <p className="text-sm text-white/70">One batch. One goal.</p>
            <p className="mt-1 text-3xl font-extrabold">₹{price}</p>
            <div className="mt-4"><EnrollButton {...enrollProps} dark /></div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <h2 className="text-2xl font-extrabold text-navy">Frequently asked questions</h2>
        <div className="card mt-4 divide-y divide-slate-100">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">{q}</summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Questions before you enrol? Call or WhatsApp <a href={`tel:+91${SUPPORT_PHONE}`} className="font-semibold text-teal">+91 {SUPPORT_PHONE}</a> or <Link href="/contact" className="font-semibold text-teal">raise a request</Link>.
        </p>
      </section>

      {/* Mobile sticky bar */}
      {!enrolled && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div><p className="text-xs text-slate-500">BRAHMASTRA · NDA Maths</p><p className="text-xl font-extrabold text-navy">₹{price}</p></div>
          <a href="#enrol" className="btn bg-amber-400 px-6 font-bold text-slate-900">Enrol now</a>
        </div>
      )}
    </div>
  );
}
