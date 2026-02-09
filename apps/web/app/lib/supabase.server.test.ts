import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSupabase, _resetClient } from "./supabase.server";

describe("getSupabase", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    _resetClient();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when SUPABASE_URL is missing", () => {
    delete process.env.SUPABASE_URL;
    process.env.SUPABASE_ANON_KEY = "test-key";
    expect(() => getSupabase()).toThrow(
      "Missing Supabase environment variables"
    );
  });

  it("throws when SUPABASE_ANON_KEY is missing", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    delete process.env.SUPABASE_ANON_KEY;
    expect(() => getSupabase()).toThrow(
      "Missing Supabase environment variables"
    );
  });

  it("returns a client when both env vars are set", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
    const client = getSupabase();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });

  it("returns the same client on subsequent calls (singleton)", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
    const first = getSupabase();
    const second = getSupabase();
    expect(first).toBe(second);
  });

  it("creates a new client after _resetClient()", () => {
    process.env.SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_ANON_KEY = "test-key";
    const first = getSupabase();
    _resetClient();
    const second = getSupabase();
    expect(first).not.toBe(second);
  });
});
