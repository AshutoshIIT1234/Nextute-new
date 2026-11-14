import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import InstituteForm from "@/components/InstituteForm";
export const dynamic = "force-dynamic";
export const metadata = { title: "Edit institute" };
export default async function EditInstitute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getSession();
  const { data } = await supabase.from("institutes").select("*, profiles(email)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const { profiles, ...inst } = data as any;
  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-navy">Edit: {inst.name}</h1>
        <Link href={`/institutes/${inst.slug}`} target="_blank" className="btn-outline"><ExternalLink size={15} /> View public page</Link>
      </div>
      <div className="mt-6"><InstituteForm mode="admin" userId={user!.id} initial={inst} ownerEmail={profiles?.email} /></div>
    </div>
  );
}
