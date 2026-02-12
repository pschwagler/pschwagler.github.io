import {
  MAX_CONTACT_MESSAGE_LENGTH,
  MAX_CONTACT_PER_HOUR,
} from "~/lib/constants";
import { verifyTurnstileToken } from "~/lib/turnstile.server";
import { getSupabase } from "~/lib/supabase.server";
import { sendContactEmail } from "~/lib/resend.server";

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rateLimitState = new Map<string, number[]>();

// Clean up stale entries every 5 minutes
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitState) {
      const recent = timestamps.filter((t) => now - t < WINDOW_MS);
      if (recent.length === 0) {
        rateLimitState.delete(key);
      } else {
        rateLimitState.set(key, recent);
      }
    }
  },
  5 * 60 * 1000
);
cleanupInterval.unref?.();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

export async function action({ request }: { request: Request }) {
  let body: {
    email?: unknown;
    message?: unknown;
    name?: unknown;
    company?: unknown;
    jobTitle?: unknown;
    turnstileToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const { email, message, turnstileToken } = body;
    const name =
      typeof body.name === "string" ? body.name.trim() || undefined : undefined;
    const company =
      typeof body.company === "string"
        ? body.company.trim() || undefined
        : undefined;
    const jobTitle =
      typeof body.jobTitle === "string"
        ? body.jobTitle.trim() || undefined
        : undefined;

    // --- Validate fields ---
    if (typeof email !== "string" || !EMAIL_RE.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return Response.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > MAX_CONTACT_MESSAGE_LENGTH) {
      return Response.json(
        {
          error: `Message too long (max ${MAX_CONTACT_MESSAGE_LENGTH} characters)`,
        },
        { status: 400 }
      );
    }

    // --- Turnstile verification ---
    const clientIp = getClientIp(request);
    const turnstileResult = await verifyTurnstileToken(
      turnstileToken,
      clientIp
    );
    if (!turnstileResult.success) {
      return Response.json(
        {
          error: "Verification failed",
          noToken: turnstileResult.noToken,
          errorCodes: turnstileResult.errorCodes,
        },
        { status: 403 }
      );
    }

    // --- Rate limiting (sliding window) ---
    const now = Date.now();
    const timestamps = (rateLimitState.get(clientIp) ?? []).filter(
      (t) => now - t < WINDOW_MS
    );
    if (timestamps.length >= MAX_CONTACT_PER_HOUR) {
      return Response.json(
        { error: "Rate limit exceeded — try again later" },
        { status: 429 }
      );
    }
    rateLimitState.set(clientIp, [...timestamps, now]);

    // --- Store in Supabase ---
    const supabase = getSupabase();
    const { error: dbError } = await supabase.from("contact_messages").insert({
      email,
      message: message.trim(),
      ip_address: clientIp,
      name,
      company,
      job_title: jobTitle,
    });

    if (dbError) {
      console.error("Failed to store contact message:", dbError);
      return Response.json(
        { error: "Failed to send message" },
        { status: 500 }
      );
    }

    // --- Send email (fire-and-forget) ---
    sendContactEmail({
      email,
      message: message.trim(),
      name,
      company,
      jobTitle,
    }).catch((err) => {
      console.error("Failed to send contact email:", err);
    });

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Something went wrong — try again" },
      { status: 500 }
    );
  }
}

/** Exported for testing — clears in-memory rate limit state. */
export function _resetRateLimitState(): void {
  rateLimitState.clear();
}
