import { SUGGESTION_POOL, FALLBACK_SUGGESTIONS } from "./suggestions";

describe("suggestion pool", () => {
  it("has at least 50 questions", () => {
    expect(SUGGESTION_POOL.length).toBeGreaterThanOrEqual(50);
  });

  it("has no empty questions", () => {
    for (const q of SUGGESTION_POOL) {
      expect(q.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate questions", () => {
    const unique = new Set(SUGGESTION_POOL);
    expect(unique.size).toBe(SUGGESTION_POOL.length);
  });

  it("all questions are reasonable length (10-100 chars)", () => {
    for (const q of SUGGESTION_POOL) {
      expect(q.length).toBeGreaterThanOrEqual(10);
      expect(q.length).toBeLessThanOrEqual(100);
    }
  });

  it("fallback suggestions are a subset of the pool or standalone", () => {
    expect(FALLBACK_SUGGESTIONS.length).toBe(3);
    for (const q of FALLBACK_SUGGESTIONS) {
      expect(q.trim().length).toBeGreaterThan(0);
    }
  });
});
