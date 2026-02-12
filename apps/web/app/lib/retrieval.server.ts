import { embed } from "ai";
import { google } from "@ai-sdk/google";
import { getSupabase } from "~/lib/supabase.server";
import { MATCH_COUNT, MATCH_THRESHOLD } from "~/lib/constants";

export interface DocumentChunk {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Embed a query and retrieve the most relevant content chunks from Supabase pgvector.
 * Uses Google gemini-embedding-001 (768 dimensions) for embedding.
 */
export async function retrieveRelevantChunks(
  query: string,
  topK: number = MATCH_COUNT
): Promise<DocumentChunk[]> {
  const { embedding } = await embed({
    model: google.textEmbeddingModel("gemini-embedding-001"),
    value: query,
    providerOptions: {
      google: { outputDimensionality: 768 },
    },
  });

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: topK,
    match_threshold: MATCH_THRESHOLD,
  });

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }

  return (data ?? []) as DocumentChunk[];
}
