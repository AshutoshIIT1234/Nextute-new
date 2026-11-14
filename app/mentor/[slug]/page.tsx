import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio, FileText, ClipboardCheck, Users, Eye } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { courseAccess, type Video, type Note, type Test } from "@/lib/learn";
import VideoManager from "@/components/mentor/VideoManager";
import NotesManager from "@/components/mentor/NotesManager";
import TestsManager from "@/components/mentor/TestsManager";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mentor dashboard" };

const TABS = [
  ["classes", "Live & recordings", Radio],
  ["notes", "Class notes", FileText],
  ["tests", "Test series", ClipboardCheck],
  ["students", "Students", Users],
] as const;

export default async function MentorCourse({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { slug } = await params;
  const { tab: raw } = await searchParams;
  const tab = TABS.some(([k]) => k === raw) ? raw! : "classes";
  const { supabase, user, profile } = await getSession();
  if (!user) redirect(`/login?next=/mentor/${slug}`);
  const { course, isAdmin, isMentor } = await courseAccess(supabase, slug, user, profile);
  if (!course || (!isMentor && !isAdmin)) redirect("/mentor");

  const [{ data: videos }, { data: notes }, { data: tests }, { data: students }, { data: attempts }] = await Promise.all([
    supabase.from("course_videos").select("*").eq("course_slug", slug).order("starts_at", { ascending: false, nullsFirst: true }),
    supabase.from("course_notes").select("*").eq("course_slug", slug).order("created_at", { ascending: false }),
    supabase.from("course_tests").select("*").eq("course_slug", slug).order("created_at", { ascending: false }),
    supabase.from("course_enrollments").select("id, name, phone, email, paid_at").eq("course_slug", slug).eq("status", "paid").order("paid_at", { ascending: false }),
    supabase.from("test_attempts").select("test_id, submitted_at"),
  ]);
  const studentList = (students || []) as any[];
  const attemptCount: Record<string, number> = {};
  (attempts || []).forEach((a: any) => { if (a.submitted_at) attemptCount[a.test_id] = (attemptCount[a.test_id] || 0) + 1; });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="brand-gradient rounded-3xl p-6 text-white md:p-8">
        <p className="text-sm text-white/80">Mentor dashboard</p>
        <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">{course.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[[studentList.length, "students"], [(videos || []).length, "classes"], [(notes || []).length, "notes"], [(tests || []).length, "tests"]].map(([n, l]) => (
            <span key={l as string} className="rounded-xl bg-white/15 px-3 py-1.5"><b>{n as number}</b> {l as string}</span>
          ))}
          <Link href={`/learn/${slug}`} className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 font-semibold text-navy"><Eye size={15} /> See student view</Link>
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto">
        {TABS.map(([k, label, Icon]) => (
          <Link key={k} href={`/mentor/${slug}?tab=${k}`} className={"flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold " + (tab === k ? "bg-navy text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-teal")}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {tab === "classes" && <VideoManager slug={slug} initial={(videos || []) as Video[]} />}
        {tab === "notes" && <NotesManager slug={slug} initial={(notes || []) as Note[]} />}
        {tab === "tests" && <TestsManager slug={slug} initial={(tests || []) as Test[]} attempts={attemptCount} />}
        {tab === "students" && (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Student</th><th>Phone</th><th>Email</th><th>Enrolled</th></tr></thead>
              <tbody>
                {studentList.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50">
                    <td className="p-3 font-semibold">{s.name}</td>
                    <td>{s.phone && <a href={`https://wa.me/91${s.phone}`} target="_blank" className="text-teal">{s.phone}</a>}</td>
                    <td className="text-xs">{s.email}</td>
                    <td className="text-xs">{s.paid_at ? timeAgo(s.paid_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {studentList.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No students enrolled yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
