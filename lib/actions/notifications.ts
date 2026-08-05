import { createServiceClient } from "@/lib/supabase/service";

// Triggers the n8n "HOT alert" workflow (Webhook trigger -> Slack/Teams/SMS node).
// Fired server-side right after AI triage marks a lead or email HOT, so a human
// gets pinged in real time instead of relying on someone checking the dashboard.
export async function notifyHotAlert(input: {
  orgId: string;
  kind: "lead" | "email";
  id: string;
  summary: string | null;
  score?: number | null;
  fromLabel: string;
}) {
  const webhookUrl = process.env.N8N_HOT_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  const supabase = createServiceClient();
  const startedAt = Date.now();

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({
        kind: input.kind,
        id: input.id,
        orgId: input.orgId,
        from: input.fromLabel,
        summary: input.summary,
        score: input.score ?? null,
        link:
          input.kind === "lead"
            ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/leads?leadId=${input.id}`
            : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/email-intelligence?emailId=${input.id}`,
      }),
    });

    if (!res.ok) throw new Error(`n8n webhook responded ${res.status}`);

    await supabase.from("workflow_logs").insert({
      org_id: input.orgId,
      workflow_name: "hot_alert_notification",
      status: "success",
      duration_ms: Date.now() - startedAt,
      payload: { kind: input.kind, id: input.id },
    });
  } catch (err) {
    await supabase.from("workflow_logs").insert({
      org_id: input.orgId,
      workflow_name: "hot_alert_notification",
      status: "failure",
      duration_ms: Date.now() - startedAt,
      payload: { kind: input.kind, id: input.id },
      error_details: { message: err instanceof Error ? err.message : String(err) },
    });
  }
}
