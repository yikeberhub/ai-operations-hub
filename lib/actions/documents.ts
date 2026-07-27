"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { chunkText } from "@/lib/ai/chunk";
import { embedTexts } from "@/lib/ai/embeddings";

// Manual knowledge-base entry: paste a title + body, it gets chunked and
// embedded immediately. File upload (PDF/docx parsing via Storage) is a
// future step — this covers the FAQ/article use case for now.
export async function submitDocument(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  const { profile } = await getCurrentProfile();
  if (!profile) return { error: "No profile found for current user" };

  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("documents")
    .insert({
      org_id: profile.org_id,
      title,
      storage_path: `manual/${randomUUID()}`,
      status: "processing",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await ingestDocument(document.id, profile.org_id, content);

  revalidatePath("/settings");
  return { error: null };
}

async function ingestDocument(documentId: string, orgId: string, content: string) {
  const supabase = await createClient();
  const startedAt = Date.now();
  try {
    const chunks = chunkText(content);
    if (chunks.length === 0) throw new Error("Document has no content to embed");

    const embeddings = await embedTexts(chunks);

    const { error: insertError } = await supabase.from("document_chunks").insert(
      chunks.map((chunk, i) => ({
        org_id: orgId,
        document_id: documentId,
        content: chunk,
        // pgvector's text input format is exactly a JSON array literal, e.g. "[0.1,0.2,...]"
        embedding: JSON.stringify(embeddings[i]),
      }))
    );
    if (insertError) throw new Error(insertError.message);

    await supabase.from("documents").update({ status: "ready" }).eq("id", documentId);

    await supabase.from("workflow_logs").insert({
      org_id: orgId,
      workflow_name: "document_ingestion",
      status: "success",
      duration_ms: Date.now() - startedAt,
      payload: { documentId, chunkCount: chunks.length },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("documents").update({ status: "failed", error: message }).eq("id", documentId);

    await supabase.from("workflow_logs").insert({
      org_id: orgId,
      workflow_name: "document_ingestion",
      status: "failure",
      duration_ms: Date.now() - startedAt,
      payload: { documentId },
      error_details: { message },
    });
  }
}

export async function deleteDocument(documentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", documentId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}
