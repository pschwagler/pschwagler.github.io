import { getSupabase } from "~/lib/supabase.server";

/**
 * Lightweight health-check endpoint.
 * Called by Vercel cron to keep the Supabase database from pausing due to inactivity.
 */
export async function loader() {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("content_chunks")
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error("Health check DB query failed:", error);
      return Response.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("Health check failed:", err);
    return Response.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
