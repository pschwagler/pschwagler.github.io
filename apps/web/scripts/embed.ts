#!/usr/bin/env node

/**
 * Embedding pipeline: content/*.md → chunks → Google text-embedding-004 → Supabase pgvector
 *
 * Usage: pnpm embed (from apps/web, with .env configured)
 * Requires: SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_GENERATIVE_AI_API_KEY
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { chunkMarkdown } from "../app/lib/chunker.js";

const CONTENT_DIR = join(import.meta.dirname, "../../../content");
const SKIP_FILES = ["meta.md"]; // AI guidelines, not RAG content

// Load .env if present (no dependency needed)
try {
  const envPath = join(import.meta.dirname, "../.env");
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1 || line.startsWith("#")) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (key) process.env[key] ??= value;
  }
} catch {
  // No .env file — rely on environment variables
}

function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      const relPath = relative(CONTENT_DIR, fullPath);
      if (!SKIP_FILES.includes(relPath)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    process.exit(1);
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    process.exit(1);
  }

  // 1. Read + chunk content files
  const files = collectMarkdownFiles(CONTENT_DIR);
  console.log(
    `Found ${files.length} markdown files (skipping: ${SKIP_FILES.join(", ")})\n`
  );

  const allChunks: {
    content: string;
    metadata: { source: string; chunk: number };
  }[] = [];

  for (const file of files) {
    const source = relative(CONTENT_DIR, file);
    const text = readFileSync(file, "utf-8");
    const chunks = chunkMarkdown(text, source);
    console.log(
      `  ${source}: ${chunks.length} chunk${chunks.length === 1 ? "" : "s"}`
    );
    allChunks.push(...chunks);
  }

  console.log(`\nTotal: ${allChunks.length} chunks\n`);

  if (allChunks.length === 0) {
    console.log("No chunks to embed.");
    return;
  }

  // 2. Embed all chunks in one batch
  console.log("Embedding chunks with text-embedding-004...");
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel("text-embedding-004"),
    values: allChunks.map((c) => c.content),
  });
  console.log(`Embedded ${embeddings.length} chunks\n`);

  // 3. Clear existing documents
  const supabase = createClient(url, key);
  console.log("Clearing existing documents...");
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    console.error("Failed to clear documents:", deleteError.message);
    process.exit(1);
  }

  // 4. Insert new documents
  console.log("Inserting new documents...");
  const { error: insertError } = await supabase.from("documents").insert(
    allChunks.map((chunk, i) => ({
      content: chunk.content,
      metadata: chunk.metadata,
      embedding: embeddings[i],
    }))
  );

  if (insertError) {
    console.error("Failed to insert documents:", insertError.message);
    process.exit(1);
  }

  console.log(`\nDone! Inserted ${allChunks.length} document chunks.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
