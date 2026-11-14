"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import PhoneOtpForm from "./PhoneOtpForm";

/** Email/password vs mobile OTP. OTP tab only shows once an SMS provider is configured (NEXT_PUBLIC_PHONE_OTP=1). */
export default function AuthTabs({ mode, children }: { mode: "login" | "signup"; children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_PHONE_OTP === "1";
  const sp = useSearchParams();
  const [tab, setTab] = useState<"otp" | "email">(enabled ? "otp" : "email");
  if (!enabled) return <>{children}</>;
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 border-b border-slate-200 text-sm font-semibold">
        {([["otp", "Mobile OTP"], ["email", "Email & password"]] as const).map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={"pb-2.5 " + (tab === k ? "border-b-2 border-teal text-teal" : "text-slate-500")}>{l}</button>
        ))}
      </div>
      {tab === "otp" ? <PhoneOtpForm mode={mode} next={sp.get("next") || "/dashboard"} /> : children}
    </div>
  );
}
