import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Tools exposed to n8n via the MCP Client Tool node (see app/api/mcp/route.ts).
 * Uses the service-role client, so these bypass RLS by design — auth is enforced
 * at the transport layer (bearer secret), not per-row.
 *
 * Scoring/categorization tools (score_lead, categorize_email) are added once the
 * corresponding AI server actions exist (Leads / Email Intelligence phases) — for
 * now this covers the raw-data ingestion + observability half of the n8n contract.
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
