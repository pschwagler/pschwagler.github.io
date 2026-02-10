import { action } from "./api.chat";
import * as turnstile from "~/lib/turnstile.server";

// Mock AI SDK — we only test heuristics, not LLM calls
function mockStream() {
  return new ReadableStream({
    start(controller) {
      controller.enqueue("ok");
      controller.close();
    },
  });
}

vi.mock("ai", () => ({
  convertToModelMessages: vi.fn().mockResolvedValue([]),
  streamText: vi.fn().mockReturnValue({
    toUIMessageStream: () => mockStream(),
  }),
}));
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn().mockReturnValue("mock-google-model"),
}));
vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn().mockReturnValue("mock-anthropic-model"),
}));

function makeRequest(
  messages: Array<{
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>,
  ip = "127.0.0.1"
): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ messages }),
  });
}

function userMessage(text: string) {
  return { role: "user", parts: [{ type: "text", text }] };
}

describe("api.chat heuristics", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects empty messages with 400", async () => {
    const res = await action({
      request: makeRequest([userMessage("   ")]),
    });
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Message cannot be empty");
  });

  it("rejects messages over 500 characters with 400", async () => {
    const longText = "a".repeat(501);
    const res = await action({
      request: makeRequest([userMessage(longText)], "10.0.0.1"),
    });
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Message too long");
  });

  it("allows messages at exactly 500 characters", async () => {
    const exactText = "a".repeat(500);
    const res = await action({
      request: makeRequest([userMessage(exactText)], "10.0.0.2"),
    });
    expect(res.status).toBe(200);
  });

  it("rejects rapid messages with 429", async () => {
    const ip = "10.0.0.3";
    await action({ request: makeRequest([userMessage("first")], ip) });

    // Send again within 2s
    vi.advanceTimersByTime(500);
    const res = await action({
      request: makeRequest([userMessage("second")], ip),
    });
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("wait");
  });

  it("allows messages after 2s cooldown", async () => {
    const ip = "10.0.0.4";
    await action({ request: makeRequest([userMessage("first")], ip) });

    vi.advanceTimersByTime(2001);
    const res = await action({
      request: makeRequest([userMessage("second")], ip),
    });
    expect(res.status).toBe(200);
  });

  it("rejects duplicate consecutive messages with 429", async () => {
    const ip = "10.0.0.5";
    await action({ request: makeRequest([userMessage("hello")], ip) });

    vi.advanceTimersByTime(3000);
    const res = await action({
      request: makeRequest([userMessage("hello")], ip),
    });
    expect(res.status).toBe(429);
    expect(await res.text()).toContain("Duplicate");
  });

  it("allows same message from different IPs", async () => {
    await action({
      request: makeRequest([userMessage("hello")], "10.0.0.6"),
    });

    const res = await action({
      request: makeRequest([userMessage("hello")], "10.0.0.7"),
    });
    expect(res.status).toBe(200);
  });

  it("allows different message after cooldown from same IP", async () => {
    const ip = "10.0.0.8";
    await action({ request: makeRequest([userMessage("hello")], ip) });

    vi.advanceTimersByTime(3000);
    const res = await action({
      request: makeRequest([userMessage("world")], ip),
    });
    expect(res.status).toBe(200);
  });

  it("extracts last user message from conversation", async () => {
    const messages = [
      userMessage("first question"),
      { role: "assistant", parts: [{ type: "text", text: "response" }] },
      userMessage("second question"),
    ];
    const res = await action({
      request: makeRequest(messages, "10.0.0.9"),
    });
    expect(res.status).toBe(200);
  });

  it("returns 400 for malformed JSON body", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{{",
    });
    const res = await action({ request });
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Invalid request body");
  });

  it("rejects with 403 when Turnstile verification fails", async () => {
    vi.spyOn(turnstile, "verifyTurnstileToken").mockResolvedValueOnce(false);
    const res = await action({
      request: makeRequest([userMessage("hello")], "10.0.0.20"),
    });
    expect(res.status).toBe(403);
    expect(await res.text()).toBe("Verification failed");
  });
});
