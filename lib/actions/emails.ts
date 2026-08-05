"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { categorizeEmail, draftEmailReply } from "@/lib/ai/email-intelligence";
import type { Enums } from "@/lib/types/database.types";

// Manual intake for staff logging an email received outside the (future) n8n
// mail-polling pipeline. n8n will insert via the create_email MCP tool once
// wired up; this covers the same path for ad-hoc/manual entries.
export async function submitEmail(formData: FormData) {
  const fromAddress = formData.get("fromAddress") as string;
  const subject = (formData.get("subject") as string) || null;
  const body = formData.get("body") as string;

  const { profile } = await getCurrentProfile();
  if (!profile) return { error: "No profile found for current user" };

  const supabase = await createClient();
  const { data: email, error } = await supabase
    .from("emails")
    .insert({ org_id: profile.org_id, from_address: fromAddress, subject, body })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await triageEmail(email.id, profile.org_id, { fromAddress, subject, body });

  revalidatePath("/email-intelligence");
  return { error: null };
}

// Best-effort AI triage: categorizes the email and assigns priority. Never
// blocks or fails the insert — errors are logged to workflow_logs, matching
// the lead_scoring pattern.
async function triageEmail(
  emailId: string,
  orgId: string,
  input: { fromAddress: string; subject: string | null; body: string }
) {
  const supabase = await createClient();
  const startedAt = Date.now();
  try {
    const result = await categorizeEmail(input);

    await supabase
      .from("emails")
      .update({
        ai_summary: result.summary,
        category: result.category,
        priority: result.priority,
        sentiment: result.sentiment,
        sentiment_score: result.sentiment_score,
        status: "processed",
      })
      .eq("id", emailId);

    await supabase.from("workflow_logs").insert({
      org_id: orgId,
      workflow_name: "email_categorization",
      status: "success",
      duration_ms: Date.now() - startedAt,
      payload: { emailId },
    });
  } catch (err) {
    await supabase.from("workflow_logs").insert({
      org_id: orgId,
      workflow_name: "email_categorization",
      status: "failure",
      duration_ms: Date.now() - startedAt,
      payload: { emailId },
      error_details: { message: err instanceof Error ? err.message : String(err) },
    });
  }
}

export async function updateEmailFields(
  emailId: string,
  fields: Partial<{
    status: Enums<"email_status">;
    category: Enums<"email_category">;
    priority: Enums<"email_priority">;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("emails").update(fields).eq("id", emailId);

  if (error) return { error: error.message };

  revalidatePath("/email-intelligence");
  return { error: null };
}

export async function generateEmailDraft(emailId: string) {
  const supabase = await createClient();
  const { data: email, error: fetchError } = await supabase
    .from("emails")
    .select("from_address, subject, body, ai_summary")
    .eq("id", emailId)
    .single();

  if (fetchError || !email) return { error: fetchError?.message ?? "Email not found", draftReply: null };

  try {
    const draftReply = await draftEmailReply({
      fromAddress: email.from_address,
      subject: email.subject,
      body: email.body,
      aiSummary: email.ai_summary,
    });

    const { error: updateError } = await supabase
      .from("emails")
      .update({ draft_reply: draftReply })
      .eq("id", emailId);

    if (updateError) return { error: updateError.message, draftReply: null };

    revalidatePath("/email-intelligence");
    return { error: null, draftReply };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), draftReply: null };
  }
}

export async function saveEmailDraft(emailId: string, draftReply: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("emails").update({ draft_reply: draftReply }).eq("id", emailId);

  if (error) return { error: error.message };

  revalidatePath("/email-intelligence");
  return { error: null };
}

// Reads the workflow_logs trail left by sendEmailReply() for a given email —
// there's no dedicated replies table, so this is the closest thing to a send history.
export async function getEmailReplyHistory(emailId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workflow_logs")
    .select("id, status, created_at, duration_ms, error_details")
    .eq("workflow_name", "send_email_reply")
    .contains("payload", { emailId })
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, history: [] };
  return { error: null, history: data ?? [] };
}

export async function deleteEmail(emailId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("emails").delete().eq("id", emailId);

  if (error) return { error: error.message };

  revalidatePath("/email-intelligence");
  return { error: null };
}

// Triggers the n8n "send email" workflow (Webhook trigger -> SMTP/Gmail/Outlook
// send node). The app never holds mail-provider credentials — n8n owns the
// actual send, keyed off org_id so multi-tenant mailboxes work later too.
export async function sendEmailReply(emailId: string) {
  const webhookUrl = process.env.N8N_SEND_EMAIL_WEBHOOK_URL;
  if (!webhookUrl) {
    return { error: "N8N_SEND_EMAIL_WEBHOOK_URL is not configured — set it up in n8n first." };
  }

  const supabase = await createClient();
  const { data: email, error: fetchError } = await supabase
    .from("emails")
    .select("org_id, from_address, subject, draft_reply")
    .eq("id", emailId)
    .single();

  if (fetchError || !email) return { error: fetchError?.message ?? "Email not found" };
  if (!email.draft_reply) return { error: "Write or generate a draft reply before sending." };

  const startedAt = Date.now();
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        emailId,
        to: email.from_address,
        subject: email.subject ? `Re: ${email.subject}` : "Re: your message",
        body: email.draft_reply,
      }),
    });

    if (!res.ok) throw new Error(`n8n webhook responded ${res.status}`);

    await supabase.from("emails").update({ status: "replied" }).eq("id", emailId);
    await supabase.from("workflow_logs").insert({
      org_id: email.org_id,
      workflow_name: "send_email_reply",
      status: "success",
      duration_ms: Date.now() - startedAt,
      payload: { emailId },
    });
  } catch (err) {
    await supabase.from("workflow_logs").insert({
      org_id: email.org_id,
      workflow_name: "send_email_reply",
      status: "failure",
      duration_ms: Date.now() - startedAt,
      payload: { emailId },
      error_details: { message: err instanceof Error ? err.message : String(err) },
    });
    return { error: err instanceof Error ? err.message : String(err) };
  }

  revalidatePath("/email-intelligence");
  return { error: null };
}
