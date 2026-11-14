import Link from "next/link";
import { BadgeCheck, BarChart3, ImagePlus, MessageSquareText, PlayCircle, Users, Headphones, CheckCircle2 } from "lucide-react";
import { SUPPORT_PHONE } from "@/lib/constants";
import PartnerAppFeatures, { APP_LAUNCH } from "@/components/PartnerAppFeatures";

export const metadata = { title: "List your institute free" };

export default function ForInstitutes() {
  return (
    <>
      <section className="brand-gradient text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <p className="chip border-white/30 bg-white/10 text-white">For coaching institutes</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">Get more admissions from students searching in your area.</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">List your institute on Nextute for free. Show your faculty, facilities, fees and demo lectures — and receive admission enquiries directly in your dashboard.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup?role=institute" className="btn bg-white px-6 py-3 text-navy hover:bg-slate-100">Register your institute — free</Link>
            <a href={`tel:+91${SUPPORT_PHONE}`} className="btn border border-white/40 px-6 py-3 text-white hover:bg-white/10">Call +91 {SUPPORT_PHONE}</a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl font-bold text-navy md:text-3xl">Everything you need to stand out</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [ImagePlus, "Rich profile", "Photos of classrooms, library and labs, fees, batches, timings and scholarships."],
            [PlayCircle, "Demo lectures", "Upload short videos or YouTube links so students can see your teaching quality."],
            [Users, "Faculty showcase", "Highlight teacher qualifications and experience — the #1 thing parents compare."],
            [MessageSquareText, "Direct enquiries", "Interested students send enquiries with their phone number straight to you."],
            [BarChart3, "Lead dashboard", "Track every enquiry: new, contacted, visited, admitted. Export to Excel."],
            [BadgeCheck, "Verified badge", "Get verified by the Nextute team to build trust and rank higher."],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Users;
            return (
              <div key={t as string} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal"><Icon size={20} /></span>
                <h3 className="mt-4 font-bold">{t as string}</h3>
                <p className="mt-1 text-sm text-slate-600">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <span className="chip-active">Launching {APP_LAUNCH}</span>
        <h2 className="mt-3 text-2xl font-bold text-navy md:text-3xl">Coming soon: the Nextute Partner App</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Partnered institutes get a personalised dashboard to automate tests, plan lectures and share class notes. Register your institute to get early access.</p>
        <div className="mt-6"><PartnerAppFeatures /></div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-6">
        <div className="card grid gap-8 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-2xl font-bold text-navy">Get listed in 3 steps</h2>
            <ol className="mt-6 space-y-5">
              {[["Create an account", "Choose “I run an institute” while signing up."], ["Fill your details", "Name, location, fees, batches, classes, photos and demo lectures."], ["Go live", "Our team reviews your listing (usually within 24 hours) and publishes it."]].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full brand-gradient font-bold text-white">{i + 1}</span>
                  <div><p className="font-semibold">{t}</p><p className="text-sm text-slate-600">{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-teal-50 p-6">
            <p className="flex items-center gap-2 font-bold text-navy"><Headphones size={20} className="text-teal" /> Prefer we do it for you?</p>
            <p className="mt-2 text-sm text-slate-700">Share your details on call or WhatsApp and the Nextute team will create your listing.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {["Free listing", "No commission on admissions", "Edit anytime from your dashboard"].map((t) => <li key={t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-leaf" /> {t}</li>)}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`https://wa.me/91${SUPPORT_PHONE}?text=${encodeURIComponent("Hi Nextute, I want to list my institute.")}`} target="_blank" rel="noreferrer" className="btn bg-green-600 text-white hover:bg-green-700">WhatsApp us</a>
              <Link href="/contact" className="btn-outline">Raise a request</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
