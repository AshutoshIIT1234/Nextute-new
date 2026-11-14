import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Eye, MessageSquareText, PlusCircle, Pencil, ExternalLink, Clock, CheckCircle2, XCircle, Headphones, Circle,
  BadgeCheck, Users, Search, Smartphone, Rocket, TrendingUp,
} from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import LeadsTable, { type Lead } from "@/components/LeadsTable";
import StatusBadge from "@/components/StatusBadge";
import Cover from "@/components/Cover";
import PartnerAppFeatures, { APP_LAUNCH } from "@/components/PartnerAppFeatures";
import PartnerInterestForm from "@/components/PartnerInterestForm";
import { SUPPORT_PHONE } from "@/lib/constants";
import type { Institute } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Institute dashboard" };

function completeness(l: Institute) {
  const checks: [string, boolean][] = [
    ["Description", !!l.description && l.description.length > 60],
    ["At least 3 photos", (l.photos?.length || 0) >= 3],
    ["Demo lecture", l.demo_count > 0],
    ["Faculty details", l.faculty_count > 0],
    ["Batches & timings", (l.batches?.length || 0) > 0],
    ["Fee range", !!l.fee_min],
    ["Facilities", l.facilities.length >= 3],
    ["Contact number", !!(l.phone || l.whatsapp)],
  ];
  return { checks, pct: Math.round((checks.filter(([, ok]) => ok).length / checks.length) * 100) };
}

