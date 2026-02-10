import { describe, it, expect, vi, beforeEach } from "vitest";
import { retrieveRelevantChunks } from "./retrieval.server";

// Mock AI SDK embed
const mockEmbed = vi.fn();
vi.mock("ai", () => ({
  embed: (...args: unknown[]) => mockEmbed(...args),
}));

vi.mock("@ai-sdk/google", () => ({
  google: {
    textEmbeddingModel: vi.fn().mockReturnValue("mock-embedding-model"),
  },
}));

// Mock Supabase
const mockRpc = vi.fn();
vi.mock("~/lib/supabase.server", () => ({
  getSupabase: () => ({ rpc: mockRpc }),
}));

describe("retrieveRelevantChunks", () => {
  const fakeEmbedding = new Array(768).fill(0.1);

  beforeEach(() => {
    vi.clearAllMocks();
    mockEmbed.mockResolvedValue({ embedding: fakeEmbedding });
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  it("embeds the query with Google text-embedding-004", async () => {
    await retrieveRelevantChunks("What is Patrick's experience?");

    expect(mockEmbed).toHaveBeenCalledWith({
      model: "mock-embedding-model",
      value: "What is Patrick's experience?",
    });
  });

  it("calls match_documents RPC with correct params", async () => {
    await retrieveRelevantChunks("test query");

    expect(mockRpc).toHaveBeenCalledWith("match_documents", {
      query_embedding: fakeEmbedding,
      match_count: 5,
      match_threshold: 0.5,
    });
  });

  it("passes custom topK to match_count", async () => {
    await retrieveRelevantChunks("test query", 3);

    expect(mockRpc).toHaveBeenCalledWith(
      "match_documents",
      expect.objectContaining({ match_count: 3 })
    );
  });

  it("returns document chunks from Supabase", async () => {
    const mockChunks = [
      {
        id: 1,
        content: "chunk 1",
        metadata: { source: "bio.md" },
        similarity: 0.9,
      },
      {
        id: 2,
        content: "chunk 2",
        metadata: { source: "skills.md" },
        similarity: 0.8,
      },
    ];
    mockRpc.mockResolvedValue({ data: mockChunks, error: null });

    const result = await retrieveRelevantChunks("test query");

    expect(result).toEqual(mockChunks);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when no matches found", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    const result = await retrieveRelevantChunks("obscure question");

    expect(result).toEqual([]);
  });

  it("throws on Supabase RPC error", async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "connection refused" },
    });

    await expect(retrieveRelevantChunks("test")).rejects.toThrow(
      "Retrieval failed: connection refused"
    );
  });

  it("returns empty array when data is null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const result = await retrieveRelevantChunks("test");

    expect(result).toEqual([]);
  });
});
