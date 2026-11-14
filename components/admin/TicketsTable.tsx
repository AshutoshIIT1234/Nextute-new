"use client";
import { useState } from "react";
import { Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import { timeAgo } from "@/lib/utils";

type T = { id: string; name: string; email: string | null; phone: string | null; category: string; subject: string | null; message: string; status: string; admin_note: string | null; created_at: string };

export default function TicketsTable({ initial }: { initial: T[] }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState("open");
  const sb = createClient();
  async function update(id: string, p: Partial<T>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    await sb.from("support_tickets").update(p).eq("id", id);
  }
  const shown = rows.filter((r) => filter === "all" || (filter === "open" ? r.status !== "resolved" : r.status === filter));
  return (
    <div className="space-y-4">
      <div className="flex gap-2">{["open", "resolved", "all"].map((s) => <button key={s} onClick={() => setFilter(s)} className={(filter === s ? "chip-active" : "chip") + " capitalize"}>{s}</button>)}</div>
      {shown.length === 0 && <p className="card p-8 text-center text-sm text-slate-500">No tickets.</p>}
      {shown.map((t) => (
        <div key={t.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{t.subject || t.category}</p>
              <p className="text-xs text-slate-500">{t.name} · {t.category} · {timeAgo(t.created_at)}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge s={t.status} />
              <select value={t.status} onChange={(e) => update(t.id, { status: e.target.value })} className="input w-auto py-1.5 text-xs">
                <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{t.message}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {t.phone && <a href={`tel:${t.phone}`} className="flex items-center gap-1 text-teal"><Phone size={14} /> {t.phone}</a>}
            {t.email && <a href={`mailto:${t.email}?subject=${encodeURIComponent("Re: " + (t.subject || "Your Nextute request"))}`} className="flex items-center gap-1 text-teal"><Mail size={14} /> {t.email}</a>}
          </div>
          <textarea rows={2} className="input mt-3" placeholder="Internal note" defaultValue={t.admin_note || ""} onBlur={(e) => e.target.value !== (t.admin_note || "") && update(t.id, { admin_note: e.target.value })} />
        </div>
      ))}
    </div>
  );
}
