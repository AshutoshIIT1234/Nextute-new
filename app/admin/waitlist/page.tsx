import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
export const dynamic = "force-dynamic";
export const metadata = { title: "App waitlist" };
export default async function Waitlist() {
  const sb = await createClient();
  const { data } = await sb.from("partner_interest").select("*").order("created_at", { ascending: false });
  const rows = (data || []) as any[];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-navy">Partner App waitlist</h1>
      <p className="text-sm text-slate-500">Institutes who asked to be updated about the Nextute Partner App launch (tests, lecture planner, class notes).</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-500"><tr><th className="p-3">Institute</th><th>Contact</th><th>Interested in</th><th>Students</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-50 align-top">
                <td className="p-3 font-semibold">{r.institute_name || "—"}</td>
                <td className="py-3 text-xs">{r.contact_name}<br />{r.phone && <a href={`tel:${r.phone}`} className="text-teal">{r.phone}</a>}<br />{r.email}</td>
                <td className="py-3 text-xs">{(r.services || []).join(", ")}</td>
                <td className="py-3 text-xs">{r.students_count || "—"}</td>
                <td className="py-3 text-xs">{timeAgo(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No sign-ups yet.</p>}
      </div>
    </div>
  );
}
