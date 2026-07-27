import OpenAI from "openai";
import { z } from "zod";

const ScoringResult = z.object({
  summary: z.string(),
  priority: z.enum(["HOT", "WARM", "COLD"]),
  score: z.number().int().min(0).max(100),
  nextAction: z.string(),
});

export type LeadScoringResult = z.infer<typeof ScoringResult>;

const SYSTEM_PROMPT = `You are a sales and support triage assistant for a B2B services company.
Given a lead's submitted message, respond with a JSON object with exactly these fields:
- summary: one-sentence summary of what the lead wants (max 200 chars)
- priority: "HOT" (ready to buy / urgent issue), "WARM" (interested but not urgent), or "COLD" (vague, spam-like, or low intent)
- score: integer 0-100, lead quality/urgency score
- nextAction: one short, concrete suggested next step for the sales/support team (max 150 chars)`;

export async function scoreLead(input: {
  fullName: string;
  email: string;
  company: string | null;
  message: string | null;
}): Promise<LeadScoringResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          fullName: input.fullName,
          email: input.email,
          company: input.company,
          message: input.message,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response");

  return ScoringResult.parse(JSON.parse(raw));
}

const DraftResult = z.object({ draftEmail: z.string() });

const DRAFT_SYSTEM_PROMPT = `You are a support/sales rep writing a reply email to a lead who contacted us.
Write a short, warm, professional reply (3-6 sentences) that addresses their message directly,
answers or acknowledges what they asked, and suggests a clear next step.
Sign off as "The Team". Respond with a JSON object: { "draftEmail": "<the email body>" }.`;

export async function draftEmailReply(input: {
  fullName: string;
  message: string | null;
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
          fullName: input.fullName,
          message: input.message,
          summary: input.aiSummary,
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response");

  return DraftResult.parse(JSON.parse(raw)).draftEmail;
}
