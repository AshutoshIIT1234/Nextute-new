import Link from "next/link";
import type { Metadata } from "next";
import { Check, Minus, Lock, Star, BadgeCheck } from "lucide-react";
import Cover from "@/components/Cover";
import ComparePicker from "@/components/ComparePicker";
import CompareRemove from "@/components/CompareRemove";
import { getSession } from "@/lib/supabase/server";
import { PUBLIC_COLS } from "@/lib/constants";
import { feeRange, type Institute } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compare institutes" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const sp = await searchParams;
  const ids = (sp.ids || "").split(",").filter((x) => /^[0-9a-f-]{36}$/i.test(x)).slice(0, 3);
  const { supabase, user } = await getSession();
  let list: Institute[] = [];
  if (ids.length) {
    const { data } = await supabase.from("institutes").select(user ? "*" : PUBLIC_COLS).in("id", ids);
    list = ids.map((id) => (data as unknown as Institute[] | null)?.find((d) => d.id === id)).filter(Boolean) as Institute[];
  }
  const loggedIn = !!user;
  const allFacilities = [...new Set(list.flatMap((i) => i.facilities))].sort();
  const minFee = Math.min(...list.map((i) => i.fee_min || Infinity));

  type Row = { label: string; render: (i: Institute) => React.ReactNode; locked?: boolean };
  const rows: Row[] = [
    { label: "Area", render: (i) => `${i.area}, ${i.city}` },
    { label: "Fees / year", render: (i) => <span className={i.fee_min === minFee && list.length > 1 ? "font-bold text-green-700" : "font-semibold"}>{feeRange(i.fee_min, i.fee_max)}{i.fee_min === minFee && list.length > 1 ? " · lowest" : ""}</span> },
    { label: "Rating", render: (i) => (i.review_count ? <span className="flex items-center gap-1"><Star size={14} className="fill-amber-400 text-amber-400" /> {Number(i.rating).toFixed(1)} ({i.review_count})</span> : "No reviews yet") },
    { label: "Verified by Nextute", render: (i) => (i.is_verified ? <BadgeCheck className="text-teal" size={18} /> : <Minus className="text-slate-300" size={18} />) },
    { label: "Mode", render: (i) => i.mode },
    { label: "Established", render: (i) => i.established_year || "—" },
    { label: "Classes", render: (i) => i.classes.join(", ") },
    { label: "Courses / exams", render: (i) => i.exams.join(", ") },
    { label: "Subjects", render: (i) => i.subjects?.join(", ") || "—" },
    { label: "Batch size", render: (i) => (i.batch_size ? `~${i.batch_size} students` : "—") },
    { label: "Demo lectures", render: (i) => i.demo_count },
    { label: "Faculty members", render: (i) => i.faculty_count },
    {
      label: "Teacher qualifications",
      locked: true,
      render: (i) => i.faculty?.length ? (
        <ul className="space-y-1">{i.faculty.map((f, k) => <li key={k}><b>{f.subject}:</b> {f.qualification}{f.experience ? ` (${f.experience})` : ""}</li>)}</ul>
      ) : "—",
    },
    { label: "Batches", locked: true, render: (i) => i.batches?.length ? <ul className="space-y-1">{i.batches.map((b, k) => <li key={k}>{b.name}{b.timing ? ` · ${b.timing}` : ""}</li>)}</ul> : "—" },
    { label: "Timings", locked: true, render: (i) => i.timings || "—" },
    { label: "Scholarship", locked: true, render: (i) => i.scholarship || "—" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-navy md:text-3xl">Compare institutes</h1>
      <p className="mt-1 text-sm text-slate-500">Side-by-side on fees, facilities, faculty and more. Compare up to 3.</p>
      <div className="mt-6"><ComparePicker ids={ids} /></div>

      {list.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-lg font-semibold">Nothing to compare yet</p>
          <p className="mt-1 text-sm text-slate-500">Tap “Compare” on any institute card, or search above.</p>
          <Link href="/institutes" className="btn-primary mt-4">Browse institutes</Link>
        </div>
      ) : (
        <div className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed text-left text-sm">
            <thead>
              <tr>
                <th className="w-44 p-4 align-bottom text-xs uppercase text-slate-500">Institute</th>
                {list.map((i) => (
                  <th key={i.id} className="p-4 align-top font-normal">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl"><Cover src={i.cover_image || i.photos?.[0]} name={i.name} /><CompareRemove id={i.id} ids={ids} /></div>
                    <Link href={`/institutes/${i.slug}`} className="mt-3 block text-base font-bold text-navy hover:text-teal">{i.name}</Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-slate-100 align-top">
                  <td className="bg-slate-50/60 p-4 font-medium text-slate-600">{r.label}</td>
                  {list.map((i) => (
                    <td key={i.id} className="p-4">
                      {r.locked && !loggedIn ? (
                        <Link href={`/signup?next=${encodeURIComponent(`/compare?ids=${ids.join(",")}`)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-teal"><Lock size={12} /> Sign up to view</Link>
                      ) : r.render(i)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-slate-200"><td colSpan={list.length + 1} className="bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">Facilities</td></tr>
              {allFacilities.map((f) => (
                <tr key={f} className="border-t border-slate-100">
                  <td className="bg-slate-50/60 px-4 py-2.5 text-slate-600">{f}</td>
                  {list.map((i) => (
                    <td key={i.id} className="px-4 py-2.5">{i.facilities.includes(f) ? <Check size={18} className="text-leaf" /> : <Minus size={18} className="text-slate-300" />}</td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-slate-200">
                <td className="p-4" />
                {list.map((i) => <td key={i.id} className="p-4"><Link href={`/institutes/${i.slug}`} className="btn-primary w-full">View & enquire</Link></td>)}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
