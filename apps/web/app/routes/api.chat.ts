import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
} from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import metaRaw from "@content/meta.md?raw";
import bioRaw from "@content/bio.md?raw";
import experienceRaw from "@content/experience.md?raw";
import skillsRaw from "@content/skills.md?raw";
import interviewRaw from "@content/interview.md?raw";
import beachLeagueRaw from "@content/projects/beach-league.md?raw";
import giftwellRaw from "@content/projects/giftwell.md?raw";
import { MAX_MESSAGE_LENGTH, MAX_MESSAGES_PER_HOUR } from "~/lib/constants";
import { getLastUserMessageText } from "~/lib/messages";
import { verifyTurnstileToken } from "~/lib/turnstile.server";
import { retrieveRelevantChunks } from "~/lib/retrieval.server";

// --- Server-side heuristics (PRD Layers 2 & 3) ---
const MIN_MESSAGE_INTERVAL_MS = 2000;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface ClientState {
  lastTimestamp: number;
  lastMessage: string;
  timestamps: number[];
}

const clientState = new Map<string, ClientState>();

// Clean up stale entries every 5 minutes (1h expiry)
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, state] of clientState) {
      if (now - state.lastTimestamp > WINDOW_MS) {
        clientState.delete(key);
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

const BASE_SYSTEM_PROMPT = [
  "You are an AI assistant on Patrick Schwagler's personal portfolio website. Your role is to answer questions about Patrick's professional experience, skills, and projects.",
  metaRaw,
].join("\n\n");

// Inline content fallback when RAG is unavailable (no Supabase, embedding errors, etc.)
const INLINE_CONTENT = [
  "## Context",
  bioRaw,
  experienceRaw,
  skillsRaw,
  interviewRaw,
  "## Projects",
  beachLeagueRaw,
  giftwellRaw,
].join("\n\n");

/**
 * Stream with fallback: tries the primary model first, and if the stream
 * errors before any data is sent, transparently retries with the fallback.
 * Once data has started flowing, errors are surfaced to the client.
 */
function streamWithFallback(
  systemPrompt: string,
  modelMessages: Awaited<ReturnType<typeof convertToModelMessages>>
): Response {
  const primary = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: modelMessages,
  });

  const primaryStream = primary.toUIMessageStream();
  const reader = primaryStream.getReader();
  let started = false;

  const output = new ReadableStream({
    async start(controller) {
      try {
        // Read chunks from primary — if it fails before any data,
        // fall back to the secondary model.
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          started = true;
          controller.enqueue(value);
        }
      } catch (error) {
        if (!started) {
          // Primary failed before sending data — fall back
          try {
            const fallback = streamText({
              model: anthropic("claude-sonnet-4-5-20250929"),
              system: systemPrompt,
              messages: modelMessages,
            });
            const fallbackStream = fallback.toUIMessageStream();
            const fallbackReader = fallbackStream.getReader();
            while (true) {
              const { done, value } = await fallbackReader.read();
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
            }
          } catch {
            controller.error(error);
          }
        } else {
          controller.error(error);
        }
      }
    },
    cancel() {
      reader.cancel();
    },
  });

  return createUIMessageStreamResponse({ stream: output });
}

export async function action({ request }: { request: Request }) {
  let body: { messages?: unknown; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  try {
    const { messages, turnstileToken } = body;

    // --- Turnstile validation (PRD Layer 1) ---
    const clientIp = getClientIp(request);
    const turnstileResult = await verifyTurnstileToken(
      turnstileToken,
      clientIp
    );
    if (!turnstileResult.success) {
      return new Response(
        JSON.stringify({
          error: "Verification failed",
          noToken: turnstileResult.noToken,
          errorCodes: turnstileResult.errorCodes,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Heuristics validation ---
    const lastUserText = getLastUserMessageText(
      messages as Array<{
        role: string;
        parts: Array<{ type: string; text?: string }>;
      }>
    );

    if (!lastUserText || lastUserText.trim().length === 0) {
      return new Response("Message cannot be empty", { status: 400 });
    }

    if (lastUserText.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
        { status: 400 }
      );
    }

    const clientKey = clientIp;
    const state = clientState.get(clientKey);
    const now = Date.now();

    if (state) {
      if (now - state.lastTimestamp < MIN_MESSAGE_INTERVAL_MS) {
        return new Response("Please wait a moment before sending again", {
          status: 429,
        });
      }
      if (lastUserText.trim() === state.lastMessage) {
        return new Response("Duplicate message", { status: 429 });
      }

      // --- Sliding window rate limit (PRD Layer 3) ---
      const recentTimestamps = state.timestamps.filter(
        (t) => now - t < WINDOW_MS
      );
      if (recentTimestamps.length >= MAX_MESSAGES_PER_HOUR) {
        return new Response("Rate limit exceeded — try again later", {
          status: 429,
        });
      }
    }

    const prevTimestamps =
      state?.timestamps.filter((t) => now - t < WINDOW_MS) ?? [];
    clientState.set(clientKey, {
      lastTimestamp: now,
      lastMessage: lastUserText.trim(),
      timestamps: [...prevTimestamps, now],
    });

    // --- RAG retrieval (fall back to inline content on error) ---
    let context: string;
    try {
      const chunks = await retrieveRelevantChunks(lastUserText);
      context =
        chunks.length > 0
          ? "## Retrieved Context\n\n" +
            chunks.map((c) => c.content).join("\n\n")
          : INLINE_CONTENT;
    } catch {
      context = INLINE_CONTENT;
    }

    const systemPrompt = BASE_SYSTEM_PROMPT + "\n\n" + context;

    // --- LLM call with fallback ---
    const modelMessages = await convertToModelMessages(
      messages as Parameters<typeof convertToModelMessages>[0]
    );

    return streamWithFallback(systemPrompt, modelMessages);
  } catch {
    return new Response("Something went wrong — try again", { status: 500 });
  }
}