export default async function InstituteDashboard({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/institute");
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role !== "institute") redirect("/student");

  const { data: insts } = await supabase.from("institutes").select("*").eq("owner_id", user.id).order("created_at");
  const listings = (insts || []) as Institute[];
  if (!listings.length) redirect("/institute/listing");

  const [{ data: leads }, { data: interest }] = await Promise.all([
    supabase.from("queries").select("*, institutes(name)").in("institute_id", listings.map((l) => l.id)).order("created_at", { ascending: false }),
    supabase.from("partner_interest").select("services, students_count").eq("owner_id", user.id).maybeSingle(),
  ]);
  const all = (leads || []) as Lead[];
  const views = listings.reduce((a, l) => a + (l.views || 0), 0);
  const fresh = all.filter((l) => l.status === "new").length;
  const admitted = all.filter((l) => l.status === "admitted").length;
  const weekAgo = Date.now() - 7 * 86400000;
  const thisWeek = all.filter((l) => new Date(l.created_at).getTime() > weekAgo).length;
  const main = listings[0];
  const { checks, pct } = completeness(main);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {sp.saved && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">Listing saved successfully.</div>}

      <div className="brand-gradient relative overflow-hidden rounded-3xl p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 right-32 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">Institute dashboard</p>
            <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">Welcome, {profile?.full_name?.split(" ")[0] || "Partner"} 👋</h1>
            <p className="mt-1 text-sm text-white/85">
              {main.status === "approved" ? `${main.name} is live on Nextute.` : main.status === "pending" ? `${main.name} is under review — usually live within 24 hours.` : `${main.name} needs a few changes before going live.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/institute/listing?id=${main.id}`} className="btn bg-white text-navy hover:bg-slate-100"><Pencil size={15} /> Edit listing</Link>
            <Link href={`/institutes/${main.slug}`} className="btn border border-white/40 text-white hover:bg-white/10"><ExternalLink size={15} /> View public page</Link>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          [Eye, "Profile views", views, "bg-blue-50 text-blue-600"],
          [MessageSquareText, "Total enquiries", all.length, "bg-teal-50 text-teal"],
          [TrendingUp, "This week", thisWeek, "bg-purple-50 text-purple-600"],
          [Clock, "New / uncontacted", fresh, "bg-amber-50 text-amber-600"],
          [CheckCircle2, "Admissions", admitted, "bg-green-50 text-green-600"],
        ].map(([I, l, n, c]) => {
          const Icon = I as typeof Eye;
          return (
            <div key={l as string} className="card p-5">
              <span className={"grid h-10 w-10 place-items-center rounded-xl " + c}><Icon size={18} /></span>
              <p className="mt-3 text-3xl font-extrabold text-navy">{n as number}</p>
              <p className="text-sm text-slate-500">{l as string}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Your listing{listings.length > 1 ? "s" : ""}</h2>
            <Link href="/institute/listing?new=1" className="btn-outline py-2 text-sm"><PlusCircle size={15} /> Add another branch</Link>
          </div>
          <div className="mt-3 grid gap-4">
            {listings.map((l) => (
              <div key={l.id} className="card flex gap-4 p-4">
                <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl"><Cover src={l.cover_image || l.photos?.[0]} name={l.name} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-bold">{l.name}</p>
                    <StatusBadge s={l.status} />
                  </div>
                  <p className="text-xs text-slate-500">{l.area}, {l.city} · {l.photos.length} photos · {l.demo_count} demos · {l.faculty_count} faculty</p>
                  {l.status === "pending" && <p className="mt-1 flex items-center gap-1 text-xs text-amber-700"><Clock size={12} /> Under review — usually within 24 hours</p>}
                  {l.status === "rejected" && <p className="mt-1 flex items-center gap-1 text-xs text-red-700"><XCircle size={12} /> {l.rejection_reason || "Needs changes"} — edit and save to resubmit</p>}
                  <div className="mt-3 flex gap-2">
                    <Link href={`/institute/listing?id=${l.id}`} className="btn-primary py-1.5 text-xs"><Pencil size={13} /> Edit</Link>
                    <Link href={`/institutes/${l.slug}`} className="btn-outline py-1.5 text-xs"><ExternalLink size={13} /> View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Profile strength</h2>
            <span className="text-2xl font-extrabold text-navy">{pct}%</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-slate-100"><div className="h-2.5 rounded-full brand-gradient" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-xs text-slate-500">Complete listings get up to 3× more enquiries.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {checks.map(([label, ok]) => (
              <li key={label} className={"flex items-center gap-2 " + (ok ? "text-slate-500" : "text-slate-800")}>
                {ok ? <CheckCircle2 size={16} className="text-leaf" /> : <Circle size={16} className="text-slate-300" />} {label}
              </li>
            ))}
          </ul>
          {pct < 100 && <Link href={`/institute/listing?id=${main.id}`} className="btn-primary mt-4 w-full">Complete my profile</Link>}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-bold">What Nextute does for you</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Search, "Found by local students", "Students in your area find you by locality, course, fees and distance."],
            [MessageSquareText, "Direct admission leads", "Every enquiry comes to you with the student's phone number — no commission."],
            [BadgeCheck, "Verified badge", "Get verified by our team to build trust and rank higher in search."],
            [Users, "Compare-ready profile", "Show faculty, demo lectures and facilities that students compare before joining."],
          ].map(([I, t, d]) => {
            const Icon = I as typeof Search;
            return (
              <div key={t as string} className="card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal"><Icon size={18} /></span>
                <h3 className="mt-3 font-semibold">{t as string}</h3>
                <p className="mt-1 text-sm text-slate-600">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">Admission enquiries</h2>
        <p className="text-sm text-slate-500">Students who want to join. Call or WhatsApp them and update the status as you go.</p>
        <div className="mt-3"><LeadsTable initial={all} showInstitute={listings.length > 1} /></div>
      </section>

      <section className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="grid gap-6 bg-navy p-6 text-white md:grid-cols-[1fr_340px] md:p-8">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"><Rocket size={14} /> Launching {APP_LAUNCH}</span>
            <h2 className="mt-4 text-2xl font-extrabold md:text-3xl">The Nextute Partner App for your institute</h2>
            <p className="mt-2 max-w-xl text-white/80">
              Automate your test ecosystem, give students a proper lecture planner and share class notes — all from one personalised dashboard for partnered local institutes.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-white/70"><Smartphone size={16} /> Works for students on mobile — no extra effort for your teachers.</p>
          </div>
          <PartnerInterestForm
            ownerId={user.id}
            instituteId={main.id}
            instituteName={main.name}
            contactName={profile?.full_name || ""}
            phone={profile?.phone || main.phone || ""}
            email={user.email || ""}
            existing={(interest as any) || null}
          />
        </div>
        <div className="p-6 md:p-8"><PartnerAppFeatures /></div>
      </section>

      <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="flex items-center gap-2 text-sm"><Headphones size={18} className="text-teal" /> Facing an issue with your listing? The Nextute team is here to help.</p>
        <div className="flex gap-2">
          <a href={`tel:+91${SUPPORT_PHONE}`} className="btn-outline">Call +91 {SUPPORT_PHONE}</a>
          <Link href="/contact" className="btn-primary">Raise a ticket</Link>
        </div>
      </div>
    </div>
  );
}
