import { createClient } from "@/lib/supabase/server";
import ReviewsAdmin from "@/components/admin/ReviewsAdmin";
export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };
export default async function Reviews() {
  const sb = await createClient();
  const { data } = await sb.from("reviews").select("*, institutes(name)").order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Reviews</h1>
      <p className="text-sm text-slate-500">Moderate student reviews. Deleting a review recalculates the institute&apos;s rating.</p>
      <ReviewsAdmin initial={data || []} />
    </div>
  );
}
