#!/usr/bin/env node

/**
 * Downloads content from Supabase raw_content table → content/ directory.
 * Used at Vercel build time so ?raw imports resolve.
 *
 * Skips silently if SUPABASE_SERVICE_ROLE_KEY is not set (local dev with local files).
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const CONTENT_DIR = join(import.meta.dirname, "../../../content");

// Skip if content/ already exists locally (local dev / already downloaded)
if (existsSync(CONTENT_DIR)) {
  const hasFiles = readdirSync(CONTENT_DIR).some((f) => f.endsWith(".md"));
  if (hasFiles) {
    console.log("content/ exists locally — skipping download");
    process.exit(0);
  }
}

// Load .env if present
try {
  const envPath = join(import.meta.dirname, "../.env");
  const { readFileSync } = await import("node:fs");
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1 || line.startsWith("#")) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (key) process.env[key] ??= value;
  }
} catch {
  // No .env file
}

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log("No Supabase credentials — skipping content download");
  process.exit(0);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from("raw_content")
  .select("path, content");

if (error) {
  console.error("Failed to fetch raw_content:", error.message);
  process.exit(1);
}

if (!data || data.length === 0) {
  console.error("raw_content table is empty — cannot build without content");
  process.exit(1);
}

for (const row of data) {
  const filePath = join(CONTENT_DIR, row.path);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, row.content);
}

console.log(`Downloaded ${data.length} content files from Supabase`);
