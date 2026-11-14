import { createClient } from "@/lib/supabase/server";
import LeadsTable from "@/components/LeadsTable";
export const dynamic = "force-dynamic";
export const metadata = { title: "Enquiries" };
export default async function Queries() {
  const sb = await createClient();
  const { data } = await sb.from("queries").select("*, institutes(name)").order("created_at", { ascending: false }).limit(1000);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">All admission enquiries</h1>
      <p className="text-sm text-slate-500">Every enquiry students have sent across the platform. Useful for following up when an institute is slow to respond.</p>
      <LeadsTable initial={(data as any) || []} showInstitute allowDelete />
    </div>
  );
}
