"use client";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useCompare } from "./CompareContext";
export default function CompareRemove({ id, ids }: { id: string; ids: string[] }) {
  const router = useRouter();
  const { remove } = useCompare();
  return (
    <button aria-label="Remove" onClick={() => { remove(id); const n = ids.filter((x) => x !== id); router.push(n.length ? `/compare?ids=${n.join(",")}` : "/compare"); }}
      className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-500 shadow hover:text-red-600"><X size={14} /></button>
  );
}
