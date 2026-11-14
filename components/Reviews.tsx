"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

type Review = { id: string; student_id: string; student_name: string | null; rating: number; comment: string | null; created_at: string };

export default function Reviews({ instituteId, reviews, me, canReview }: { instituteId: string; reviews: Review[]; me: { id: string; name: string } | null; canReview: boolean }) {
  const router = useRouter();
  const mine = reviews.find((r) => r.student_id === me?.id);
  const [rating, setRating] = useState(mine?.rating || 0);
  const [comment, setComment] = useState(mine?.comment || "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !rating) return setMsg("Please choose a star rating.");
    setBusy(true);
    const sb = createClient();
    const row = { institute_id: instituteId, student_id: me.id, student_name: me.name, rating, comment };
    const { error } = mine
      ? await sb.from("reviews").update({ rating, comment }).eq("id", mine.id)
      : await sb.from("reviews").insert(row);
    setBusy(false);
    setMsg(error ? error.message : "Thanks! Your review is live.");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {canReview && me && (
        <form onSubmit={submit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold">{mine ? "Update your review" : "Studied here? Rate this institute"}</p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                <Star size={26} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
              </button>
            ))}
          </div>
          <textarea rows={2} className="input mt-3" placeholder="Share your experience with teaching, tests, environment…" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="mt-3 flex items-center gap-3">
            <button disabled={busy} className="btn-primary">{busy ? "Saving…" : mine ? "Update review" : "Post review"}</button>
            {msg && <span className="text-sm text-slate-600">{msg}</span>}
          </div>
        </form>
      )}
      {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
      {reviews.map((r) => (
        <div key={r.id} className="border-b border-slate-100 pb-4 last:border-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{r.student_name || "Student"}</p>
            <span className="text-xs text-slate-400">{timeAgo(r.created_at)}</span>
          </div>
          <div className="mt-1 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}</div>
          {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
