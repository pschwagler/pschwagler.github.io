/**
 * Test all suggestion pool questions against the local chat API.
 * Usage: npx tsx scripts/test-suggestions.ts
 *
 * Requires dev server running on localhost:5173
 */

import { SUGGESTION_POOL } from "../apps/web/app/data/suggestions.ts";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = "http://localhost:5173";
const DELAY_MS = 3000;
const OUTPUT_PATH = resolve(import.meta.dirname!, "suggestion-results.json");

interface Result {
  question: string;
  answer: string;
  status: "ok" | "error";
  error?: string;
}

/**
 * Parse AI SDK data stream format.
 * Lines: `data: {"type":"text-delta","id":"0","delta":"text"}`
 * Concatenate all text-delta values.
 */
function parseDataStream(raw: string): string {
  const lines = raw.split("\n");
  let text = "";
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6);
    if (payload === "[DONE]") break;
    try {
      const obj = JSON.parse(payload);
      if (obj.type === "text-delta" && typeof obj.delta === "string") {
        text += obj.delta;
      }
    } catch {
      // skip non-JSON lines
    }
  }
  return text;
}

async function sendQuestion(question: string): Promise<Result> {
  const messages = [
    {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: question }],
    },
  ];

  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        question,
        answer: "",
        status: "error",
        error: `${res.status}: ${errText}`,
      };
    }

    const raw = await res.text();
    const answer = parseDataStream(raw);

    if (!answer) {
      return {
        question,
        answer: "",
        status: "error",
        error: "Empty response after parsing stream",
      };
    }

    return { question, answer, status: "ok" };
  } catch (e) {
    return { question, answer: "", status: "error", error: String(e) };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(
    `Testing ${SUGGESTION_POOL.length} questions against ${BASE_URL}/api/chat`
  );
  console.log(`Output: ${OUTPUT_PATH}\n`);

  // Resume from partial results if they exist
  let results: Result[] = [];
  let startIndex = 0;
  if (existsSync(OUTPUT_PATH)) {
    try {
      results = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
      startIndex = results.length;
      if (startIndex > 0 && startIndex < SUGGESTION_POOL.length) {
        console.log(
          `Resuming from question ${startIndex + 1} (${startIndex} already done)\n`
        );
      }
    } catch {
      // corrupted file, start fresh
    }
  }

  for (let i = startIndex; i < SUGGESTION_POOL.length; i++) {
    const question = SUGGESTION_POOL[i];
    const label = `[${i + 1}/${SUGGESTION_POOL.length}]`;
    console.log(`${label} ${question}`);

    const result = await sendQuestion(question);
    results.push(result);

    if (result.status === "error") {
      console.log(`  ❌ ${result.error}`);
    } else {
      console.log(`  ✅ ${result.answer.slice(0, 80)}...`);
    }

    // Save after each question (enables resume)
    writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));

    // Delay between requests (respect 2s cooldown + buffer)
    if (i < SUGGESTION_POOL.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  const okCount = results.filter((r) => r.status === "ok").length;
  const errCount = results.filter((r) => r.status === "error").length;
  console.log(`\nDone! ${okCount} ok, ${errCount} errors`);
  console.log(`Results saved to ${OUTPUT_PATH}`);
}

main();
