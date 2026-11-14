import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const { user, profile } = await getSession();
  if (!user) redirect("/login");
  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "institute") redirect("/institute");
  if (profile?.role === "mentor") redirect("/mentor");
  redirect("/student");
}
