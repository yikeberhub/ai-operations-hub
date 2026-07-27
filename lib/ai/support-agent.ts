import OpenAI from "openai";
import { z } from "zod";

const AnswerResult = z.object({
  answer: z.string(),
  confidence: z.number().min(0).max(1),
});

export type SupportAgentAnswer = z.infer<typeof AnswerResult>;

const SYSTEM_PROMPT = `You are a support agent answering a customer's question using ONLY the
provided knowledge-base excerpts as source material. Rules:
- If the excerpts answer the question, give a clear, concise answer (2-5 sentences) based only on them.
- If the excerpts don't contain enough information to answer confidently, say so plainly and suggest
  the customer wait for a human agent — do not guess or use outside knowledge.
- confidence is a 0-1 score for how well the excerpts actually support your answer (0 = no relevant
  information found, 1 = fully and directly answered).
Respond with a JSON object: { "answer": "...", "confidence": 0.0 }`;

export async function answerFromContext(input: {
  question: string;
  chunks: { content: string; similarity: number }[];
}): Promise<SupportAgentAnswer> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const context = input.chunks.length
    ? input.chunks
        .map((c, i) => `[${i + 1}] (relevance ${c.similarity.toFixed(2)})\n${c.content}`)
        .join("\n\n")
    : "(no relevant knowledge-base excerpts found)";

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Knowledge base excerpts:\n${context}\n\nCustomer question: ${input.question}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("OpenAI returned an empty response");

  return AnswerResult.parse(JSON.parse(raw));
}
