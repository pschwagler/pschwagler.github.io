import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Returns a Supabase client for server-side use (API routes, loaders).
 * Lazy singleton — only initialized on first call, reused thereafter.
 * Throws if SUPABASE_URL or SUPABASE_ANON_KEY env vars are missing.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY must be set"
      );
    }
    client = createClient(url, key);
  }
  return client;
}

/** Reset the singleton (for testing only). */
export function _resetClient(): void {
  client = null;
}
