import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "./turnstile.server";

describe("verifyTurnstileToken", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("skips validation when TURNSTILE_SECRET_KEY is not set", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstileToken(undefined, "1.2.3.4");
    expect(result).toBe(true);
  });

  it("rejects when token is missing and secret is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const result = await verifyTurnstileToken(undefined, "1.2.3.4");
    expect(result).toBe(false);
  });

  it("returns true for a valid token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }))
    );

    const result = await verifyTurnstileToken("valid-token", "1.2.3.4");
    expect(result).toBe(true);
  });

  it("returns false for an invalid token", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          "error-codes": ["invalid-input-response"],
        })
      )
    );

    const result = await verifyTurnstileToken("bad-token", "1.2.3.4");
    expect(result).toBe(false);
  });

  it("sends correct parameters to Cloudflare", async () => {
    process.env.TURNSTILE_SECRET_KEY = "my-secret";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));

    await verifyTurnstileToken("the-token", "5.6.7.8");

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );

    const body = fetchSpy.mock.calls[0][1]?.body as URLSearchParams;
    expect(body.get("secret")).toBe("my-secret");
    expect(body.get("response")).toBe("the-token");
    expect(body.get("remoteip")).toBe("5.6.7.8");
  });
});
