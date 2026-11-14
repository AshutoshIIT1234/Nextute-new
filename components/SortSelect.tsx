"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SORTS } from "@/lib/constants";

export default function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  return (
    <select
      className="input w-auto py-2"
      value={sp.get("sort") || "featured"}
      onChange={(e) => {
        const p = new URLSearchParams(sp.toString());
        p.set("sort", e.target.value);
        p.delete("page");
        router.replace(`${pathname}?${p}`, { scroll: false });
      }}
    >
      {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  );
}
