"use client";
import { useState } from "react";
import Link from "next/link";
import { Rocket, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useT } from "./LangProvider";

/** Friendly "coming soon" card for areas/cities with no listed institutes yet; captures a callback request. */
export default function ComingSoon({ place }: { place: string }) {
  const { t } = useT();
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(n)) return setErr("Please enter a valid 10-digit mobile number.");
    const { error } = await createClient().from("support_tickets").insert({
      name: "Area request", phone: n, category: "Area request", subject: `Wants coaching in ${place}`,
      message: `A student wants Nextute to list coaching institutes in ${place}.`,
    });
    if (error) return setErr(error.message);
    setDone(true);
  }
  return (
    <div className="card overflow-hidden">
      <div className="brand-gradient p-8 text-center text-white">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><Rocket /></span>
        <h2 className="mt-4 text-2xl font-extrabold">{t("soon.title")} {place}! 🎉</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-white/85">{t("soon.sub")}</p>
      </div>
      <div className="p-6">
        {done ? (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-green-700"><CheckCircle2 size={18} /> {t("soon.done")}</p>
        ) : (
          <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-2 sm:flex-row">
            <input inputMode="tel" placeholder={t("soon.ph")} value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            <button className="btn-primary shrink-0">{t("soon.cta")}</button>
          </form>
        )}
        {err && <p className="mt-2 text-center text-sm text-red-600">{err}</p>}
        <p className="mt-4 text-center text-sm text-slate-500">
          Meanwhile, <Link href="/institutes" className="font-semibold text-teal">explore institutes in Patna</Link> or{" "}
          <Link href="/for-institutes" className="font-semibold text-teal">list your coaching free</Link>.
        </p>
      </div>
    </div>
  );
}
