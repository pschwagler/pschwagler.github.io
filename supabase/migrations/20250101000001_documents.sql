-- Enable pgvector extension (Supabase has it pre-installed)
create extension if not exists vector with schema extensions;

-- Documents table for RAG content chunks
create table documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(768) not null
);

-- HNSW index for fast cosine similarity search (works well at any table size)
create index on documents using hnsw (embedding vector_cosine_ops);

-- Similarity search function called via supabase.rpc('match_documents', ...)
create or replace function match_documents(
  query_embedding vector(768),
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
end;
$$;
