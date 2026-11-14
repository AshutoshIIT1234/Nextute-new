import { Suspense } from "react";
import AuthShell from "@/components/AuthShell";
import AuthTabs from "@/components/AuthTabs";
import LoginForm from "./LoginForm";
export const metadata = { title: "Log in" };
export default function Page() {
  return (
    <AuthShell title="Welcome back" subtitle="Log in to see full institute details and your enquiries.">
      <Suspense><AuthTabs mode="login"><LoginForm /></AuthTabs></Suspense>
    </AuthShell>
  );
}
