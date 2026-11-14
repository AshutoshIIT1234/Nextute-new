"use client";
import Link from "next/link";
import { useSearchParams, usePathname } from "next/navigation";
import { List, Map } from "lucide-react";
import { useT } from "./LangProvider";

export default function ViewToggle() {
  const sp = useSearchParams();
  const pathname = usePathname();
  const { t } = useT();
  const view = sp.get("view") === "map" ? "map" : "list";
  const href = (v: string) => {
    const p = new URLSearchParams(sp.toString());
    v === "map" ? p.set("view", "map") : p.delete("view");
    p.delete("page");
    return `${pathname}?${p}`;
  };
  return (
    <div className="flex overflow-hidden rounded-xl border border-slate-300 text-sm font-semibold">
      <Link href={href("list")} className={"flex items-center gap-1 px-3 py-2 " + (view === "list" ? "bg-navy text-white" : "bg-white text-slate-700")}><List size={15} /> {t("list.list")}</Link>
      <Link href={href("map")} className={"flex items-center gap-1 px-3 py-2 " + (view === "map" ? "bg-navy text-white" : "bg-white text-slate-700")}><Map size={15} /> {t("list.map")}</Link>
    </div>
  );
}
