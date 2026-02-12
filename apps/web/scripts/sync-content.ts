#!/usr/bin/env node

/**
 * Content sync pipeline:
 *   1. Auto-commit content changes to local content/ git repo
 *   2. Upload content/*.md → Supabase raw_content table
 *   3. Chunk + embed → Supabase documents table (RAG)
 *
 * Usage: pnpm sync-content (from apps/web, with .env configured)
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_GENERATIVE_AI_API_KEY
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { embedMany } from "ai";
import { google } from "@ai-sdk/google";
import { chunkMarkdown } from "../app/lib/chunker.js";

const CONTENT_DIR = join(import.meta.dirname, "../../../content");
const SKIP_EMBED = ["meta.md"]; // AI guidelines — stored raw but not embedded

// Load .env if present
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
    if (entry.isDirectory() && entry.name !== ".git") {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: CONTENT_DIR, encoding: "utf-8" });
}

function commitContentChanges(): void {
  // Check for changes
  const status = git("status --porcelain").trim();
  if (!status) {
    console.log("No content changes to commit\n");
    return;
  }

  // Show what changed
  console.log("Content changes:");
  for (const line of status.split("\n")) {
    console.log(`  ${line}`);
  }

  // Commit
  git("add -A");
  const timestamp = new Date().toISOString();
  git(`commit -m "Sync ${timestamp}"`);
  console.log(`Committed at ${timestamp}\n`);
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY"
    );
    process.exit(1);
  }
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // 1. Read all content files
  const files = collectMarkdownFiles(CONTENT_DIR);
  console.log(`Found ${files.length} markdown files\n`);

  // 2. Auto-commit content changes
  commitContentChanges();

  const fileEntries = files.map((file) => ({
    path: relative(CONTENT_DIR, file),
    content: readFileSync(file, "utf-8"),
  }));

  // 3. Upsert into raw_content
  console.log("Uploading to raw_content...");
  const { error: upsertError } = await supabase.from("raw_content").upsert(
    fileEntries.map((f) => ({
      path: f.path,
      content: f.content,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "path" }
  );

  if (upsertError) {
    console.error("Failed to upsert raw_content:", upsertError.message);
    process.exit(1);
  }
  console.log(`Upserted ${fileEntries.length} files\n`);

  // 4. Chunk files (skip meta.md for embedding)
  const allChunks: {
    content: string;
    metadata: { source: string; chunk: number };
  }[] = [];

  for (const entry of fileEntries) {
    if (SKIP_EMBED.includes(entry.path)) {
      console.log(`  ${entry.path}: skipped (not embedded)`);
      continue;
    }
    const chunks = chunkMarkdown(entry.content, entry.path);
    console.log(
      `  ${entry.path}: ${chunks.length} chunk${chunks.length === 1 ? "" : "s"}`
    );
    allChunks.push(...chunks);
  }

  console.log(`\nTotal: ${allChunks.length} chunks\n`);

  if (allChunks.length === 0) {
    console.log("No chunks to embed.");
    return;
  }

  // 5. Embed all chunks
  console.log("Embedding chunks with gemini-embedding-001...");
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel("gemini-embedding-001"),
    values: allChunks.map((c) => c.content),
    providerOptions: {
      google: { outputDimensionality: 768 },
    },
  });
  console.log(`Embedded ${embeddings.length} chunks\n`);

  // 6. Clear + insert documents
  console.log("Clearing existing documents...");
  const { error: deleteError } = await supabase
    .from("documents")
    .delete()
    .gte("id", 0);

  if (deleteError) {
    console.error("Failed to clear documents:", deleteError.message);
    process.exit(1);
  }

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

  console.log(
    `\nDone! Synced ${fileEntries.length} files, embedded ${allChunks.length} chunks.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
