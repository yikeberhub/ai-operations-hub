import OpenAI from "openai";
import { z } from "zod";

const CategorizationResult = z.object({
  summary: z.string(),
  category: z.enum(["sales", "support", "billing", "spam", "other"]),
  priority: z.enum(["HOT", "WARM", "COLD"]),
  sentiment: z.enum(["Positive", "Neutral", "Negative"]),
  sentiment_score: z.number().min(0).max(1),
});

export type EmailCategorizationResult = z.infer<typeof CategorizationResult>;

const SYSTEM_PROMPT = `You are an email triage assistant for a B2B services company.
Given an inbound email, respond with a JSON object with exactly these fields:
- summary: one-sentence summary of what the sender wants (max 200 chars)
- category: one of "sales" (new business inquiry), "support" (existing customer needs help),
  "billing" (invoices/payments), "spam" (unsolicited/irrelevant), or "other"
- priority: "HOT" (urgent / high-value), "WARM" (needs a timely reply), or "COLD" (low urgency, or spam)
- sentiment: overall emotional tone of the sender's message — "Positive", "Neutral", or "Negative"
- sentiment_score: how strongly that sentiment is expressed, a float from 0.0 (very negative) to 1.0 (very positive),
  with 0.5 as neutral midpoint`;

export async function categorizeEmail(input: {
  fromAddress: string;
  subject: string | null;
  body: string;
}): Promise<EmailCategorizationResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          from: input.fromAddress,
          subject: input.subject,
          body: input.body,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response");

  return CategorizationResult.parse(JSON.parse(raw));
}

const DraftResult = z.object({ draftReply: z.string() });

const DRAFT_SYSTEM_PROMPT = `You are a support/sales rep replying to an inbound email.
Write a short, warm, professional reply (3-6 sentences) that addresses the email directly
and suggests a clear next step. Sign off as "The Team".
Respond with a JSON object: { "draftReply": "<the email body>" }.`;

export async function draftEmailReply(input: {
  fromAddress: string;
  subject: string | null;
  body: string;
  aiSummary: string | null;
}): Promise<string> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: DRAFT_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          from: input.fromAddress,
          subject: input.subject,
          body: input.body,
          summary: input.aiSummary,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response");

  return DraftResult.parse(JSON.parse(raw)).draftReply;
}
