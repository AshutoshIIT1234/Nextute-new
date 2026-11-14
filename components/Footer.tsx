import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { SUPPORT_EMAIL, SUPPORT_PHONE, PATNA_AREAS } from "@/lib/constants";
import { getT } from "@/lib/lang-server";
import { landingSlug, POPULAR_EXAMS } from "@/lib/site";

export default async function Footer() {
  const { t } = await getT();
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-1">
          <img src="/logo.svg" alt="Nextute" className="h-8 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {t("foot.about")}
          </p>
          <p className="mt-3 text-xs text-slate-500">© {new Date().getFullYear()} Nextute Edtech Private Limited</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("foot.students")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/institutes" className="hover:text-teal">{t("foot.explore")}</Link></li>
            <li><Link href="/compare" className="hover:text-teal">{t("foot.compare")}</Link></li>
            <li><Link href="/signup" className="hover:text-teal">{t("foot.create")}</Link></li>
            <li><Link href="/student" className="hover:text-teal">{t("foot.mine")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("foot.areas")}</h4>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
            {PATNA_AREAS.slice(0, 8).map((a) => (
              <li key={a}><Link href={`/coaching/${landingSlug({ area: a })}`} className="hover:text-teal">{a}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("home.popular")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {POPULAR_EXAMS.map((e) => (
              <li key={e}><Link href={`/coaching/${landingSlug({ exam: e })}`} className="hover:text-teal">{e} coaching in Patna</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">{t("foot.inst")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li><Link href="/for-institutes" className="hover:text-teal">{t("foot.list")}</Link></li>
            <li><Link href="/contact" className="hover:text-teal">{t("foot.help")}</Link></li>
            <li className="flex items-center gap-2"><Phone size={14} /> <a href={`tel:+91${SUPPORT_PHONE}`}>+91 {SUPPORT_PHONE}</a></li>
            <li className="flex items-center gap-2"><Mail size={14} /> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Patna, Bihar</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
