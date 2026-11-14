import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "My courses" };

export default async function Learn() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/login?next=/learn");
  const { data } = await supabase.from("course_enrollments").select("course_slug, courses(title, mentor_name, batch_start)").eq("user_id", user.id).eq("status", "paid");
  const list = (data || []) as any[];
  if (list.length === 1) redirect(`/learn/${list[0].course_slug}`);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-navy">My courses</h1>
      {list.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <p className="text-slate-600">You haven&apos;t enrolled in a course yet.</p>
          <Link href="/courses" className="btn-primary mt-4">Browse courses</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {list.map((c) => (
            <Link key={c.course_slug} href={`/learn/${c.course_slug}`} className="flex items-center gap-4 rounded-2xl bg-[#0f1f33] p-5 text-white hover:opacity-95">
              <Shield size={32} className="shrink-0 text-amber-300" />
              <div><p className="font-bold">{c.courses?.title}</p><p className="text-sm text-white/70">Mentor {c.courses?.mentor_name} · {c.courses?.batch_start}</p></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
