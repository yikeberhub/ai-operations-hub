-- Similarity search used by the Support Agent's RAG retrieval.
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_org_id uuid,
  match_count int default 5,
  similarity_threshold float default 0.7
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where document_chunks.org_id = match_org_id
    and 1 - (document_chunks.embedding <=> query_embedding) > similarity_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
