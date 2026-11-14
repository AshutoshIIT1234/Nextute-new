import { createClient } from "@/lib/supabase/server";
import TicketsTable from "@/components/admin/TicketsTable";
export const dynamic = "force-dynamic";
export const metadata = { title: "Support tickets" };
export default async function Tickets() {
  const sb = await createClient();
  const { data } = await sb.from("support_tickets").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Support tickets</h1>
      <p className="text-sm text-slate-500">Help requests from institutes and students submitted via the Help page.</p>
      <TicketsTable initial={(data as any) || []} />
    </div>
  );
}
