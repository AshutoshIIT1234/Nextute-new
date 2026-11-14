import { createClient } from "@/lib/supabase/server";
import InstitutesAdminTable from "@/components/admin/InstitutesAdminTable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Institutes" };

export default async function AdminInstitutes({ searchParams }: { searchParams: Promise<{ status?: string; saved?: string }> }) {
  const sp = await searchParams;
  const sb = await createClient();
  const { data, error } = await sb
    .from("institutes")
    .select("id,slug,name,area,city,status,is_verified,is_featured,is_sample,fee_min,fee_max,views,owner_id,created_at,demo_count,faculty_count,photos,profiles(email,full_name)")
    .order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Institutes</h1>
      {sp.saved && <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">Saved successfully.</div>}
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <InstitutesAdminTable initial={(data as any) || []} initialStatus={sp.status || "all"} />
    </div>
  );
}
