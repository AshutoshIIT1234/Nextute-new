"use client";
import { useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
export default function ReviewsAdmin({ initial }: { initial: any[] }) {
  const [rows, setRows] = useState(initial);
  async function del(id: string) {
    if (!confirm("Delete this review?")) return;
    const { error } = await createClient().from("reviews").delete().eq("id", id);
    if (error) return alert(error.message);
    setRows((r) => r.filter((x) => x.id !== id));
  }
  if (!rows.length) return <p className="card p-8 text-center text-sm text-slate-500">No reviews yet.</p>;
  return (
    <div className="card divide-y divide-slate-100">
      {rows.map((r) => (
        <div key={r.id} className="flex items-start justify-between gap-4 p-4">
          <div>
            <p className="text-sm"><b>{r.student_name || "Student"}</b> → {r.institutes?.name} <span className="text-xs text-slate-400">· {timeAgo(r.created_at)}</span></p>
            <div className="mt-1 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}</div>
            {r.comment && <p className="mt-1 text-sm text-slate-700">{r.comment}</p>}
          </div>
          <button onClick={() => del(r.id)} className="btn-outline px-2.5 py-1.5 text-red-600"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
}
