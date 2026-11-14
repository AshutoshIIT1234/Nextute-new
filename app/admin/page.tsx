import Link from "next/link";
import { Building2, Users, MessageSquareText, LifeBuoy, Clock, GraduationCap, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import StatusBadge from "@/components/StatusBadge";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sb = await createClient();
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const c = (q: any) => q.then((r: any) => r.count || 0);
  const [live, pending, students, instAccounts, queries, queriesWeek, openTickets, pendingList, recentQ, recentUsers] = await Promise.all([
    c(sb.from("institutes").select("id", { count: "exact", head: true }).eq("status", "approved")),
    c(sb.from("institutes").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "institute")),
    c(sb.from("queries").select("id", { count: "exact", head: true })),
    c(sb.from("queries").select("id", { count: "exact", head: true }).gte("created_at", weekAgo)),
    c(sb.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "resolved")),
    sb.from("institutes").select("id,name,area,created_at,status").eq("status", "pending").order("created_at").limit(6),
    sb.from("queries").select("id,student_name,created_at,status,institutes(name)").order("created_at", { ascending: false }).limit(6),
    sb.from("profiles").select("id,full_name,email,role,created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const stats = [
    [Building2, "Live institutes", live, "/admin/institutes?status=approved"],
    [Clock, "Pending approval", pending, "/admin/institutes?status=pending"],
    [GraduationCap, "Students", students, "/admin/users?role=student"],
    [Users, "Institute accounts", instAccounts, "/admin/users?role=institute"],
    [MessageSquareText, "Enquiries (7 days)", `${queriesWeek} / ${queries}`, "/admin/queries"],
    [LifeBuoy, "Open tickets", openTickets, "/admin/tickets"],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-navy">Overview</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map(([Icon, l, n, href]) => (
          <Link key={l} href={href} className="card p-4 hover:border-teal">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><Icon size={14} className="text-teal" /> {l}</p>
            <p className="mt-1 text-2xl font-extrabold text-navy">{n}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">Awaiting approval</h2><Link href="/admin/institutes?status=pending" className="text-xs font-semibold text-teal">View all</Link></div>
          <div className="mt-3 divide-y divide-slate-100">
            {(pendingList.data || []).length === 0 && <p className="py-4 text-sm text-slate-500">All caught up 🎉</p>}
            {(pendingList.data || []).map((i: any) => (
              <Link key={i.id} href={`/admin/institutes/${i.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-teal">
                <span><b>{i.name}</b><span className="block text-xs text-slate-500">{i.area} · {timeAgo(i.created_at)}</span></span><ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">Latest enquiries</h2><Link href="/admin/queries" className="text-xs font-semibold text-teal">View all</Link></div>
          <div className="mt-3 divide-y divide-slate-100">
            {(recentQ.data || []).length === 0 && <p className="py-4 text-sm text-slate-500">No enquiries yet.</p>}
            {(recentQ.data || []).map((q: any) => (
              <div key={q.id} className="flex items-center justify-between py-2.5 text-sm">
                <span><b>{q.student_name}</b><span className="block text-xs text-slate-500">→ {q.institutes?.name} · {timeAgo(q.created_at)}</span></span><StatusBadge s={q.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">New sign-ups</h2><Link href="/admin/users" className="text-xs font-semibold text-teal">View all</Link></div>
          <div className="mt-3 divide-y divide-slate-100">
            {(recentUsers.data || []).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="min-w-0"><b className="block truncate">{u.full_name || u.email}</b><span className="block truncate text-xs text-slate-500">{u.email} · {timeAgo(u.created_at)}</span></span>
                <span className="badge bg-slate-100 capitalize text-slate-600">{u.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
