"use client";
import Link from "next/link";
import { useState } from "react";
import AuthShellClient from "@/components/AuthShellClient";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false);
    setMsg(error ? error.message : "If an account exists for this email, a reset link is on its way.");
  }
  return (
    <AuthShellClient title="Reset your password">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {msg && <p className="rounded-lg bg-slate-50 p-3 text-sm">{msg}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">Send reset link</button>
        <p className="text-center text-sm"><Link href="/login" className="font-semibold text-teal">Back to log in</Link></p>
      </form>
    </AuthShellClient>
  );
}
