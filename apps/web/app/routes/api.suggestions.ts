import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { SUGGESTION_POOL } from "~/data/suggestions";
import { verifyTurnstileToken } from "~/lib/turnstile.server";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

/**
 * Summarize the conversation into a compact string for the selection prompt.
 * Only includes the last few exchanges to keep the prompt small.
 */
function summarizeConversation(
  messages: Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>
): string {
  const recent = messages.slice(-6);
  return recent
    .map((m) => {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("");
      const role = m.role === "user" ? "User" : "Assistant";
      // Truncate long assistant responses
      const truncated =
        role === "Assistant" && text.length > 300
          ? text.slice(0, 300) + "..."
          : text;
      return `${role}: ${truncated}`;
    })
    .join("\n");
}

export async function action({ request }: { request: Request }) {
  let body: { messages?: unknown; turnstileToken?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, turnstileToken } = body;

  // Turnstile verification
  const clientIp = getClientIp(request);
  const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);
  if (!turnstileResult.success) {
    return Response.json({ error: "Verification failed" }, { status: 403 });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Messages required" }, { status: 400 });
  }

  const typedMessages = messages as Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>;

  try {
    const conversation = summarizeConversation(typedMessages);
    const pool = SUGGESTION_POOL.map((q, i) => `${i + 1}. ${q}`).join("\n");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: z.object({
        suggestions: z
          .array(z.string())
          .length(3)
          .describe("Exactly 3 questions from the pool"),
      }),
      system: [
        "You select follow-up questions for a portfolio website chat.",
        "Pick exactly 3 questions from the numbered pool below.",
        "Rules:",
        "- One should go deeper on the current topic",
        "- One should pivot to an undiscussed topic",
        "- One should be generally interesting",
        "- Never pick questions about topics already thoroughly discussed",
        "- Return the exact question text from the pool, not the number",
      ].join("\n"),
      prompt: `Conversation:\n${conversation}\n\nQuestion pool:\n${pool}`,
    });

    return Response.json({ suggestions: object.suggestions });
  } catch {
    return Response.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
