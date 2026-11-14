"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useT } from "./LangProvider";

export default function MobileNav({ signedIn, dash, studentNav = true }: { signedIn: boolean; dash: string; studentNav?: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useT();
  const links = [
    ...(studentNav ? [["/institutes", t("nav.explore")], ["/compare", t("nav.compare")], ["/courses", "Courses"], ...(signedIn ? [["/learn", "My classes"]] : []), ["/for-institutes", t("nav.forInstitutes")]] : []),
    ["/contact", t("nav.help")],
    ...(signedIn ? [[dash, t("nav.dashboard")]] : [["/login", t("nav.login")], ["/signup", t("nav.signup")]]),
  ];
  return (
    <div className="md:hidden">
      <button aria-label="Menu" onClick={() => setOpen(!open)} className="btn-ghost px-2">
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-slate-200 bg-white px-4 py-3 shadow-lg">
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium hover:bg-slate-50">
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
