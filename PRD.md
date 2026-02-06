# Bio — Product Requirements Document

## Vision

Single-page portfolio site with an integrated AI chat panel. Visitors land on an adaptive split layout — portfolio content on the left, AI chat on the right (open by default). The AI answers questions about Patrick's career, skills, and projects using RAG over curated content.

## Stack

- **Framework**: React Router 7 (SSR, Vite)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (DB, pgvector, storage)
- **AI**: Vercel AI SDK v4 + Anthropic Claude
- **Hosting**: Vercel
- **Testing**: Vitest

## Single-Page Layout

### Adaptive Split Layout

Default state: chat panel open. Portfolio content on the left, chat on the right.

```
DESKTOP (chat open — default)           DESKTOP (chat collapsed)
┌────────────────┬─────────────┐        ┌──────────────────────────┐
│  Portfolio      │  Chat       │        │      (centered 3xl)      │
│  (shifts left)  │  panel      │        │                          │
│                 │  ~380px     │        │   Intro                  │
│  Intro          │             │        │   Projects [expandable]  │
│  Projects       │  suggested  │        │   Experience             │
│  Experience     │  questions  │        │                          │
│                 │             │        │         [💬 reopen chat] │
│                 │  [input]    │        │                          │
└────────────────┴─────────────┘        └──────────────────────────┘

MOBILE
┌──────────────────┐
│  Portfolio        │
│  (full width)     │
│                   │
│  Intro            │
│  Projects         │
│  Experience       │
│                   │
│  [💬 FAB button]  │  → opens bottom sheet (half/full screen)
└──────────────────┘
```

### Portfolio Content (left panel)

Single scrollable page with sections:

- **Intro** — Name, tagline, brief bio
- **Projects** — Expandable cards (summary → detail on click)
- **Experience** — Work history timeline (C3.ai: FDE → Senior FDE → Manager, FDE)

### Chat Panel (right panel, ~380px)

- Open by default on desktop
- Collapsible — content reflows to centered max-w-3xl when closed
- Smooth CSS transition between states
- **No chat bubbles** — clean typography:
  - User messages: right-aligned, no bubble background
  - AI responses: left-aligned, rich markdown/cards
  - Citations: inline links that scroll the portfolio panel to referenced sections
- Suggested question chips: "What did Patrick build at C3?" / "What's his tech stack?"
- Typing indicator: subtle shimmer, not bouncing dots
- Context-aware: suggested questions adapt to user's scroll position

### Mobile

- Portfolio content full-width
- Floating action button (bottom-right) opens chat as bottom sheet
- Bottom sheet: swipe up to half-screen or full-screen, swipe down to dismiss

## Content Directory

```
content/
├── bio.md              # Personal intro, values, what drives me
├── experience.md       # C3.ai timeline, role details, responsibilities
├── projects/
│   ├── project-1.md    # Individual project details
│   └── ...
├── skills.md           # Tech stack, languages, frameworks
├── interview.md        # Q&A about career, motivations, what makes me different
└── meta.md             # How to talk about Patrick (tone, style, boundaries)
```

**Pipeline**: `content/*.md` → chunk → embed → Supabase pgvector. Rebuild on deploy or via script.

## AI Chat Architecture

```
User question
  → React Router action
  → Vercel AI SDK streamText()
  → Supabase pgvector: retrieve relevant content chunks (RAG)
  → Anthropic Claude: system prompt + retrieved context + user message
  → Stream response back to client
  → Save conversation to Supabase messages table
```

**Auth**: Anonymous visitors only. No sign-in.

**Rate limiting**: IP-based, ~20 messages/hour per visitor.

## Design

Minimal/clean. White space, typography-focused, subtle purposeful animations. References: linear.app, rauno.me. Neutral color palette. No chrome/widget feel — chat is native to the layout.

## Phases

### Phase 1: Clean Slate ✅

- [x] Delete AI Interviewer code
- [x] Swap dependencies (Supabase, AI SDK, Tailwind)
- [x] Rewrite CLAUDE.md
- [x] Scaffold skeleton routes
- [x] Verify all gates pass

### Phase 2: Foundation

- [ ] Implement adaptive split layout shell (single route)
- [ ] Chat panel component (collapsible, responsive)
- [ ] Portfolio content sections (intro, projects, experience)
- [ ] Mobile bottom sheet for chat
- [ ] Configure Supabase client (SSR with `@supabase/ssr`)
- [ ] Deploy skeleton to Vercel

### Phase 3: Content

- [ ] Create `content/` directory with markdown files
- [ ] Interview process → populate content files
- [ ] Build expandable project cards
- [ ] Experience timeline component
- [ ] Responsive design + dark mode

### Phase 4: AI Chat

- [ ] Supabase tables: `documents` (pgvector), `conversations`, `messages`
- [ ] Content embedding pipeline (markdown → chunks → embeddings → pgvector)
- [ ] Vercel AI SDK route handler with streaming
- [ ] Chat UI (message list, input, streaming indicator, suggested questions)
- [ ] System prompt with professional context + `content/meta.md`
- [ ] Cross-panel citations (AI references → scroll portfolio)
- [ ] Rate limiting + error handling

### Phase 5: Polish & Ship

- [ ] SEO: meta tags, Open Graph, structured data
- [ ] Performance: lighthouse audit, image optimization
- [ ] Accessibility: keyboard nav, screen reader, contrast
- [ ] Production deploy + custom domain
