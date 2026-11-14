"use client";
import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Opens a note from the private bucket using a short-lived signed link. */
export default function NoteButton({ path, label = "Open" }: { path: string; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function open() {
    setBusy(true);
    setErr("");
    const { data, error } = await createClient().storage.from("course-files").createSignedUrl(path, 60 * 10);
    setBusy(false);
    if (error || !data) return setErr("Couldn't open file");
    window.open(data.signedUrl, "_blank", "noopener");
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={open} disabled={busy} className="btn-outline py-1.5 text-xs">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} {label}
      </button>
      {err && <span className="text-xs text-red-600">{err}</span>}
    </span>
  );
}
