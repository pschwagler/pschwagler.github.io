import { convertToModelMessages, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import metaRaw from "@content/meta.md?raw";
import bioRaw from "@content/bio.md?raw";
import experienceRaw from "@content/experience.md?raw";
import skillsRaw from "@content/skills.md?raw";
import interviewRaw from "@content/interview.md?raw";
import beachLeagueRaw from "@content/projects/beach-league.md?raw";
import giftwellRaw from "@content/projects/giftwell.md?raw";

// --- Server-side heuristics (PRD Layer 2) ---
const MAX_MESSAGE_LENGTH = 500;
const MIN_MESSAGE_INTERVAL_MS = 2000;

interface ClientState {
  lastTimestamp: number;
  lastMessage: string;
}

const clientState = new Map<string, ClientState>();

// Clean up stale entries every 5 minutes (1h expiry)
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, state] of clientState) {
      if (now - state.lastTimestamp > 60 * 60 * 1000) {
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

function getLastUserMessageText(
  messages: Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      return messages[i].parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
    }
  }
  return null;
}

const SYSTEM_PROMPT = [
  "You are an AI assistant on Patrick Schwagler's personal portfolio website. Your role is to answer questions about Patrick's professional experience, skills, and projects.",
  metaRaw,
  "## Context",
  bioRaw,
  experienceRaw,
  skillsRaw,
  interviewRaw,
  "## Projects",
  beachLeagueRaw,
  giftwellRaw,
].join("\n\n");

export async function action({ request }: { request: Request }) {
  try {
    const { messages } = await request.json();

    // --- Heuristics validation ---
    const lastUserText = getLastUserMessageText(messages);

    if (!lastUserText || lastUserText.trim().length === 0) {
      return new Response("Message cannot be empty", { status: 400 });
    }

    if (lastUserText.length > MAX_MESSAGE_LENGTH) {
      return new Response(
        `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`,
        { status: 400 }
      );
    }

    const clientKey = getClientIp(request);
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
    }

    clientState.set(clientKey, {
      lastTimestamp: now,
      lastMessage: lastUserText.trim(),
    });

    // --- LLM call ---
    const modelMessages = await convertToModelMessages(messages);

    try {
      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
      });
      return result.toUIMessageStreamResponse();
    } catch {
      // Gemini failed — fall back to Anthropic (transparent to user)
      const result = streamText({
        model: anthropic("claude-sonnet-4-5-20250929"),
        system: SYSTEM_PROMPT,
        messages: modelMessages,
      });
      return result.toUIMessageStreamResponse();
    }
  } catch {
    return new Response("Something went wrong — try again", { status: 500 });
  }
}
