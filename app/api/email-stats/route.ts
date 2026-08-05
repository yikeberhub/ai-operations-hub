import { NextResponse } from "next/server";

// Server-side proxy for the n8n "Email Stats Webhook" — keeps N8N_WEBHOOK_SECRET
// out of the browser. The dashboard's SentimentCharts component calls this route,
// not the n8n webhook directly.
export async function GET() {
  const webhookUrl = process.env.N8N_EMAIL_STATS_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_EMAIL_STATS_WEBHOOK_URL is not configured." },
      { status: 500 }
    );
  }

  const res = await fetch(webhookUrl, {
    headers: { Authorization: `Bearer ${process.env.N8N_WEBHOOK_SECRET}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: `n8n webhook responded ${res.status}` }, { status: 502 });
  }

  const stats = await res.json();
  return NextResponse.json(stats);
}
