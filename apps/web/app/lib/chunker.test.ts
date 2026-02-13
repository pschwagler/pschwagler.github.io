import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "./chunker";

describe("chunkMarkdown", () => {
  it("returns empty array for empty input", () => {
    expect(chunkMarkdown("", "test.md")).toEqual([]);
    expect(chunkMarkdown("   ", "test.md")).toEqual([]);
  });

  it("returns whole file as one chunk when no ## headers", () => {
    const text = "# Beach League\n\nA volleyball league app.";
    const chunks = chunkMarkdown(text, "projects/beach-league.md");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text);
    expect(chunks[0].metadata).toEqual({
      source: "projects/beach-league.md",
      chunk: 0,
    });
  });

  it("splits on ## headers and prepends title", () => {
    const text = [
      "# Skills",
      "",
      "## Languages",
      "",
      "- TypeScript",
      "- Python",
      "",
      "## Tools",
      "",
      "- Git",
      "- Docker",
    ].join("\n");

    const chunks = chunkMarkdown(text, "skills.md");
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe(
      "# Skills\n\n## Languages\n\n- TypeScript\n- Python"
    );
    expect(chunks[1].content).toBe("# Skills\n\n## Tools\n\n- Git\n- Docker");
    expect(chunks[0].metadata).toEqual({ source: "skills.md", chunk: 0 });
    expect(chunks[1].metadata).toEqual({ source: "skills.md", chunk: 1 });
  });

  it("keeps first section with body text as-is (already has title)", () => {
    const text = [
      "# Bio",
      "",
      "Some intro text.",
      "",
      "## Links",
      "",
      "- GitHub",
    ].join("\n");

    const chunks = chunkMarkdown(text, "bio.md");
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe("# Bio\n\nSome intro text.");
    expect(chunks[1].content).toBe("# Bio\n\n## Links\n\n- GitHub");
  });

  it("strips HTML comments before chunking", () => {
    const text = [
      "# Doc",
      "",
      "## Section",
      "",
      "Text here.",
      "",
      "<!-- TODO: fill this in -->",
    ].join("\n");

    const chunks = chunkMarkdown(text, "doc.md");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).not.toContain("TODO");
    expect(chunks[0].content).toContain("Text here.");
  });

  it("filters out title-only first section", () => {
    const text = [
      "# Interview Q&A",
      "",
      "## Question 1",
      "",
      "Answer 1.",
      "",
      "## Question 2",
      "",
      "Answer 2.",
    ].join("\n");

    const chunks = chunkMarkdown(text, "interview.md");
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toContain("Question 1");
    expect(chunks[1].content).toContain("Question 2");
    // Both should have document title
    expect(chunks[0].content).toMatch(/^# Interview Q&A/);
    expect(chunks[1].content).toMatch(/^# Interview Q&A/);
  });

  it("handles file without # title", () => {
    const text = [
      "## Section A",
      "",
      "Content A.",
      "",
      "## Section B",
      "",
      "Content B.",
    ].join("\n");

    const chunks = chunkMarkdown(text, "notitle.md");
    expect(chunks).toHaveLength(2);
    expect(chunks[0].content).toBe("## Section A\n\nContent A.");
    expect(chunks[1].content).toBe("## Section B\n\nContent B.");
  });

  it("preserves ### subsections within ## sections", () => {
    const text = [
      "# Experience",
      "",
      "## C3.ai",
      "",
      "Overview.",
      "",
      "### Manager",
      "",
      "Led team.",
      "",
      "### Senior",
      "",
      "Built apps.",
    ].join("\n");

    const chunks = chunkMarkdown(text, "experience.md");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toContain("### Manager");
    expect(chunks[0].content).toContain("### Senior");
    expect(chunks[0].content).toContain("Overview.");
  });

  it("overlaps last paragraph of chunk N into chunk N+1 for oversized sections", () => {
    // Build a ## section with 3 paragraphs, each ~800 chars so it must split
    const para1 = "First paragraph. " + "A".repeat(780);
    const para2 = "Second paragraph. " + "B".repeat(780);
    const para3 = "Third paragraph. " + "C".repeat(780);
    const text = [
      "# Doc",
      "",
      "## Big Section",
      "",
      para1,
      "",
      para2,
      "",
      para3,
    ].join("\n");

    const chunks = chunkMarkdown(text, "test.md");
    // Should produce multiple chunks from the oversized section
    expect(chunks.length).toBeGreaterThanOrEqual(2);

    // Last paragraph of chunk 0 should appear at the start of chunk 1 (after prefix)
    const chunk0Lines = chunks[0].content.split("\n\n");
    const lastParaOfChunk0 = chunk0Lines[chunk0Lines.length - 1];
    expect(chunks[1].content).toContain(lastParaOfChunk0);

    // Verify the overlap paragraph comes right after the prefix in chunk 1
    const chunk1Lines = chunks[1].content.split("\n\n");
    // chunk1Lines[0] = "# Doc", [1] = "## Big Section", [2] = overlap paragraph
    expect(chunk1Lines[2]).toBe(lastParaOfChunk0);
  });

  it("assigns sequential chunk indices", () => {
    const text = [
      "# Doc",
      "",
      "## A",
      "",
      "a",
      "",
      "## B",
      "",
      "b",
      "",
      "## C",
      "",
      "c",
    ].join("\n");

    const chunks = chunkMarkdown(text, "doc.md");
    expect(chunks.map((c) => c.metadata.chunk)).toEqual([0, 1, 2]);
  });
});
