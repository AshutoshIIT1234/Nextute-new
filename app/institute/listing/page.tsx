import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Headphones } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import InstituteForm from "@/components/InstituteForm";
import { SUPPORT_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "My listing" };

export default async function ListingPage({ searchParams }: { searchParams: Promise<{ id?: string; new?: string }> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await getSession();
  if (!user) redirect("/login?next=/institute/listing");
  if (profile?.role === "admin") redirect("/admin/institutes/new");
  if (profile?.role !== "institute") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">This is a student account</h1>
        <p className="mt-2 text-slate-600">To list an institute, create a separate account and choose “I run an institute”, or contact us and we&apos;ll set it up for you.</p>
        <div className="mt-5 flex justify-center gap-2"><Link href="/contact" className="btn-primary">Contact Nextute</Link></div>
      </div>
    );
  }

  let initial = null;
  if (sp.id) {
    const { data } = await supabase.from("institutes").select("*").eq("id", sp.id).eq("owner_id", user.id).maybeSingle();
    initial = data;
  } else if (!sp.new) {
    const { data } = await supabase.from("institutes").select("*").eq("owner_id", user.id).order("created_at").limit(1);
    initial = data?.[0] ?? null;
  }
  const prefill = initial ?? { contact_name: profile.full_name, phone: profile.phone, email: user.email, city: profile.city || "Patna" };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {initial && <Link href="/institute" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal"><ArrowLeft size={14} /> Back to dashboard</Link>}
      <h1 className="text-2xl font-extrabold text-navy md:text-3xl">{initial ? `Edit ${initial.name}` : "List your institute on Nextute"}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {initial ? "Keep your details fresh — complete listings get more enquiries." : "Free forever. Fill in what you can now; you can always come back and add photos, demo lectures and faculty."}
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-teal-50 p-3 text-sm text-teal">
        <Headphones size={16} /> Need help filling this? Call us at <a href={`tel:+91${SUPPORT_PHONE}`} className="font-semibold underline">+91 {SUPPORT_PHONE}</a> or <Link href="/contact" className="font-semibold underline">raise a ticket</Link>.
      </div>
      <div className="mt-6"><InstituteForm mode="owner" userId={user.id} initial={prefill as any} /></div>
    </div>
  );
}
