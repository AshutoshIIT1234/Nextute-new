import { getSession } from "@/lib/supabase/server";
import InstituteForm from "@/components/InstituteForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Add institute" };
export default async function NewInstitute() {
  const { user } = await getSession();
  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold text-navy">Add an institute</h1>
      <p className="mt-1 text-sm text-slate-500">Create a listing on behalf of an institute. Optionally link it to their account so they can manage it and receive enquiries.</p>
      <div className="mt-6"><InstituteForm mode="admin" userId={user!.id} initial={{ status: "approved" } as any} /></div>
    </div>
  );
}
