import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, MessageSquareText, Search, GitCompareArrows, GraduationCap, Shield } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import InstituteCard from "@/components/InstituteCard";
import StatusBadge from "@/components/StatusBadge";
import ProfileForm from "@/components/ProfileForm";
import { timeAgo, type Institute } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "My dashboard" };

export default async function StudentDashboard() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/student");
  if (profile?.role === "institute") redirect("/institute");
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "mentor") redirect("/mentor");

  const [{ data: queries }, { data: shortlist }, { data: courses }] = await Promise.all([
    supabase.from("queries").select("*, institutes(name, slug, area, phone)").eq("student_id", user.id).order("created_at", { ascending: false }),
    supabase.from("shortlists").select("institutes(*)").eq("student_id", user.id).order("created_at", { ascending: false }),
    supabase.from("course_enrollments").select("*, courses(title, batch_start, mentor_name)").eq("user_id", user.id).eq("status", "paid").order("paid_at", { ascending: false }),
  ]);
  const saved = ((shortlist || []).map((s: any) => s.institutes).filter(Boolean)) as Institute[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Student dashboard</p>
          <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Hi {profile?.full_name?.split(" ")[0] || "there"} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/institutes" className="btn-primary"><Search size={16} /> Find institutes</Link>
          <Link href="/compare" className="btn-outline"><GitCompareArrows size={16} /> Compare</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-slate-500">Enquiries sent</p><p className="mt-1 text-3xl font-extrabold text-navy">{queries?.length || 0}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Shortlisted</p><p className="mt-1 text-3xl font-extrabold text-navy">{saved.length}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Admissions confirmed</p><p className="mt-1 text-3xl font-extrabold text-navy">{(queries || []).filter((q: any) => q.status === "admitted").length}</p></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold"><GraduationCap size={20} className="text-teal" /> My courses</h2>
            {(courses || []).length === 0 ? (
              <Link href="/courses/nda-maths-april-2027" className="mt-3 flex items-center gap-4 rounded-2xl bg-[#0f1f33] p-5 text-white hover:opacity-95">
                <Shield size={32} className="shrink-0 text-amber-300" />
                <div className="flex-1"><p className="font-bold">BRAHMASTRA — Nextute&apos;s Ultimate NDA Maths Batch</p><p className="text-sm text-white/75">Mentor Aditya Tiwari (IIT Patna Alumni) · ₹999</p></div>
                <span className="btn bg-amber-400 font-bold text-slate-900">View batch</span>
              </Link>
            ) : (
              <div className="card mt-3 divide-y divide-slate-100">
                {(courses || []).map((c: any) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <Link href={`/courses/${c.course_slug}`} className="font-semibold hover:text-teal">{c.courses?.title || c.course_slug}</Link>
                      <p className="text-xs text-slate-500">Batch from {c.courses?.batch_start} · Mentor {c.courses?.mentor_name} · Paid ₹{c.amount} · {c.razorpay_payment_id}</p>
                    </div>
                    <Link href={`/learn/${c.course_slug}`} className="btn-primary py-2 text-sm">Open classes</Link>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold"><MessageSquareText size={20} className="text-teal" /> My enquiries</h2>
            <div className="card mt-3 divide-y divide-slate-100">
              {(queries || []).length === 0 && <p className="p-6 text-sm text-slate-500">You haven&apos;t sent any enquiries yet. Open an institute and tap “Send admission enquiry”.</p>}
              {(queries || []).map((q: any) => (
                <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <Link href={`/institutes/${q.institutes?.slug}`} className="font-semibold hover:text-teal">{q.institutes?.name || "Institute"}</Link>
                    <p className="text-xs text-slate-500">{q.institutes?.area} · {q.exam_interest || "General"} · sent {timeAgo(q.created_at)}</p>
                  </div>
                  <StatusBadge s={q.status} />
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="flex items-center gap-2 text-lg font-bold"><Heart size={20} className="text-rose-500" /> Shortlisted institutes</h2>
            {saved.length === 0 ? (
              <p className="card mt-3 p-6 text-sm text-slate-500">Tap “Shortlist” on any institute to save it here.</p>
            ) : (
              <div className="mt-3 grid gap-5 sm:grid-cols-2">{saved.map((i) => <InstituteCard key={i.id} inst={i} />)}</div>
            )}
          </section>
        </div>
        <aside className="card h-fit p-5">
          <h2 className="font-bold">My profile</h2>
          <p className="mb-4 text-xs text-slate-500">{user.email}</p>
          <ProfileForm profile={{ id: user.id, full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, city: profile?.city ?? null, class_level: profile?.class_level ?? null }} />
        </aside>
      </div>
    </div>
  );
}
