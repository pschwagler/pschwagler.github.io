# Architecture & Data Flow Guide

## High-Level Overview

**Bio** is a personal portfolio application featuring a unique "adaptive split layout" where a portfolio resides on the left and an AI-powered chat assistant resides on the right.

### Core Tech Stack

- **Monorepo**: Managed by **Turborepo** and **pnpm**.
- **Frontend**: **React Router 7** (formerly Remix) handling SSR and routing.
- **Styling**: **Tailwind CSS v4** for utility-first styling.
- **Backend/Database**: **Supabase** (PostgreSQL) mostly used for storing vector embeddings and raw content for the AI.
- **AI**: **Vercel AI SDK** orchestrating interactions with **Google Gemini 2.5 Flash** (primary) and **Anthropic Claude 3.5 Sonnet** (fallback).
- **RAG (Retrieval-Augmented Generation)**: Uses **pgvector** in Supabase to store content text embeddings.

---

## Data Flow & Architecture

### 1. Frontend & Routing (`apps/web`)

The application is built with React Router 7.

- **Entry Point**: `app/root.tsx` defines the HTML shell and global providers.
- **Routes** (`app/routes.ts`):
  - `/`: Maps to `app/routes/home.tsx`, the main single-page interface.
  - `/api/chat`: Maps to `app/routes/api.chat.ts`, the server-side endpoint for AI chat.
  - `/api/contact`: Handles contact form submissions.

### 2. The AI Chat Pipeline (`/api/chat`)

When a user sends a message, the data flows as follows:

1.  **Request Receival**: The `action` in `api.chat.ts` receives the message history and a Turnstile token.
2.  **Protection & Validation**:
    - **Turnstile**: Verifies the user is human (`lib/turnstile.server.ts`).
    - **Heuristics**: Checks for rate limits (IP-based sliding window), message length, and duplicates.
3.  **Retrieval (RAG)**:
    - The user's latest message is embedded using **Google Gemini Embedding** model.
    - The server queries Supabase (`rpc('match_documents')`) to find the most relevant content chunks (from `content/` markdown files).
    - **Fallback**: If retrieval fails, the system falls back to a hardcoded "Inline Content" block to ensure the AI still has context.
4.  **System Prompt Construction**:
    - The AI is given a system prompt containing "Identity" (from `content/meta.md`) + "Retrieved Context".
5.  **Response Generation**:
    - **Primary**: Tries to stream a response using **Gemini 2.5 Flash**.
    - **Fallback**: If Gemini fails (error or timeout), it transparently switches to **Claude 3.5 Sonnet** so the user doesn't experience an interruption.
    - The response is streamed back to the client using **Vercel AI SDK** (`streamText`).

### 3. Content Ingestion Pipeline (`apps/web/scripts`)

The portfolio content is managed in Markdown files (`/content`). A simplified ETL (Extract, Transform, Load) pipeline syncs this to the database.

**Script**: `pnpm sync-content` (runs `apps/web/scripts/sync-content.ts`)

1.  **Extract**: Reads all `.md` files from `content/`.
2.  **Version Control**: Auto-commits changes to a local git repo within `content/`.
3.  **Load Raw**: Upserts raw file content into Supabase `raw_content` table.
4.  **Transform (Chunking)**: Splits markdown into smaller chunks (via `app/lib/chunker.ts`).
5.  **Embed**: Generates vector embeddings for each chunk using Google's embedding model.
6.  **Load Vectors**: Clears and repopulates the `documents` table in Supabase with the new chunks and embeddings.

---

## Key Libraries & Purpose

| Library                       | Purpose                                                              |
| :---------------------------- | :------------------------------------------------------------------- |
| **react-router**              | Framework for routing, SSR, and data loading (actions/loaders).      |
| **@ai-sdk/google**            | specialized provider for Gemini models (chat & embeddings).          |
| **@ai-sdk/anthropic**         | specialized provider for Claude models (fallback chat).              |
| **ai** (Vercel AI SDK)        | Core library for streaming AI responses and managing chat state.     |
| **@supabase/supabase-js**     | Client for interacting with the Supabase database and RPC functions. |
| **tailwindcss**               | Styling engine (v4 is used here, offering a simplified setup).       |
| **@marsidev/react-turnstile** | React component for Cloudflare Turnstile (bot protection).           |
| **vitest**                    | Testing framework for unit and integration tests.                    |

## File Structure Highlights

```
/
├── apps/web/               # Main application
│   ├── app/
│   │   ├── routes/         # Route modules (home, api)
│   │   ├── lib/            # Server-side logic (retrieval, database, turnstile)
│   │   └── components/     # React components
│   └── scripts/            # ETL scripts for content
├── content/                # Source of truth for portfolio data (Markdown)
├── supabase/               # Database migrations and config
└── turbo.json              # Monorepo build pipeline config
```
