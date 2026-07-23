import { NextRequest, NextResponse } from "next/server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "@/lib/mcp/server";

/**
 * MCP endpoint for n8n's "MCP Client Tool" node.
 * Stateless streamable-HTTP transport: a fresh server+transport per request,
 * the recommended pattern for serverless/edge-style route handlers.
 *
 * n8n config: URL = <deployment>/api/mcp, Header = Authorization: Bearer <N8N_WEBHOOK_SECRET>
 */

function isAuthorized(req: NextRequest) {
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  return transport.handleRequest(req);
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. This MCP server only supports stateless POST." },
    { status: 405 }
  );
}
