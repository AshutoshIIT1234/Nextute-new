import Link from "next/link";
import { Shield, ArrowRight, CalendarDays, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Courses by Nextute", description: "Online batches by Nextute mentors, starting with BRAHMASTRA, Nextute's Ultimate NDA Maths Batch." };

export default async function Courses() {
  const sb = await createClient();
  const { data } = await sb.from("courses").select("*").eq("is_active", true).order("created_at");
  const list = (data?.length ? data : [{ slug: "nda-maths-april-2027", title: "BRAHMASTRA — Nextute's Ultimate NDA Maths Batch", price: 999, mentor_name: "Aditya Tiwari", batch_start: "12 November 2026" }]) as any[];
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">Nextute courses</h1>
      <p className="mt-1 text-slate-600">Batches taught by Nextute mentors.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Link key={c.slug} href={`/courses/${c.slug}`} className="card group overflow-hidden hover:border-teal">
            <div className="flex h-36 items-center justify-center bg-[#0f1f33] text-amber-300"><Shield size={48} /></div>
            <div className="p-5">
              <p className="font-bold group-hover:text-teal">{c.title}</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><GraduationCap size={14} /> {c.mentor_name}</p>
              <p className="flex items-center gap-1 text-sm text-slate-500"><CalendarDays size={14} /> Batch from {c.batch_start}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-2xl font-extrabold text-navy">₹{c.price}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal">View batch <ArrowRight size={14} /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
