# Muya Tech: AI Operations Hub

An internal operations platform that triages inbound email and leads with AI, drafts replies, answers customer questions from a private knowledge base, and pings the team on Slack when something needs a human. Built as a portfolio project for **Muya Tech**, a fictional B2B SaaS company.

Live demo: [ai-operations-hub-omega.vercel.app](https://ai-operations-hub-omega.vercel.app)

## What it does

Every inbound email and lead gets AI triage automatically: category, priority (HOT/WARM/COLD), a one-sentence summary, and a sentiment score, before a human ever looks at it. Only what's actually urgent interrupts anyone.

- **Email Intelligence**: inbound Gmail is polled, categorized, and prioritized. Staff can filter, search, paginate, generate an AI-drafted reply, and send it, all from the dashboard.
- **Lead Management**: leads from the public contact form or the client portal are scored 0-100 for urgency/quality with a suggested next action, and a draft reply can be generated and sent the same way.
- **Sentiment Analysis**: every email and lead gets a Positive/Neutral/Negative sentiment score, visualized on the dashboard with a pie chart, a 30-day trend line, and a priority-vs-sentiment breakdown.
- **Selam**: an AI support assistant (RAG, powered by an uploaded knowledge base) available to both staff and logged-in clients. She only answers from what's actually in the knowledge base; low-confidence answers are flagged for a human instead of guessing.
- **Real-time Slack alerts**: HOT-priority emails and leads post to Slack immediately; everything else stays in the dashboard so the channel doesn't turn into noise.
- **Client portal**: a separate, scoped view for logged-in customers to submit messages, track their status, and chat with Selam.

## Tech stack

<!-- markdownlint-disable MD060 -->

| Layer       | Choice                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------- |
| Framework   | [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)                  |
| Language    | TypeScript                                                                                 |
| Database    | [Supabase](https://supabase.com) (Postgres + pgvector + Auth + RLS)                        |
| AI          | OpenAI (`gpt-4o-mini` for triage/drafts, `text-embedding-3-small` for the knowledge base)  |
| Automation  | [n8n](https://n8n.io), for Gmail polling, sending replies, Slack alerts, stats aggregation  |
| UI          | shadcn/ui, Tailwind CSS v4, Chart.js                                                        |
| Hosting     | Vercel                                                                                      |

<!-- markdownlint-enable MD060 -->

## Architecture

```text
Gmail inbox
  │  (n8n polls every minute)
  ▼
n8n: Email Ingestion + Triage
  │  POST /api/mcp → create_email → categorize_email (OpenAI)
  │  writes: category, priority, sentiment, sentiment_score
  ▼
Supabase (Postgres)  ◄──────────────┐
  │                                 │
  ▼                                 │
Dashboard (Next.js)                 │
  - filters, pagination, charts     │
  - generate/edit AI draft reply    │
  │                                 │
  ▼                                 │
sendEmailReply() ──► n8n: Reply email workflow ──► Gmail send
                                                      │
HOT priority ──► n8n: HOT Alert Webhook ──► Slack ────┘
```

The app never talks to Gmail or Slack directly. n8n owns every external integration, reached through a small MCP (Model Context Protocol) server exposed at `app/api/mcp`. This keeps provider credentials out of the app entirely and makes the automation layer swappable without touching application code.

## Project structure

```text
app/
  (dashboard)/          Admin routes: email intelligence, leads, Selam, settings, workflow logs
  (client)/client/       Logged-in client portal (separate role, separate nav)
  login/ signup/          Auth pages (split-screen layout, spinner + toast UX)
  forgot-password/        Password reset flow
  auth/callback/           Supabase auth code exchange (magic links, password reset)
  contact/                 Public lead-capture form
  api/mcp/                 MCP server n8n calls into (create_email, categorize_email, get_email_stats, ...)
  api/email-stats/         Server-side proxy for the n8n stats webhook (keeps the shared secret off the client)

components/
  emails/ leads/           Tables, detail sheets, filters, delete dialogs
  support-agent/           Selam's chat UI (shared between admin and client views)
  auth/                    AuthShell layout, login/signup client forms
  dashboard/                Sidebar (collapsible), stat cards, topbar

lib/
  ai/                       OpenAI prompts: email triage, lead scoring, RAG answers
  actions/                  Server actions (emails, leads, auth, notifications, documents)
  mcp/server.ts              The MCP tool definitions n8n calls
  supabase/                  Client factories + auth middleware

supabase/migrations/         10 SQL migrations: schema, RLS policies, RAG match function, sentiment columns
```

## Getting started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key
- An [n8n](https://n8n.io) instance (cloud or self-hosted) with a Slack app connected, for the automation layer

### 2. Install and configure

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

<!-- markdownlint-disable MD060 -->

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project credentials |
| `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `OPENAI_EMBEDDING_MODEL` | OpenAI access + model choice |
| `N8N_WEBHOOK_SECRET` | Shared bearer secret between the app and every n8n webhook |
| `N8N_SEND_EMAIL_WEBHOOK_URL` | n8n workflow that actually sends a reply (Gmail node) |
| `N8N_HOT_ALERT_WEBHOOK_URL` | n8n workflow that posts a HOT-priority alert to Slack |
| `N8N_EMAIL_STATS_WEBHOOK_URL` | n8n workflow returning aggregated sentiment/priority stats for the charts |
| `NEXT_PUBLIC_APP_URL` | Used to build deep links back into the app (Slack buttons, password reset) |

<!-- markdownlint-enable MD060 -->

### 3. Set up the database

Run every file in `supabase/migrations/` in order (0001 to 0010) against your Supabase project, either via the SQL Editor in the Supabase dashboard, or the Supabase CLI:

```bash
supabase db push
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Wire up n8n (optional, for the full automation loop)

The app works standalone for manual entry and Selam, but the "inbound email → auto-triage → Slack alert" loop needs three n8n workflows pointed at `/api/mcp`:

1. **Email Ingestion + Triage**: Gmail Trigger to `create_email` to `categorize_email`, then branch on priority to Slack
2. **Reply email**: Webhook to Gmail send node
3. **HOT Alert / Stats Webhook**: Webhook to Slack, and a separate Webhook to `get_email_stats` that responds with JSON

All three authenticate with the same `N8N_WEBHOOK_SECRET` bearer token.

## Scripts

```bash
npm run dev     # start the dev server (Turbopack)
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Deployment

Deployed on Vercel with GitHub auto-deploy connected to `main`. Set the same environment variables listed above in the Vercel project settings (Production environment).
