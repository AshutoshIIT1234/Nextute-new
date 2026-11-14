"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

export default function UserMenu({ name, role, dash }: { name: string; role: string; dash: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  async function logout() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-medium hover:border-teal">
        <span className="grid h-7 w-7 place-items-center rounded-lg brand-gradient text-xs font-bold text-white">{initials(name)}</span>
        <span className="hidden max-w-[120px] truncate sm:block">{name}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs capitalize text-slate-500">{role} account</p>
          </div>
          <Link onClick={() => setOpen(false)} href={dash} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
            {role === "admin" ? <Shield size={16} /> : <LayoutDashboard size={16} />} {role === "admin" ? "Admin portal" : "My dashboard"}
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50">
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
