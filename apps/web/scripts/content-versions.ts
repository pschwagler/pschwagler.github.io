#!/usr/bin/env node

/**
 * View content version history (git-based).
 *
 * Usage:
 *   pnpm content-versions                  — show commit log
 *   pnpm content-versions diff             — show diff of last sync
 *   pnpm content-versions diff <hash>      — show diff for a specific commit
 *   pnpm content-versions show <hash>      — show files at a specific commit
 *   pnpm content-versions restore <hash>   — restore content to a specific commit
 */

import { execSync } from "node:child_process";
import { join } from "node:path";

const CONTENT_DIR = join(import.meta.dirname, "../../../content");

function git(args: string): string {
  return execSync(`git ${args}`, { cwd: CONTENT_DIR, encoding: "utf-8" });
}

const [cmd, arg] = process.argv.slice(2);

switch (cmd) {
  case undefined:
  case "log":
    console.log(git("log --oneline --decorate"));
    break;

  case "diff":
    console.log(git(`diff ${arg ?? "HEAD~1"} ${arg ? "HEAD" : ""}`));
    break;

  case "show":
    if (!arg) {
      console.error("Usage: pnpm content-versions show <commit-hash>");
      process.exit(1);
    }
    console.log(git(`show --stat ${arg}`));
    break;

  case "restore":
    if (!arg) {
      console.error("Usage: pnpm content-versions restore <commit-hash>");
      process.exit(1);
    }
    git(`checkout ${arg} -- .`);
    console.log(`Restored content to ${arg}`);
    console.log("Run `pnpm sync-content` to push to Supabase.");
    break;

  default:
    console.log("Usage:");
    console.log("  pnpm content-versions              — show commit log");
    console.log("  pnpm content-versions diff          — diff of last sync");
    console.log("  pnpm content-versions diff <hash>   — diff for a commit");
    console.log("  pnpm content-versions show <hash>   — files at a commit");
    console.log("  pnpm content-versions restore <hash> — restore a version");
}
