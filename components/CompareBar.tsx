"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import { useCompare } from "./CompareContext";

export default function CompareBar() {
  const { items, remove, clear, max } = useCompare();
  const pathname = usePathname();
  const [warn, setWarn] = useState(false);
  useEffect(() => {
    const h = () => { setWarn(true); setTimeout(() => setWarn(false), 2500); };
    window.addEventListener("compare-max", h);
    return () => window.removeEventListener("compare-max", h);
  }, []);
  if (!items.length || pathname.startsWith("/compare") || pathname.startsWith("/admin")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-navy">
          <GitCompareArrows size={18} className="text-teal" /> Compare ({items.length}/{max})
        </span>
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
          {items.map((i) => (
            <span key={i.id} className="chip shrink-0">
              {i.name}
              <button aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
            </span>
          ))}
        </div>
        {warn && <span className="text-xs font-medium text-amber-600">You can compare up to {max} institutes.</span>}
        <button onClick={clear} className="btn-ghost text-xs">Clear</button>
        <Link
          href={`/compare?ids=${items.map((i) => i.id).join(",")}`}
          className={items.length < 2 ? "btn-primary pointer-events-none opacity-50" : "btn-primary"}
        >
          {items.length < 2 ? "Add 1 more to compare" : "Compare now"}
        </Link>
      </div>
    </div>
  );
}
