"use client";
import { useMemo, useState } from "react";
import { Download, MessageCircle, Phone, Mail, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { QUERY_STATUSES } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

export type Lead = {
  id: string; institute_id: string; student_name: string; student_phone: string; student_email: string | null;
  class_level: string | null; exam_interest: string | null; preferred_batch: string | null; message: string | null;
  status: string; institute_note: string | null; created_at: string; institutes?: { name: string } | null;
};

export default function LeadsTable({ initial, showInstitute = false, allowDelete = false }: { initial: Lead[]; showInstitute?: boolean; allowDelete?: boolean }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const sb = createClient();

  const shown = useMemo(() => rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (!q || [r.student_name, r.student_phone, r.student_email, r.exam_interest, r.institutes?.name].join(" ").toLowerCase().includes(q.toLowerCase()))
  ), [rows, filter, q]);

  async function update(id: string, patch: Partial<Lead>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    await sb.from("queries").update(patch).eq("id", id);
  }
  async function del(id: string) {
    if (!confirm("Delete this enquiry permanently?")) return;
    await sb.from("queries").delete().eq("id", id);
    setRows((rs) => rs.filter((r) => r.id !== id));
  }
  function exportCsv() {
    const head = ["Date", ...(showInstitute ? ["Institute"] : []), "Student", "Phone", "Email", "Class", "Interested in", "Batch", "Message", "Status", "Note"];
    const lines = shown.map((r) => [new Date(r.created_at).toLocaleString("en-IN"), ...(showInstitute ? [r.institutes?.name || ""] : []), r.student_name, r.student_phone, r.student_email || "", r.class_level || "", r.exam_interest || "", r.preferred_batch || "", r.message || "", r.status, r.institute_note || ""]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nextute-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  const counts = Object.fromEntries(["all", ...QUERY_STATUSES].map((s) => [s, s === "all" ? rows.length : rows.filter((r) => r.status === s).length]));

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-4">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {["all", ...QUERY_STATUSES].map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={(filter === s ? "chip-active" : "chip") + " capitalize"}>{s} ({counts[s]})</button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="input w-44 py-2 pl-8" />
        </div>
        <button onClick={exportCsv} className="btn-outline py-2"><Download size={15} /> CSV</button>
      </div>
      {shown.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">No enquiries {filter !== "all" ? `with status “${filter}”` : "yet"}.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {shown.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button onClick={() => setOpen(open === r.id ? null : r.id)} className="min-w-0 text-left">
                  <p className="font-semibold">{r.student_name} {r.status === "new" && <span className="ml-1 inline-block h-2 w-2 rounded-full bg-blue-500" />}</p>
                  <p className="text-xs text-slate-500">
                    {showInstitute && r.institutes?.name ? <b className="text-slate-700">{r.institutes.name} · </b> : null}
                    {[r.class_level, r.exam_interest, r.preferred_batch].filter(Boolean).join(" · ")} · {timeAgo(r.created_at)}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <a href={`tel:${r.student_phone}`} className="btn-outline px-2.5 py-1.5" title="Call"><Phone size={15} /></a>
                  <a href={`https://wa.me/91${r.student_phone.slice(-10)}?text=${encodeURIComponent(`Hi ${r.student_name}, thanks for your enquiry on Nextute.`)}`} target="_blank" rel="noreferrer" className="btn-outline px-2.5 py-1.5 text-green-700" title="WhatsApp"><MessageCircle size={15} /></a>
                  <select value={r.status} onChange={(e) => update(r.id, { status: e.target.value })} className="input w-auto py-1.5 text-xs capitalize">
                    {QUERY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {open === r.id && (
                <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <p className="flex items-center gap-2"><Phone size={14} /> {r.student_phone}</p>
                  {r.student_email && <p className="flex items-center gap-2"><Mail size={14} /> <a className="text-teal" href={`mailto:${r.student_email}`}>{r.student_email}</a></p>}
                  {r.message && <p className="sm:col-span-2"><b>Message:</b> {r.message}</p>}
                  <div className="sm:col-span-2">
                    <label className="label">Private note</label>
                    <textarea rows={2} className="input" defaultValue={r.institute_note || ""} placeholder="e.g. Called on 12 Nov, visiting Saturday" onBlur={(e) => e.target.value !== (r.institute_note || "") && update(r.id, { institute_note: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2"><StatusBadge s={r.status} />{allowDelete && <button onClick={() => del(r.id)} className="ml-auto text-xs font-semibold text-red-600">Delete enquiry</button>}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
