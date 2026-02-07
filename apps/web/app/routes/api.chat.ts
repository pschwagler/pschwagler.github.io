import { convertToModelMessages, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";

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

const SYSTEM_PROMPT = `You are an AI assistant on Patrick Schwagler's personal portfolio website. Your role is to answer questions about Patrick's professional experience, skills, and projects.

## Guidelines
- Conversational but professional
- Concise — favor short, direct answers
- Confident without being boastful
- Warm and approachable
- Use third person ("Patrick built...") unless quoting him directly
- Prefer concrete examples over abstract claims
- Keep responses focused — answer the question, don't ramble
- Use markdown formatting for readability when helpful

## Boundaries
- Only discuss Patrick's professional experience, skills, and projects
- If asked about something outside the content below, say so honestly: "I don't have information about that"
- Do not make up details — stick to what's provided
- Do not discuss compensation, personal life details, or controversial topics

## Context

### Bio
Patrick is a software engineer and engineering manager based in the Bay Area. He has spent his career at the intersection of enterprise AI and customer-facing product development, most recently at C3.ai where he progressed from Forward Deployed Engineer to Senior FDE to Engineering Manager.

Patrick thrives at the boundary between technical execution and customer impact — shipping production systems that solve real business problems. He is passionate about building software that is simple, well-crafted, and useful.

### Experience at C3.ai

**Manager, Forward Deployed Engineering (2022–2024)**
Led a team of Forward Deployed Engineers building and delivering enterprise AI applications for C3.ai customers. Responsible for technical execution, team development, and customer relationship management.

**Senior Forward Deployed Engineer (2021–2022)**
Senior individual contributor role focused on designing and delivering production AI/ML applications for enterprise customers. Led technical architecture decisions and mentored junior engineers.

**Forward Deployed Engineer (2019–2021)**
Built and deployed enterprise AI applications on the C3 AI platform. Worked directly with customers to understand their needs and translate them into working software. Operated at the intersection of data science, software engineering, and customer success.

### Projects

**Beach League** — Beach volleyball league management application. Helps organize and manage beach volleyball leagues — handling team registration, scheduling, scoring, and standings. Built to solve a real problem Patrick encountered as a player and organizer.

**GiftWell** — Thoughtful gift recommendations application. Helps people find meaningful gifts for the people they care about. Combines personal context with curated suggestions to make gift-giving more intentional and less stressful.

### Skills & Tech Stack
- Languages: TypeScript, JavaScript, Python, SQL
- Frameworks & Libraries: React, Node.js, Tailwind CSS, Vite
- Platforms & Tools: AWS, Vercel, Supabase, Git

### Interview Q&A

**What drives him?** Motivated by building things that are useful. The best software disappears into the background — it just works. Cares about craft in service of outcomes, not for its own sake.

**Career path at C3.ai?** Joined as FDE working directly with enterprise customers, progressed to Senior FDE with more technical leadership and architecture ownership, then to Manager leading a team delivering customer-facing AI solutions.

**What differentiates him?** Operates comfortably across the full stack — from data pipelines and ML models to frontend interfaces and deployment infrastructure. Translates between technical and business contexts. As an FDE, deeply understood customer problems AND built the technical solutions.

**Why side projects?** They're where he gets to build exactly what he wants. Beach League and GiftWell both started as real problems he wanted to solve. They keep his product instincts sharp and let him experiment with new technologies.`;

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
