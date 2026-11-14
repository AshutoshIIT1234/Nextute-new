"use client";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LocateFixed, Loader2 } from "lucide-react";
import { useT } from "./LangProvider";

/** Asks for the browser location and re-sorts the listing by distance. */
export default function NearMeButton({ className = "btn-outline", base }: { className?: string; base?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  function go() {
    if (!navigator.geolocation) return setErr(t("near.denied"));
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = new URLSearchParams(base ? "" : sp.toString());
        p.set("lat", pos.coords.latitude.toFixed(4));
        p.set("lng", pos.coords.longitude.toFixed(4));
        p.set("sort", "near");
        p.delete("page");
        setBusy(false);
        router.push(`${base || pathname}?${p}`);
      },
      () => { setBusy(false); setErr(t("near.denied")); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  }
  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={go} disabled={busy} className={className}>
        {busy ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />} {busy ? t("near.locating") : t("near.btn")}
      </button>
      {err && <span className="mt-1 text-xs text-amber-700">{err}</span>}
    </span>
  );
}
