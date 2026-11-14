"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useCompare } from "./CompareContext";

type Row = { id: string; name: string; area: string };

/** Search box to add institutes to the comparison; keeps URL and compare tray in sync. */
export default function ComparePicker({ ids }: { ids: string[] }) {
  const router = useRouter();
  const { items, toggle, has, max } = useCompare();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  // landing on /compare with no ids → use the tray
  useEffect(() => {
    if (!ids.length && items.length) router.replace(`/compare?ids=${items.map((i) => i.id).join(",")}`);
  }, [ids.length, items, router]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.replace(/[,()%*]/g, " ").trim();
      let req = createClient().from("institutes").select("id,name,area").eq("status", "approved").limit(8);
      if (term) req = req.or(`name.ilike.%${term}%,area.ilike.%${term}%`);
      const { data } = await req;
      setRows((data as Row[]) || []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  function add(r: Row) {
    if (ids.includes(r.id) || ids.length >= max) return;
    if (!has(r.id)) toggle(r);
    router.push(`/compare?ids=${[...ids, r.id].join(",")}`);
  }

  if (ids.length >= max) return null;
  return (
    <div className="card p-4">
      <p className="text-sm font-semibold">Add an institute to compare ({ids.length}/{max})</p>
      <div className="relative mt-2">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or area" className="input pl-9" />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {rows.filter((r) => !ids.includes(r.id)).map((r) => (
          <button key={r.id} onClick={() => add(r)} className="chip hover:border-teal hover:text-teal"><Plus size={12} /> {r.name} · {r.area}</button>
        ))}
      </div>
    </div>
  );
}
