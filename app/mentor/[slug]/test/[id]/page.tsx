import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import { courseAccess, type Test, type Question } from "@/lib/learn";
import TestEditor from "@/components/mentor/TestEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit test" };

export default async function MentorTest({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { supabase, user, profile } = await getSession();
  if (!user) redirect(`/login?next=/mentor/${slug}/test/${id}`);
  const { course, isAdmin, isMentor } = await courseAccess(supabase, slug, user, profile);
  if (!course || (!isMentor && !isAdmin)) redirect("/mentor");
  const { data: t } = await supabase.from("course_tests").select("*").eq("id", id).eq("course_slug", slug).maybeSingle();
  if (!t) notFound();
  const { data: qs } = await supabase.from("test_questions").select("*").eq("test_id", id).order("position");
  const ids = (qs || []).map((q: any) => q.id);
  const [{ data: keys }, { data: attempts }, { data: enr }] = await Promise.all([
    ids.length ? supabase.from("test_keys").select("*").in("question_id", ids) : Promise.resolve({ data: [] as any[] }),
    supabase.from("test_attempts").select("user_id, score, correct, wrong, skipped, submitted_at").eq("test_id", id).not("submitted_at", "is", null).order("score", { ascending: false }),
    supabase.from("course_enrollments").select("user_id, name, phone").eq("course_slug", slug).eq("status", "paid"),
  ]);
  const who = new Map((enr || []).map((e: any) => [e.user_id, e]));
  const bestBy = new Map<string, any>();
  (attempts || []).forEach((a: any) => {
    const cur = bestBy.get(a.user_id);
    const n = (cur?.attempts || 0) + 1;
    if (!cur || Number(a.score) > Number(cur.score)) bestBy.set(a.user_id, { ...a, attempts: n });
    else cur.attempts = n;
  });
  const results = [...bestBy.values()].sort((x, y) => Number(y.score) - Number(x.score)).map((a: any) => ({ ...a, name: who.get(a.user_id)?.name || "Student", phone: who.get(a.user_id)?.phone || "" }));
  const keyBy: Record<string, { correct: number; explanation: string | null }> = {};
  (keys || []).forEach((k: any) => (keyBy[k.question_id] = { correct: k.correct, explanation: k.explanation }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link href={`/mentor/${slug}?tab=tests`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-teal"><ArrowLeft size={16} /> Back to tests</Link>
      <div className="mt-4">
        <TestEditor test={t as Test} initialQuestions={(qs || []) as Question[]} initialKeys={keyBy} results={results} />
      </div>
    </div>
  );
}
