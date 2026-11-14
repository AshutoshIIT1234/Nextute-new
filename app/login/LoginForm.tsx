"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(sp.get("error") || "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setErr(error.message === "Email not confirmed" ? "Please verify your email first — check your inbox for the confirmation link." : error.message);
    router.replace(next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label">Email</label><input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div>
        <div className="flex items-center justify-between"><label className="label">Password</label><Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-teal">Forgot password?</Link></div>
        <div className="relative">
          <input type={show ? "text" : "password"} required autoComplete="current-password" className="input pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-slate-400" aria-label="Toggle password">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
      </div>
      {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn-primary w-full py-3">{busy ? "Logging in…" : "Log in"}</button>
      <p className="text-center text-sm text-slate-600">New to Nextute? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-teal">Create a free account</Link></p>
    </form>
  );
}
