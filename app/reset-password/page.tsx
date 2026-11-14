"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShellClient from "@/components/AuthShellClient";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("Password must be at least 8 characters.");
    const { error } = await createClient().auth.updateUser({ password: pw });
    if (error) return setMsg(error.message);
    router.replace("/dashboard");
    router.refresh();
  }
  return (
    <AuthShellClient title="Choose a new password">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">New password</label><input type="password" required className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        {msg && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
        <button className="btn-primary w-full py-3">Update password</button>
      </form>
    </AuthShellClient>
  );
}
