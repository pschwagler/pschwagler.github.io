import { action, _resetRateLimitState } from "./api.contact";
import * as turnstile from "~/lib/turnstile.server";
import * as resend from "~/lib/resend.server";

// Mock Supabase
const mockInsert = vi.fn().mockResolvedValue({ error: null });
vi.mock("~/lib/supabase.server", () => ({
  getSupabase: vi.fn(() => ({
    from: () => ({ insert: mockInsert }),
  })),
}));

// Mock Resend
vi.mock("~/lib/resend.server", () => ({
  sendContactEmail: vi.fn().mockResolvedValue(undefined),
}));

function makeRequest(body: Record<string, unknown>, ip = "127.0.0.1"): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function validBody(overrides: Record<string, unknown> = {}) {
  return { email: "test@example.com", message: "Hello!", ...overrides };
}

describe("api.contact", () => {
  beforeEach(() => {
    _resetRateLimitState();
    mockInsert.mockResolvedValue({ error: null });
    vi.mocked(resend.sendContactEmail).mockResolvedValue(undefined);
  });

  // --- Validation ---

  it("rejects invalid JSON with 400", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    const res = await action({ request });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid request body");
  });

  it("rejects missing email with 400", async () => {
    const res = await action({
      request: makeRequest({ message: "Hello" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid email address");
  });

  it("rejects invalid email with 400", async () => {
    const res = await action({
      request: makeRequest({ email: "notanemail", message: "Hello" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid email address");
  });

  it("rejects empty message with 400", async () => {
    const res = await action({
      request: makeRequest({ email: "test@example.com", message: "   " }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Message cannot be empty");
  });

  it("rejects message over 2000 characters with 400", async () => {
    const res = await action({
      request: makeRequest(
        validBody({ message: "a".repeat(2001) }),
        "10.0.0.1"
      ),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Message too long");
  });

  it("allows message at exactly 2000 characters", async () => {
    const res = await action({
      request: makeRequest(
        validBody({ message: "a".repeat(2000) }),
        "10.0.0.2"
      ),
    });
    expect(res.status).toBe(200);
  });

  // --- Turnstile ---

  it("rejects with 403 when Turnstile verification fails", async () => {
    vi.spyOn(turnstile, "verifyTurnstileToken").mockResolvedValueOnce({
      success: false,
      errorCodes: ["invalid-input-response"],
    });
    const res = await action({
      request: makeRequest(validBody(), "10.0.0.3"),
    });
    expect(res.status).toBe(403);
  });

  // --- Rate limiting ---

  it("allows 3 submissions per hour", async () => {
    const ip = "10.0.0.10";
    for (let i = 0; i < 3; i++) {
      const res = await action({
        request: makeRequest(validBody(), ip),
      });
      expect(res.status).toBe(200);
    }
  });

  it("rejects 4th submission within an hour", async () => {
    const ip = "10.0.0.11";
    for (let i = 0; i < 3; i++) {
      await action({ request: makeRequest(validBody(), ip) });
    }
    const res = await action({
      request: makeRequest(validBody(), ip),
    });
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("Rate limit");
  });

  it("does not affect different IPs", async () => {
    const ip1 = "10.0.0.12";
    const ip2 = "10.0.0.13";
    for (let i = 0; i < 3; i++) {
      await action({ request: makeRequest(validBody(), ip1) });
    }
    const res = await action({
      request: makeRequest(validBody(), ip2),
    });
    expect(res.status).toBe(200);
  });

  // --- Supabase insert ---

  it("inserts into Supabase on success", async () => {
    await action({
      request: makeRequest(validBody(), "10.0.0.20"),
    });
    expect(mockInsert).toHaveBeenCalledWith({
      email: "test@example.com",
      message: "Hello!",
      ip_address: "10.0.0.20",
    });
  });

  it("returns 500 when Supabase insert fails", async () => {
    mockInsert.mockResolvedValueOnce({
      error: { message: "db error" },
    });
    const res = await action({
      request: makeRequest(validBody(), "10.0.0.21"),
    });
    expect(res.status).toBe(500);
  });

  // --- Resend fire-and-forget ---

  it("calls sendContactEmail on success", async () => {
    await action({
      request: makeRequest(validBody(), "10.0.0.30"),
    });
    expect(resend.sendContactEmail).toHaveBeenCalledWith(
      "test@example.com",
      "Hello!"
    );
  });

  it("still succeeds if sendContactEmail rejects", async () => {
    vi.mocked(resend.sendContactEmail).mockRejectedValueOnce(
      new Error("email failed")
    );
    const res = await action({
      request: makeRequest(validBody(), "10.0.0.31"),
    });
    expect(res.status).toBe(200);
  });
});
