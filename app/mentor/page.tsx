import Link from "next/link";
import { redirect } from "next/navigation";
import { Hourglass, Shield, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { SUPPORT_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor dashboard" };

export default async function MentorHome() {
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/mentor");
  if (profile?.role !== "mentor" && profile?.role !== "admin") redirect("/dashboard");
  const { data } = profile?.role === "admin"
    ? await supabase.from("courses").select("slug, title, batch_start")
    : await supabase.from("course_mentors").select("course_slug, courses(slug, title, batch_start)").eq("mentor_id", user.id);
  const courses = ((data || []) as any[]).map((r) => r.courses || r);
  if (courses.length === 1) redirect(`/mentor/${courses[0].slug}`);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm text-slate-500">Mentor dashboard</p>
      <h1 className="text-2xl font-extrabold text-navy">Welcome, {profile?.full_name?.split(" ")[0] || "Mentor"}</h1>
      {courses.length === 0 ? (
        <div className="card mt-6 flex gap-4 p-6">
          <Hourglass className="shrink-0 text-amber-500" size={32} />
          <div>
            <p className="font-bold">Your mentor account is waiting for approval</p>
            <p className="mt-1 text-sm text-slate-600">The Nextute team will verify your profile and assign you to a course. Once approved, your course appears here and you can schedule live classes, upload notes and create tests.</p>
            <p className="mt-2 text-sm text-slate-600">Questions? Call or WhatsApp +91 {SUPPORT_PHONE}.</p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <Link key={c.slug} href={`/mentor/${c.slug}`} className="flex items-center gap-4 rounded-2xl bg-[#0f1f33] p-5 text-white hover:opacity-95">
              <Shield size={30} className="shrink-0 text-amber-300" />
              <div className="flex-1"><p className="font-bold">{c.title}</p><p className="text-sm text-white/70">Batch from {c.batch_start}</p></div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
