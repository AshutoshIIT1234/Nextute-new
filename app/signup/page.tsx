import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import AuthTabs from "@/components/AuthTabs";
import SignupForm from "./SignupForm";
export const metadata = { title: "Sign up" };
export default function Page() {
  return (
    <AuthShell title="Create your free account" subtitle="Takes less than a minute.">
      <Suspense><AuthTabs mode="signup"><SignupForm /></AuthTabs></Suspense>
    </AuthShell>
  );
}
