"use client";
import { useMemo, useState } from "react";
import { Loader2, UserPlus, UserMinus, RotateCcw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

type Row = {
  id: string; user_id: string; course_slug: string; name: string | null; phone: string | null; email: string | null;
  amount: number; status: string; razorpay_payment_id: string | null; created_at: string; paid_at: string | null;
  added_by_admin?: boolean; note?: string | null;
};

const STATUS: Record<string, [string, string]> = {
  paid: ["Enrolled", "bg-green-100 text-green-800"],
  created: ["Not paid", "bg-amber-100 text-amber-800"],
  removed: ["Removed", "bg-red-100 text-red-700"],
  refunded: ["Refunded", "bg-slate-100 text-slate-600"],
  failed: ["Failed", "bg-slate-100 text-slate-600"],
};

export default function EnrollmentManager({ courses, initial }: { courses: { slug: string; title: string }[]; initial: Row[] }) {
  const sb = createClient();
  const [rows, setRows] = useState(initial);
  const [f, setF] = useState({ email: "", course: courses[0]?.slug || "", amount: "0", note: "" });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [filter, setFilter] = useState("enrolled");
  const [q, setQ] = useState("");

  const shown = useMemo(() => rows.filter((r) =>
    (filter === "all" || (filter === "enrolled" ? r.status === "paid" : filter === "removed" ? r.status === "removed" : r.status === "created")) &&
    (!q || `${r.name} ${r.phone} ${r.email}`.toLowerCase().includes(q.toLowerCase()))), [rows, filter, q]);
  const count = (s: string) => rows.filter((r) => (s === "enrolled" ? r.status === "paid" : s === "removed" ? r.status === "removed" : s === "unpaid" ? r.status === "created" : true)).length;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const email = f.email.trim().toLowerCase();
    if (!email) return setMsg({ ok: false, text: "Enter the student's email." });
    setBusy("add");
    const { data: p } = await sb.from("profiles").select("id, full_name, phone, email, role").eq("email", email).maybeSingle();
    if (!p) { setBusy(""); return setMsg({ ok: false, text: `No account found for ${email}. Ask the student to sign up first, then add them here.` }); }
    const existing = rows.find((r) => r.user_id === p.id && r.course_slug === f.course && r.status === "paid");
    if (existing) { setBusy(""); return setMsg({ ok: false, text: `${p.full_name || email} is already enrolled.` }); }
    const removed = rows.find((r) => r.user_id === p.id && r.course_slug === f.course && r.status === "removed");
    let res;
    if (removed) {
      res = await sb.from("course_enrollments").update({ status: "paid", paid_at: new Date().toISOString(), note: f.note.trim() || removed.note || null }).eq("id", removed.id).select("*").single();
    } else {
      res = await sb.from("course_enrollments").insert({
        user_id: p.id, course_slug: f.course, status: "paid", paid_at: new Date().toISOString(), amount: Number(f.amount) || 0,
        name: p.full_name, phone: p.phone, email: p.email, added_by_admin: true, note: f.note.trim() || null,
      }).select("*").single();
    }
    setBusy("");
    if (res.error) return setMsg({ ok: false, text: res.error.message });
    const row = res.data as Row;
    setRows([row, ...rows.filter((r) => r.id !== row.id)]);
    setF({ ...f, email: "", note: "" });
    setMsg({ ok: true, text: `${p.full_name || email} is now enrolled and can open My classes.` });
  }

  async function setStatus(r: Row, status: "removed" | "paid") {
    if (status === "removed" && !confirm(`Remove ${r.name || r.email} from the batch? They will lose access to classes, notes and tests.`)) return;
    setBusy(r.id);
    const { data, error } = await sb.from("course_enrollments").update({ status, ...(status === "paid" && !r.paid_at ? { paid_at: new Date().toISOString() } : {}) }).eq("id", r.id).select("*").single();
    setBusy("");
    if (error) return alert(error.message);
    setRows(rows.map((x) => (x.id === r.id ? (data as Row) : x)));
  }

  return (
    <section className="space-y-4">
      <form onSubmit={add} className="card grid gap-3 p-5 md:grid-cols-[1.4fr_1fr_0.6fr_1fr_auto] md:items-end">
        <div className="md:col-span-5"><h2 className="font-bold">Add a student to a batch</h2><p className="text-sm text-slate-500">For students who paid offline (cash/UPI) or get free access. The student must have a Nextute account.</p></div>
        <div><label className="label">Student&apos;s account email</label><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="student@gmail.com" /></div>
        <div><label className="label">Batch</label><select className="input" value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })}>{courses.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select></div>
        <div><label className="label">Amount (₹)</label><input inputMode="numeric" className="input" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></div>
        <div><label className="label">Note (optional)</label><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="e.g. Paid cash 12 Nov" /></div>
        <button disabled={busy === "add"} className="btn-primary">{busy === "add" ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Enrol</button>
        {msg && <p className={"rounded-lg p-2 text-sm md:col-span-5 " + (msg.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700")}>{msg.text}</p>}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {[["enrolled", "Enrolled"], ["unpaid", "Started, not paid"], ["removed", "Removed"], ["all", "All"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={filter === k ? "chip-active" : "chip"}>{l} ({count(k)})</button>
        ))}
        <div className="relative ml-auto"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email" className="input w-60 py-2 pl-8" /></div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-500">
            <tr><th className="p-3">Student</th><th>Contact</th><th>Batch</th><th>Amount</th><th>Status</th><th>Payment</th><th>When</th><th className="p-3 text-right">Action</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const [label, cls] = STATUS[r.status] || [r.status, "bg-slate-100"];
              return (
                <tr key={r.id} className="border-b border-slate-50 align-top">
                  <td className="p-3 font-semibold">{r.name || "—"}{r.note && <span className="block text-xs font-normal text-slate-500">{r.note}</span>}</td>
                  <td className="py-3 text-xs">{r.phone && <a href={`https://wa.me/91${r.phone}`} target="_blank" className="text-teal">{r.phone}</a>}<br />{r.email}</td>
                  <td className="py-3 text-xs">{courses.find((c) => c.slug === r.course_slug)?.title || r.course_slug}</td>
                  <td className="py-3">₹{r.amount}</td>
                  <td className="py-3"><span className={"badge " + cls}>{label}</span></td>
                  <td className="py-3 font-mono text-xs">{r.razorpay_payment_id || (r.added_by_admin ? "Added by admin" : "—")}</td>
                  <td className="py-3 text-xs">{timeAgo(r.paid_at || r.created_at)}</td>
                  <td className="p-3 text-right">
                    {r.status === "paid" && <button disabled={busy === r.id} onClick={() => setStatus(r, "removed")} className="btn-outline py-1.5 text-xs text-red-600"><UserMinus size={14} /> Remove</button>}
                    {r.status === "removed" && <button disabled={busy === r.id} onClick={() => setStatus(r, "paid")} className="btn-outline py-1.5 text-xs"><RotateCcw size={14} /> Restore</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No students here.</p>}
      </div>
    </section>
  );
}
