"use client";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

type U = { id: string; full_name: string | null; email: string | null; phone: string | null; role: string; city: string | null; class_level: string | null; created_at: string; queries?: { count: number }[] };

export default function UsersTable({ initial, initialRole, meId }: { initial: U[]; initialRole: string; meId: string }) {
  const [rows, setRows] = useState(initial);
  const [role, setRole] = useState(initialRole || "all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => rows.filter((r) => (role === "all" || r.role === role) && (!q || `${r.full_name} ${r.email} ${r.phone} ${r.city}`.toLowerCase().includes(q.toLowerCase()))), [rows, role, q]);

  async function changeRole(id: string, newRole: string) {
    if (newRole === "admin" && !confirm("Give this user full admin access?")) return;
    const { error } = await createClient().from("profiles").update({ role: newRole }).eq("id", id);
    if (error) return alert(error.message);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, role: newRole } : r)));
  }
  function exportCsv() {
    const head = ["Name", "Email", "Phone", "Role", "City", "Class", "Joined"];
    const lines = shown.map((r) => [r.full_name, r.email, r.phone, r.role, r.city, r.class_level, new Date(r.created_at).toLocaleDateString("en-IN")].map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" }));
    a.download = "nextute-users.csv";
    a.click();
  }
  const count = (r: string) => (r === "all" ? rows.length : rows.filter((x) => x.role === r).length);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {["all", "student", "mentor", "institute", "admin"].map((r) => <button key={r} onClick={() => setRole(r)} className={(role === r ? "chip-active" : "chip") + " capitalize"}>{r} ({count(r)})</button>)}
        <div className="relative ml-auto"><Search size={15} className="absolute left-3 top-2.5 text-slate-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" className="input w-56 py-2 pl-8" /></div>
        <button onClick={exportCsv} className="btn-outline py-2"><Download size={15} /> CSV</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th>Phone</th><th>City / Class</th><th>Enquiries</th><th>Joined</th><th className="p-3">Role</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-slate-50">
                <td className="p-3"><p className="font-semibold">{r.full_name || "—"}</p><p className="text-xs text-slate-500">{r.email}</p></td>
                <td className="text-xs">{r.phone ? <a href={`tel:${r.phone}`} className="hover:text-teal">{r.phone}</a> : "—"}</td>
                <td className="text-xs">{[r.city, r.class_level].filter(Boolean).join(" · ") || "—"}</td>
                <td className="text-xs">{r.queries?.[0]?.count ?? 0}</td>
                <td className="text-xs">{timeAgo(r.created_at)}</td>
                <td className="p-3">
                  <select disabled={r.id === meId} value={r.role} onChange={(e) => changeRole(r.id, e.target.value)} className="input w-auto py-1.5 text-xs capitalize">
                    <option value="student">student</option><option value="mentor">mentor</option><option value="institute">institute</option><option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No users found.</p>}
      </div>
    </div>
  );
}
