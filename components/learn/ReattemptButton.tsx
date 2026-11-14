"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Starts a fresh attempt of a test, then reloads the test page (which shows the timer). */
export default function ReattemptButton({ testId, href, className = "btn-primary" }: { testId: string; href: string; className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    if (!confirm("Start a new attempt? The timer starts immediately. Your best score is used for your rank.")) return;
    setBusy(true);
    setErr("");
    const { error } = await createClient().rpc("start_test", { p_test: testId });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(href);
    router.refresh();
  }
  return (
    <span className="inline-flex flex-col">
      <button onClick={go} disabled={busy} className={className}>{busy ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />} Reattempt test</button>
      {err && <span className="mt-1 text-xs text-red-600">{err}</span>}
    </span>
  );
}
