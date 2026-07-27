"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { embedText } from "@/lib/ai/embeddings";
import { answerFromContext } from "@/lib/ai/support-agent";

const CONFIDENCE_ESCALATION_THRESHOLD = 0.4;

export async function askSupportAgent(sessionId: string | null, question: string) {
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile) return { error: "Not signed in", sessionId: null, message: null };

  const supabase = await createClient();

  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({
        org_id: profile.org_id,
        user_id: user.id,
        title: question.slice(0, 80),
      })
      .select("id")
      .single();

    if (error) return { error: error.message, sessionId: null, message: null };
    activeSessionId = session.id;
  }

  await supabase.from("chat_messages").insert({
    org_id: profile.org_id,
    session_id: activeSessionId,
    role: "user",
    content: question,
  });

  try {
    const queryEmbedding = await embedText(question);

    const { data: matches, error: matchError } = await supabase.rpc("match_document_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_org_id: profile.org_id,
      match_count: 5,
      similarity_threshold: 0.5,
    });
    if (matchError) throw new Error(matchError.message);

    const chunks = matches ?? [];
    const result = await answerFromContext({
      question,
      chunks: chunks.map((c) => ({ content: c.content, similarity: c.similarity })),
    });

    const sources = chunks.map((c) => ({
      documentId: c.document_id,
      content: c.content.slice(0, 200),
      similarity: c.similarity,
    }));

    const shouldEscalate = result.confidence < CONFIDENCE_ESCALATION_THRESHOLD;

    const { data: assistantMessage, error: insertError } = await supabase
      .from("chat_messages")
      .insert({
        org_id: profile.org_id,
        session_id: activeSessionId,
        role: "assistant",
        content: result.answer,
        sources,
        confidence: result.confidence,
      })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);

    if (shouldEscalate) {
      await supabase.from("chat_sessions").update({ escalated: true }).eq("id", activeSessionId);
    }

    revalidatePath("/support-agent");
    return { error: null, sessionId: activeSessionId, message: assistantMessage, escalated: shouldEscalate };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message, sessionId: activeSessionId, message: null };
  }
}
