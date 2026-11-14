"use client";
import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { translate, type Lang, type TKey } from "@/lib/i18n";

const Ctx = createContext<Lang>("en");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}
export function useT() {
  const lang = useContext(Ctx);
  return { lang, t: (k: TKey) => translate(lang, k) };
}
export function LangToggle() {
  const lang = useContext(Ctx);
  const router = useRouter();
  function set(next: Lang) {
    document.cookie = `lang=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return (
    <div className="flex overflow-hidden rounded-lg border border-slate-200 text-xs font-semibold" role="group" aria-label="Language">
      <button onClick={() => set("en")} className={"px-2 py-1.5 " + (lang === "en" ? "bg-navy text-white" : "bg-white text-slate-600")}>EN</button>
      <button onClick={() => set("hi")} className={"px-2 py-1.5 " + (lang === "hi" ? "bg-navy text-white" : "bg-white text-slate-600")}>हिं</button>
    </div>
  );
}
