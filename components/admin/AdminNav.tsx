"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Users, MessageSquareText, LifeBuoy, Star, PlusCircle, Rocket, GraduationCap } from "lucide-react";

const LINKS = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/institutes", "Institutes", Building2],
  ["/admin/institutes/new", "Add institute", PlusCircle],
  ["/admin/users", "Users", Users],
  ["/admin/queries", "Enquiries", MessageSquareText],
  ["/admin/reviews", "Reviews", Star],
  ["/admin/tickets", "Support tickets", LifeBuoy],
  ["/admin/courses", "Courses & payments", GraduationCap],
  ["/admin/waitlist", "App waitlist", Rocket],
] as const;

export default function AdminNav() {
  const path = usePathname();
  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <p className="mb-2 hidden px-3 text-xs font-bold uppercase tracking-wider text-slate-400 lg:block">Admin portal</p>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
        {LINKS.map(([href, label, Icon]) => {
          const active = href === "/admin" ? path === "/admin" : href === "/admin/institutes" ? path.startsWith("/admin/institutes") && path !== "/admin/institutes/new" : path.startsWith(href);
          return (
            <Link key={href} href={href} className={"flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium " + (active ? "bg-navy text-white" : "text-slate-700 hover:bg-white")}>
              <Icon size={17} /> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
