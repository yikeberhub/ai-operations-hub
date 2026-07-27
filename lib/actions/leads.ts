"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// Public support/contact submissions and logged-in client submissions both land
// here as leads. Uses the service client to bypass RLS since anonymous visitors
// have no session (and therefore no org_id) to satisfy the leads RLS policies.
export async function submitLead(formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const company = (formData.get("company") as string) || null;
  const phone = (formData.get("phone") as string) || null;
  const message = formData.get("message") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/contact";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceClient();
  const { data: org } = await service
    .from("orgs")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (!org) redirect(`${redirectTo}?error=${encodeURIComponent("No org configured")}`);

  const { error } = await service.from("leads").insert({
    org_id: org.id,
    client_id: user?.id ?? null,
    full_name: fullName,
    email,
    company,
    phone,
    message,
    source: user ? "client-dashboard" : "website",
  });

  if (error) redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  redirect(`${redirectTo}?success=1`);
}
