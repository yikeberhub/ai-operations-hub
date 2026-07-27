import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "admin" | "agent" | "client";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, full_name, role")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as { id: string; org_id: string; full_name: string | null; role: ProfileRole } | null };
}
