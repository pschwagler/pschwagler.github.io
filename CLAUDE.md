# Bio — Personal Portfolio + AI Chat

## Overview

Single-page portfolio with adaptive split layout — portfolio content on the left, AI chat panel on the right (open by default). Visitors explore Patrick's professional experience through expandable widgets and conversational AI. Single web app (React Router 7 on Vercel) with Supabase backend.

## Commands

```bash
npm run dev          # Start dev server (apps/web)
npm run build        # Build all packages
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint
npm run test         # Vitest
npm run test:watch   # Watch mode
```

## Feedback Loops

ALWAYS run before committing:

```bash
npm run lint && npm run typecheck && npm run test
```

Pre-commit hook runs these via Husky.

## Architecture

- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: React Router 7 (SSR, Vite)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (DB, pgvector)
- **AI**: Vercel AI SDK v4 + Gemini 2.5 Flash (primary) + Anthropic Claude (fallback)
- **Testing**: Vitest
- **Hosting**: Vercel

## Key Files

- `apps/web/app/root.tsx` — HTML shell, global providers
- `apps/web/app/routes.ts` — Single route definition
- `apps/web/app/routes/home.tsx` — Main page (adaptive split layout)
- `apps/web/app/app.css` — Tailwind entry point
- `content/` — Markdown content for RAG (bio, experience, projects, interview)

## Code Style

- Standard async/await (NO Effect.ts)
- Tailwind utility classes for styling
- `~/` path alias maps to `apps/web/app/`
- Keep components simple and deletable

## Testing Guidelines

Test behavior through public interfaces, NOT implementation details. Use dependency injection. One behavior per test. Arrange-act-assert structure.

Do NOT write tests that: test TypeScript types at runtime, assign-and-read-back, mock the thing being tested, or test private internals.

## Design

Minimal/clean — white space, typography-focused, subtle purposeful animations. Think: linear.app, rauno.me. Neutral color palette. Adaptive split layout: content left + chat right (default open), collapses to centered max-w-3xl. No chat bubbles — clean typography, inline citations. Mobile: bottom sheet for chat.
