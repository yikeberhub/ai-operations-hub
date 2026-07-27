import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/profile";

export default async function RootPage() {
  const { user, profile } = await getCurrentProfile();

  if (!user) redirect("/login");
  redirect(profile?.role === "client" ? "/client" : "/dashboard");
}
