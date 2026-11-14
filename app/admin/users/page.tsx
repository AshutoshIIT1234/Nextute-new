import { getSession } from "@/lib/supabase/server";
import UsersTable from "@/components/admin/UsersTable";
export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };
export default async function Users({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const sp = await searchParams;
  const { supabase, user } = await getSession();
  const { data, error } = await supabase.from("profiles").select("*, queries(count)").order("created_at", { ascending: false });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Users</h1>
      <p className="text-sm text-slate-500">Everyone who has signed up — students, institute owners and admins.</p>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <UsersTable initial={(data as any) || []} initialRole={sp.role || "all"} meId={user!.id} />
    </div>
  );
}
