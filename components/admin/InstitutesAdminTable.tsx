"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Check, ExternalLink, Pencil, Search, Sparkles, Trash2, X, PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import { feeRange, timeAgo } from "@/lib/utils";

type Row = {
  id: string; slug: string; name: string; area: string; city: string; status: string; is_verified: boolean; is_featured: boolean;
  is_sample: boolean; fee_min: number | null; fee_max: number | null; views: number; owner_id: string | null; created_at: string;
  demo_count: number; faculty_count: number; photos: string[]; profiles?: { email: string | null; full_name: string | null } | null;
};

export default function InstitutesAdminTable({ initial, initialStatus }: { initial: Row[]; initialStatus: string }) {
  const router = useRouter();
  const sb = createClient();
  const [rows, setRows] = useState(initial);
  const [status, setStatus] = useState(initialStatus || "all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const shown = useMemo(() => rows.filter((r) =>
    (status === "all" || r.status === status || (status === "sample" && r.is_sample)) &&
    (!q || `${r.name} ${r.area} ${r.city} ${r.profiles?.email || ""}`.toLowerCase().includes(q.toLowerCase()))), [rows, status, q]);

  async function patch(id: string, p: Partial<Row> & { rejection_reason?: string | null }) {
    setBusy(id);
    const { error } = await sb.from("institutes").update(p).eq("id", id);
    setBusy(null);
    if (error) return alert(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
  }
  async function reject(id: string) {
    const reason = prompt("Reason for rejection (shown to the institute):", "Please add photos and complete fee details.");
    if (reason === null) return;
    patch(id, { status: "rejected", rejection_reason: reason });
  }
  async function del(ids: string[], label: string) {
    if (!confirm(`Permanently delete ${label}? Their enquiries and reviews will be deleted too.`)) return;
    const { error } = await sb.from("institutes").delete().in("id", ids);
    if (error) return alert(error.message);
    setRows((rs) => rs.filter((r) => !ids.includes(r.id)));
    router.refresh();
  }

  const samples = rows.filter((r) => r.is_sample);
  const counts: Record<string, number> = { all: rows.length, pending: 0, approved: 0, rejected: 0, sample: samples.length };
  rows.forEach((r) => (counts[r.status] = (counts[r.status] || 0) + 1));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["all", "pending", "approved", "rejected", "sample"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={(status === s ? "chip-active" : "chip") + " capitalize"}>{s} ({counts[s] || 0})</button>
        ))}
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, area, owner" className="input w-60 py-2 pl-8" />
        </div>
        <Link href="/admin/institutes/new" className="btn-primary py-2"><PlusCircle size={15} /> Add institute</Link>
      </div>
      {samples.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {samples.length} sample listings are live for demo purposes. Remove them once real institutes are onboarded.
          <button onClick={() => del(samples.map((s) => s.id), `all ${samples.length} sample listings`)} className="btn-danger py-1.5 text-xs">Delete all samples</button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
            <tr><th className="p-3">Institute</th><th>Owner</th><th>Status</th><th>Fees</th><th>Content</th><th>Views</th><th>Flags</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className={"border-b border-slate-50 align-middle " + (busy === r.id ? "opacity-50" : "")}>
                <td className="p-3">
                  <p className="font-semibold">{r.name} {r.is_sample && <span className="badge bg-slate-100 text-slate-500">sample</span>}</p>
                  <p className="text-xs text-slate-500">{r.area}, {r.city} · {timeAgo(r.created_at)}</p>
                </td>
                <td className="text-xs">{r.profiles?.email || <span className="text-slate-400">Admin-managed</span>}</td>
                <td><StatusBadge s={r.status} /></td>
                <td className="text-xs">{feeRange(r.fee_min, r.fee_max)}</td>
                <td className="text-xs text-slate-500">{r.photos?.length || 0} ph · {r.demo_count} demo · {r.faculty_count} fac</td>
                <td className="text-xs">{r.views}</td>
                <td>
                  <div className="flex gap-1">
                    <button title="Toggle verified" onClick={() => patch(r.id, { is_verified: !r.is_verified })} className={"rounded-lg p-1.5 " + (r.is_verified ? "bg-teal-50 text-teal" : "text-slate-300 hover:bg-slate-100")}><BadgeCheck size={17} /></button>
                    <button title="Toggle featured" onClick={() => patch(r.id, { is_featured: !r.is_featured })} className={"rounded-lg p-1.5 " + (r.is_featured ? "bg-amber-50 text-amber-500" : "text-slate-300 hover:bg-slate-100")}><Sparkles size={17} /></button>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    {r.status !== "approved" && <button onClick={() => patch(r.id, { status: "approved", rejection_reason: null })} className="btn bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700"><Check size={14} /> Approve</button>}
                    {r.status !== "rejected" && <button onClick={() => reject(r.id)} className="btn-outline px-2.5 py-1.5 text-xs"><X size={14} /> Reject</button>}
                    <Link href={`/admin/institutes/${r.id}`} className="btn-outline px-2.5 py-1.5" title="Edit"><Pencil size={14} /></Link>
                    <Link href={`/institutes/${r.slug}`} target="_blank" className="btn-outline px-2.5 py-1.5" title="View"><ExternalLink size={14} /></Link>
                    <button onClick={() => del([r.id], r.name)} className="btn-outline px-2.5 py-1.5 text-red-600" title="Delete"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No institutes here.</p>}
      </div>
    </div>
  );
}
