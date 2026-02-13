import { action } from "./api.suggestions";
import * as turnstile from "~/lib/turnstile.server";

vi.mock("ai", () => ({
  generateObject: vi.fn().mockResolvedValue({
    object: {
      suggestions: [
        "Tell me about Beach League",
        "What's his engineering philosophy?",
        "How did he achieve $1.8M in cloud savings?",
      ],
    },
  }),
}));
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn().mockReturnValue("mock-google-model"),
}));

function makeRequest(body: Record<string, unknown>, ip = "127.0.0.1"): Request {
  return new Request("http://localhost/api/suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function userMessage(text: string) {
  return { role: "user", parts: [{ type: "text", text }] };
}

function assistantMessage(text: string) {
  return { role: "assistant", parts: [{ type: "text", text }] };
}

describe("api.suggestions", () => {
  it("returns 400 for invalid JSON", async () => {
    const request = new Request("http://localhost/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    const res = await action({ request });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("returns 400 when messages is missing", async () => {
    const res = await action({
      request: makeRequest({}),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Messages required");
  });

  it("returns 400 when messages is empty array", async () => {
    const res = await action({
      request: makeRequest({ messages: [] }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Messages required");
  });

  it("returns 403 when Turnstile verification fails", async () => {
    vi.spyOn(turnstile, "verifyTurnstileToken").mockResolvedValueOnce({
      success: false,
      errorCodes: ["invalid-input-response"],
    });
    const res = await action({
      request: makeRequest({
        messages: [userMessage("hello")],
      }),
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("Verification failed");
  });

  it("returns 3 suggestions on success", async () => {
    const res = await action({
      request: makeRequest({
        messages: [
          userMessage("What did Patrick build at C3?"),
          assistantMessage("Patrick built many applications..."),
        ],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.suggestions).toHaveLength(3);
    expect(data.suggestions).toEqual([
      "Tell me about Beach League",
      "What's his engineering philosophy?",
      "How did he achieve $1.8M in cloud savings?",
    ]);
  });

  it("returns 500 when generateObject fails", async () => {
    const { generateObject } = await import("ai");
    vi.mocked(generateObject).mockRejectedValueOnce(new Error("LLM error"));
    const res = await action({
      request: makeRequest({
        messages: [userMessage("hello")],
      }),
    });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to generate suggestions");
  });
});
