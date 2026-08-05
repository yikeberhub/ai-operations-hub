"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { scoreLead, draftEmailReply } from "@/lib/ai/lead-scoring";
import { notifyHotAlert } from "@/lib/actions/notifications";
import type { Enums } from "@/lib/types/database.types";

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

  const { data: lead, error } = await service
    .from("leads")
    .insert({
      org_id: org.id,
      client_id: user?.id ?? null,
      full_name: fullName,
      email,
      company,
      phone,
      message,
      source: user ? "client-dashboard" : "website",
    })
    .select("id")
    .single();

  if (error) redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);

  await triageLead(service, lead.id, org.id, { fullName, email, company, message });

  redirect(`${redirectTo}?success=1`);
}

// Best-effort AI triage: summarizes the message, assigns priority/score, and
// suggests a next action. Never blocks or fails lead submission — errors are
// logged to workflow_logs instead, same as n8n-originated workflow runs.
async function triageLead(
  service: ReturnType<typeof createServiceClient>,
  leadId: string,
  orgId: string,
  input: { fullName: string; email: string; company: string | null; message: string | null }
) {
  const startedAt = Date.now();
  try {
    const result = await scoreLead(input);

    await service
      .from("leads")
      .update({
        ai_summary: result.summary,
        priority: result.priority,
        score: result.score,
        next_action: result.nextAction,
        sentiment: result.sentiment,
        sentiment_score: result.sentiment_score,
        status: "processing",
      })
      .eq("id", leadId);

    await service.from("workflow_logs").insert({
      org_id: orgId,
      workflow_name: "lead_scoring",
      status: "success",
      duration_ms: Date.now() - startedAt,
      payload: { leadId },
    });

    if (result.priority === "HOT") {
      await notifyHotAlert({
        orgId,
        kind: "lead",
        id: leadId,
        summary: result.summary,
        score: result.score,
        fromLabel: input.fullName || input.email,
      });
    }
  } catch (err) {
    await service.from("workflow_logs").insert({
      org_id: orgId,
      workflow_name: "lead_scoring",
      status: "failure",
      duration_ms: Date.now() - startedAt,
      payload: { leadId },
      error_details: { message: err instanceof Error ? err.message : String(err) },
    });
  }
}

// Staff-only edits below. All go through the normal (RLS-respecting) client —
// the "leads: staff org access" policy already restricts these to admin/agent
// profiles within their own org, so there's no need for the service client.

export async function updateLeadFields(
  leadId: string,
  fields: Partial<{
    status: Enums<"lead_status">;
    priority: Enums<"lead_priority">;
    next_action: string;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(fields).eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { error: null };
}

export async function generateDraftReply(leadId: string) {
  const supabase = await createClient();
  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("full_name, message, ai_summary")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) return { error: fetchError?.message ?? "Lead not found", draftEmail: null };

  try {
    const draftEmail = await draftEmailReply({
      fullName: lead.full_name,
      message: lead.message,
      aiSummary: lead.ai_summary,
    });

    const { error: updateError } = await supabase
      .from("leads")
      .update({ draft_email: draftEmail })
      .eq("id", leadId);

    if (updateError) return { error: updateError.message, draftEmail: null };

    revalidatePath("/leads");
    return { error: null, draftEmail };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), draftEmail: null };
  }
}

export async function saveDraftReply(leadId: string, draftEmail: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ draft_email: draftEmail }).eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { error: null };
}

// Reuses the same n8n "send email" webhook the email-intelligence flow uses —
// it just sends {to, subject, body} via Gmail, regardless of which table the
// message originated from. Leads don't have a "replied" status, so this marks
// the lead "contacted" instead once the send succeeds.
export async function sendLeadReply(leadId: string) {
  const webhookUrl = process.env.N8N_SEND_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) {
    return { error: "N8N_SEND_EMAIL_WEBHOOK_URL is not configured — set it up in n8n first." };
  }

  const supabase = await createClient();
  const { data: lead, error: fetchError } = await supabase
    .from("leads")
    .select("org_id, email, full_name, draft_email")
    .eq("id", leadId)
    .single();

  if (fetchError || !lead) return { error: fetchError?.message ?? "Lead not found" };
  if (!lead.draft_email) return { error: "Write or generate a draft reply before sending." };

  const startedAt = Date.now();
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        leadId,
        to: lead.email,
        subject: `Re: your message to ${lead.full_name ? "us" : "our team"}`,
        body: lead.draft_email,
      }),
    });

    if (!res.ok) throw new Error(`n8n webhook responded ${res.status}`);

    await supabase.from("leads").update({ status: "contacted" }).eq("id", leadId);
    await supabase.from("workflow_logs").insert({
      org_id: lead.org_id,
      workflow_name: "send_lead_reply",
      status: "success",
      duration_ms: Date.now() - startedAt,
      payload: { leadId },
    });
  } catch (err) {
    await supabase.from("workflow_logs").insert({
      org_id: lead.org_id,
      workflow_name: "send_lead_reply",
      status: "failure",
      duration_ms: Date.now() - startedAt,
      payload: { leadId },
      error_details: { message: err instanceof Error ? err.message : String(err) },
    });
    return { error: err instanceof Error ? err.message : String(err) };
  }

  revalidatePath("/leads");
  return { error: null };
}

export async function deleteLead(leadId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  if (error) return { error: error.message };

  revalidatePath("/leads");
  return { error: null };
}
