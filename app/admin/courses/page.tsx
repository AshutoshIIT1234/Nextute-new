import { getSession } from "@/lib/supabase/server";
import CourseAdmin from "@/components/admin/CourseAdmin";
import MentorAssign from "@/components/admin/MentorAssign";
import EnrollmentManager from "@/components/admin/EnrollmentManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Courses & payments" };

export default async function AdminCourses() {
  const { supabase, user } = await getSession();
  const [{ data: courses, error }, { data: rows }, { data: mentors }, { data: links }] = await Promise.all([
    supabase.from("courses").select("*").order("created_at"),
    supabase.from("course_enrollments").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("profiles").select("id, full_name, email, phone, mentor_subject, created_at").eq("role", "mentor").order("created_at", { ascending: false }),
    supabase.from("course_mentors").select("course_slug, mentor_id"),
  ]);
  const all = (rows || []) as any[];
  const paid = all.filter((r) => r.status === "paid");
  const revenue = all.filter((r) => r.status === "paid" || r.status === "removed").reduce((a, r) => a + (r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">Courses & payments</h1>
        <p className="text-sm text-slate-500">Edit the course, upload the mentor photo, approve mentors, and add or remove students from a batch.</p>
      </div>
      {error && <p className="card p-4 text-sm text-red-600">Courses table not found — run supabase/courses_2026_11.sql in the Supabase SQL Editor.</p>}
      {(courses || []).map((c: any) => <CourseAdmin key={c.slug} course={c} adminId={user!.id} />)}
      <MentorAssign courses={(courses || []).map((c: any) => ({ slug: c.slug, title: c.title }))} mentors={(mentors || []) as any[]} initial={(links || []) as any[]} />

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5"><p className="text-sm text-slate-500">Paid enrolments</p><p className="mt-1 text-3xl font-extrabold text-navy">{paid.length}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Revenue</p><p className="mt-1 text-3xl font-extrabold text-navy">₹{revenue.toLocaleString("en-IN")}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Removed</p><p className="mt-1 text-3xl font-extrabold text-navy">{all.filter((r) => r.status === "removed").length}</p></div>
      </div>

      <EnrollmentManager courses={(courses || []).map((c: any) => ({ slug: c.slug, title: c.title }))} initial={all} />
    </div>
  );
}
