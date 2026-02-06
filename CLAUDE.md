# Bio — Personal Portfolio + AI Chat

## Overview

Personal portfolio site with an AI chat interface where visitors explore your professional experience. Single web app (React Router 7 on Vercel) with Supabase backend.

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
- **Backend**: Supabase (auth, DB, pgvector, storage)
- **AI**: Vercel AI SDK v4 + Anthropic Claude
- **Testing**: Vitest
- **Hosting**: Vercel

## Key Files

- `apps/web/app/root.tsx` — Layout shell (nav, main)
- `apps/web/app/routes.ts` — Route definitions
- `apps/web/app/routes/` — Page components
- `apps/web/app/app.css` — Tailwind entry point

## Code Style

- Standard async/await (NO Effect.ts)
- Tailwind utility classes for styling
- `~/` path alias maps to `apps/web/app/`
- Keep components simple and deletable

## Testing Guidelines

Test behavior through public interfaces, NOT implementation details. Use dependency injection. One behavior per test. Arrange-act-assert structure.

Do NOT write tests that: test TypeScript types at runtime, assign-and-read-back, mock the thing being tested, or test private internals.

## Design

Minimal/clean — white space, typography-focused, subtle animations. Think: linear.app, rauno.me. Max-width 3xl, neutral color palette.
