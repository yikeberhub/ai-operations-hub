import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { scoreLead } from "@/lib/ai/lead-scoring";
import { categorizeEmail } from "@/lib/ai/email-intelligence";
import { notifyHotAlert } from "@/lib/actions/notifications";

/**
 * Tools exposed to n8n via the MCP Client Tool node (see app/api/mcp/route.ts).
 * Uses the service-role client, so these bypass RLS by design — auth is enforced
 * at the transport layer (bearer secret), not per-row.
 */
export function createMcpServer() {
  const server = new McpServer({
    name: "ai-operations-hub",
    version: "0.1.0",
  });

  async function getDefaultOrgId(supabase: ReturnType<typeof createServiceClient>) {
    const { data, error } = await supabase
      .from("orgs")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    if (error || !data) throw new Error("No org found — run migrations/seed first.");
    return data.id as string;
  }

  server.registerTool(
    "create_lead",
    {
      title: "Create Lead",
      description:
        "Insert a new lead captured by an n8n workflow (form fill, ad platform webhook, etc.). Does not run AI scoring — call score_lead separately or let the app's DB trigger enqueue it.",
      inputSchema: {
        full_name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        phone: z.string().optional(),
        message: z.string().optional(),
        source: z.string().optional(),
      },
    },
    async (input) => {
      const supabase = createServiceClient();
      const org_id = await getDefaultOrgId(supabase);

      const { data, error } = await supabase
        .from("leads")
        .insert({ ...input, org_id, source: input.source ?? "n8n" })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return {
        content: [{ type: "text", text: JSON.stringify({ lead_id: data.id }) }],
      };
    }
  );

  server.registerTool(
    "create_email",
    {
      title: "Ingest Email",
      description:
        "Insert a raw email captured by an n8n mail-polling workflow, pending AI categorization.",
      inputSchema: {
        thread_id: z.string().optional(),
        from_address: z.string(),
        subject: z.string().optional(),
        body: z.string(),
      },
    },
    async (input) => {
      const supabase = createServiceClient();
      const org_id = await getDefaultOrgId(supabase);

      const { data, error } = await supabase
        .from("emails")
        .insert({ ...input, org_id })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return {
        content: [{ type: "text", text: JSON.stringify({ email_id: data.id }) }],
      };
    }
  );

  server.registerTool(
    "log_workflow_run",
    {
      title: "Log Workflow Run",
      description:
        "Record an n8n workflow execution's outcome so it shows up on the Workflow Logs page.",
      inputSchema: {
        workflow_name: z.string(),
        status: z.enum(["success", "failure"]),
        duration_ms: z.number().optional(),
        payload: z.record(z.string(), z.any()).optional(),
        error_details: z.record(z.string(), z.any()).optional(),
      },
    },
    async (input) => {
      const supabase = createServiceClient();
      const org_id = await getDefaultOrgId(supabase);

      const { data, error } = await supabase
        .from("workflow_logs")
        .insert({ ...input, org_id, source: "n8n" })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      return {
        content: [{ type: "text", text: JSON.stringify({ log_id: data.id }) }],
      };
    }
  );

  server.registerTool(
    "list_workflow_logs",
    {
      title: "List Workflow Logs",
      description: "Fetch recent workflow execution logs, optionally filtered by status.",
      inputSchema: {
        status: z.enum(["success", "failure"]).optional(),
        limit: z.number().min(1).max(100).default(20),
      },
    },
    async ({ status, limit }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from("workflow_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  server.registerTool(
    "score_lead",
    {
      title: "Score Lead",
      description:
        "Run AI triage on a lead: summarizes the message, assigns priority (HOT/WARM/COLD), a 0-100 score, and a suggested next action. Updates the lead row in place.",
      inputSchema: { lead_id: z.string().uuid() },
    },
    async ({ lead_id }) => {
      const supabase = createServiceClient();
      const { data: lead, error: fetchError } = await supabase
        .from("leads")
        .select("org_id, full_name, email, company, message")
        .eq("id", lead_id)
        .single();
      if (fetchError || !lead) throw new Error(fetchError?.message ?? "Lead not found");

      const result = await scoreLead({
        fullName: lead.full_name,
        email: lead.email,
        company: lead.company,
        message: lead.message,
      });

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          ai_summary: result.summary,
          priority: result.priority,
          score: result.score,
          next_action: result.nextAction,
          status: "processing",
        })
        .eq("id", lead_id);
      if (updateError) throw new Error(updateError.message);

      if (result.priority === "HOT") {
        await notifyHotAlert({
          orgId: lead.org_id,
          kind: "lead",
          id: lead_id,
          summary: result.summary,
          score: result.score,
          fromLabel: lead.full_name ?? lead.email,
        });
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "categorize_email",
    {
      title: "Categorize Email",
      description:
        "Run AI triage on an email: summarizes it, assigns a category (sales/support/billing/spam/other) and priority (HOT/WARM/COLD). Updates the email row in place.",
      inputSchema: { email_id: z.string().uuid() },
    },
    async ({ email_id }) => {
      const supabase = createServiceClient();
      const { data: email, error: fetchError } = await supabase
        .from("emails")
        .select("org_id, from_address, subject, body")
        .eq("id", email_id)
        .single();
      if (fetchError || !email) throw new Error(fetchError?.message ?? "Email not found");

      const result = await categorizeEmail({
        fromAddress: email.from_address,
        subject: email.subject,
        body: email.body,
      });

      const { error: updateError } = await supabase
        .from("emails")
        .update({
          ai_summary: result.summary,
          category: result.category,
          priority: result.priority,
          status: "processed",
        })
        .eq("id", email_id);
      if (updateError) throw new Error(updateError.message);

      if (result.priority === "HOT") {
        await notifyHotAlert({
          orgId: email.org_id,
          kind: "email",
          id: email_id,
          summary: result.summary,
          fromLabel: email.from_address,
        });
      }

      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "get_lead",
    {
      title: "Get Lead",
      description: "Fetch a single lead by id, including AI scoring fields once processed.",
      inputSchema: { lead_id: z.string().uuid() },
    },
    async ({ lead_id }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", lead_id)
        .single();

      if (error) throw new Error(error.message);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }
  );

  return server;
}
