import Link from "next/link";
import Logo from "./Logo";
import { getSession } from "@/lib/supabase/server";
import UserMenu from "./UserMenu";
import MobileNav from "./MobileNav";
import { LangToggle } from "./LangProvider";
import { getT } from "@/lib/lang-server";

export default async function Navbar() {
  const { user, profile } = await getSession();
  const { t } = await getT();
  const studentNav = !profile || profile.role === "student";
  const dash =
    profile?.role === "admin" ? "/admin" : profile?.role === "institute" ? "/institute" : profile?.role === "mentor" ? "/mentor" : "/student";
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Logo className="h-7 sm:h-8" />
          <nav className="hidden items-center gap-1 md:flex">
            {studentNav && (
              <>
                <Link href="/institutes" className="btn-ghost">{t("nav.explore")}</Link>
                <Link href="/compare" className="btn-ghost">{t("nav.compare")}</Link>
                <Link href="/courses" className="btn-ghost">Courses</Link>
                {user && <Link href="/learn" className="btn-ghost font-semibold text-teal">My classes</Link>}
                <Link href="/for-institutes" className="btn-ghost">{t("nav.forInstitutes")}</Link>
              </>
            )}
            {profile?.role === "institute" && <Link href="/institute" className="btn-ghost">Dashboard</Link>}
            {profile?.role === "mentor" && <Link href="/mentor" className="btn-ghost">Mentor dashboard</Link>}
            {profile?.role === "admin" && <Link href="/admin" className="btn-ghost">Admin portal</Link>}
            <Link href="/contact" className="btn-ghost">{t("nav.help")}</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          {user ? (
            <UserMenu name={profile?.full_name || user.email || "Account"} role={profile?.role || "student"} dash={dash} />
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">{t("nav.login")}</Link>
              <Link href="/signup" className="btn-primary hidden sm:inline-flex">{t("nav.signup")}</Link>
            </>
          )}
          <MobileNav signedIn={!!user} dash={dash} studentNav={studentNav} />
        </div>
      </div>
    </header>
  );
}
