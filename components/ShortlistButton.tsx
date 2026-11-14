"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ShortlistButton({ instituteId, userId, initial, className = "" }: { instituteId: string; userId: string; initial: boolean; className?: string }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    const sb = createClient();
    if (on) await sb.from("shortlists").delete().eq("student_id", userId).eq("institute_id", instituteId);
    else await sb.from("shortlists").insert({ student_id: userId, institute_id: instituteId });
    setOn(!on);
    setBusy(false);
  }
  return (
    <button disabled={busy} onClick={toggle} className={(on ? "btn border border-rose-300 bg-rose-50 text-rose-600 " : "btn-outline ") + className}>
      <Heart size={16} className={on ? "fill-current" : ""} /> {on ? "Shortlisted" : "Shortlist"}
    </button>
  );
}
