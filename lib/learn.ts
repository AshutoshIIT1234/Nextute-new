import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/server";

export type Course = { slug: string; title: string; price: number; mentor_name: string | null; mentor_photo: string | null; batch_start: string | null };
export type Video = { id: string; course_slug: string; kind: "live" | "recorded"; title: string; chapter: string | null; description: string | null; youtube_id: string; starts_at: string | null; duration_min: number | null; created_at: string };
export type Note = { id: string; course_slug: string; title: string; chapter: string | null; file_path: string; file_name: string | null; size_bytes: number | null; created_at: string };
export type Test = { id: string; course_slug: string; title: string; syllabus: string | null; duration_min: number; starts_at: string | null; ends_at: string | null; marks_correct: number; marks_wrong: number; is_published: boolean; created_at: string };
export type Question = { id: string; test_id: string; position: number; question: string; options: string[]; chapter: string | null; image_url: string | null };
export type Attempt = { id: string; test_id: string; user_id: string; started_at: string; submitted_at: string | null; answers: Record<string, number>; score: number | null; correct: number | null; wrong: number | null; skipped: number | null; chapter_stats: Record<string, { total: number; correct: number; wrong: number }> | null };

/** Who is looking at a course: admin, its mentor, or a paid student. */
export async function courseAccess(sb: SupabaseClient, slug: string, user: User | null, profile: Profile | null) {
  const { data: course } = await sb.from("courses").select("slug,title,price,mentor_name,mentor_photo,batch_start").eq("slug", slug).maybeSingle();
  if (!course || !user) return { course: course as Course | null, isAdmin: false, isMentor: false, isEnrolled: false };
  const isAdmin = profile?.role === "admin";
  const [{ data: m }, { data: e }] = await Promise.all([
    sb.from("course_mentors").select("mentor_id").eq("course_slug", slug).eq("mentor_id", user.id).maybeSingle(),
    sb.from("course_enrollments").select("id").eq("course_slug", slug).eq("user_id", user.id).eq("status", "paid").limit(1),
  ]);
  return { course: course as Course, isAdmin, isMentor: !!m, isEnrolled: !!e?.length };
}

/** Live status of a scheduled class. */
export function liveState(v: Pick<Video, "starts_at" | "duration_min">, now = Date.now()) {
  if (!v.starts_at) return "live" as const;
  const s = new Date(v.starts_at).getTime();
  const end = s + (v.duration_min || 60) * 60000 + 30 * 60000; // 30 min grace for overruns
  if (now < s - 15 * 60000) return "upcoming" as const; // doors open 15 min early
  if (now <= end) return "live" as const;
  return "ended" as const;
}

export function testState(t: Pick<Test, "starts_at" | "ends_at">, now = Date.now()) {
  if (t.starts_at && new Date(t.starts_at).getTime() > now) return "upcoming" as const;
  if (t.ends_at && new Date(t.ends_at).getTime() < now) return "closed" as const;
  return "open" as const;
}

export function fmtDateTime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export function groupBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>();
  rows.forEach((r) => { const k = key(r) || "General"; m.set(k, [...(m.get(k) || []), r]); });
  return [...m.entries()];
}
