# Bio — Product Requirements Document

## Vision

Single-page portfolio with adaptive split layout — portfolio content left, AI chat right (open by default). Visitors explore Patrick's professional experience through expandable widgets and conversational AI. Anonymous visitors only, ephemeral conversations, no auth.

## Stack

- **Framework**: React Router 7 (SSR, Vite)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (DB, pgvector)
- **AI**: Vercel AI SDK v4 + Gemini 2.5 Flash (primary) + Anthropic Claude (fallback)
- **Embeddings**: Google gemini-embedding-001
- **Bot Protection**: Cloudflare Turnstile
- **Email**: Resend
- **Hosting**: Vercel
- **Testing**: Vitest

## Single-Page Layout

### Adaptive Split Layout

Default: chat panel open. Portfolio left, chat right.

```
DESKTOP (chat open — default)           DESKTOP (chat collapsed)
┌────────────────┬─────────────┐        ┌──────────────────────────┐
│  Portfolio      │  Chat       │        │      (centered 3xl)      │
│  (shifts left)  │  panel      │        │                          │
│                 │  ~380px     │        │   Intro                  │
│  Intro          │             │        │   Apps                   │
│  Apps           │  suggested  │        │   Experience             │
│  Experience     │  questions  │        │   Skills                 │
│  Skills         │             │        │                          │
│                 │  [input]    │        │         [💬 reopen chat] │
└────────────────┴─────────────┘        └──────────────────────────┘

MOBILE
┌──────────────────┐
│  Portfolio        │
│  (full width)     │
│                   │
│  Intro            │
│  Apps             │
│  Experience       │
│  Skills           │
│                   │
│  [💬 FAB button]  │  → opens bottom sheet
└──────────────────┘
```

### Portfolio Content (left panel)

Single scrollable page:

- **Intro** — Name, tagline, brief bio. GitHub + LinkedIn icon links.
- **Apps** — Side project showcase (separate from Experience). Expandable widget cards:
  - **Beach League** — card links to live app
  - **GiftWell** — card links to live app
  - Click interaction: opens chat panel + auto-sends "Tell me about [project]"
- **Experience** — C3.ai timeline: FDE → Senior FDE → Manager, FDE. Details populated from content files.
- **Skills / Tech Stack** — Visual tags/pills on the page.

### Chat Panel (right panel, ~380px)

- Open by default on desktop
- Collapsible — content reflows to centered max-w-3xl when closed
- Smooth CSS slide transition
- **Ephemeral** — fresh conversation each page load, no DB storage
- **No chat bubbles** — clean typography:
  - User messages: right-aligned, no bubble background
  - AI responses: left-aligned, rich markdown
- **No citations / cross-panel linking**
- Suggested question chips: 3 static starters + dynamic follow-ups after each AI response (see Dynamic Follow-Up Suggestions)
- Typing indicator: subtle shimmer
- **Input**: Multiline auto-expanding textarea. Enter to send, Shift+Enter for newline. Max ~500 chars.

### Mobile

- Portfolio content full-width
- FAB (bottom-right) opens chat as bottom sheet
- Bottom sheet: swipe up half/full, swipe down to dismiss

## Content Directory

```
content/
├── bio.md              # Personal intro, values, what drives me
├── experience.md       # C3.ai timeline, role details, responsibilities
├── projects/
│   ├── beach-league.md # Beach League details
│   └── giftwell.md     # GiftWell details
├── skills.md           # Tech stack, languages, frameworks
├── interview.md        # Q&A about career, motivations, differentiators
└── meta.md             # Tone, style, boundaries for AI responses
```

**Pipeline**: `pnpm sync-content` — chunks + embeds via `gemini-embedding-001` (768 dims) → Supabase pgvector. Manual run before deploy when content changes.

**Chunking**: 2000 chars (~500 tokens) per chunk. Splits on `##` headers first; oversized sections get paragraph-boundary splits with last-paragraph overlap. Top-10 retrieval per query (similarity threshold 0.3).

### Content Privacy & Versioning

`content/` is a **separate local-only git repo**, gitignored from the main repo. Keeps raw interview answers private from GitHub.

- Every `pnpm sync-content` run auto-commits content changes with an ISO timestamp
- CLI: `pnpm content-versions` — subcommands: `log` (default), `diff [hash]`, `show <hash>`, `restore <hash>`
- Supabase `raw_content` table is the deployed source of truth

### Content Sync Pipeline

`pnpm sync-content` — manual 3-phase script:

1. **Auto-commit**: Detects content/ changes, commits to local content/ git repo with timestamp
2. **Upload**: Upserts all `.md` files → Supabase `raw_content` table (keyed by path)
3. **Chunk + Embed**: Chunks files → `gemini-embedding-001` embeddings → Supabase `documents` table (clear + reinsert)

`meta.md` is stored in `raw_content` but **not embedded** — used as system prompt base only.

Requires: `SUPABASE_SERVICE_ROLE_KEY` + `GOOGLE_GENERATIVE_AI_API_KEY`.

### Build-Time Content Download

`download-content.ts` runs before `react-router build` (configured in package.json build script).

- Downloads from Supabase `raw_content` → recreates `content/` directory
- Needed for Vercel CI where `content/` doesn't exist (gitignored)
- Skips if `content/` already has `.md` files (local dev)

### Inline Content Fallback

All `content/*.md` files are imported via Vite `?raw` imports in the chat route. When Supabase/embeddings are unavailable, content is inlined directly into the system prompt. Graceful degradation — chat works even without RAG.

## AI Chat Architecture

```
User sends message
  → Cloudflare Turnstile token validation (server-side)
  → Server-side heuristics check (rate, length, dedup)
  → React Router action
  → Vercel AI SDK streamText()
  → Supabase pgvector: retrieve relevant content chunks (RAG)
  → Gemini 2.5 Flash (primary) or Anthropic Claude (fallback)
    system prompt + retrieved context + user message
  → Stream response back to client
```

**Provider strategy**: `@ai-sdk/google` with Gemini 2.5 Flash primary. Fall back to `@ai-sdk/anthropic` Claude on error/timeout (10s timeout triggers fallback). Google context caching on system prompt + RAG context to reduce per-request token cost. Fallback is transparent to user — no "switching providers" message.

**Auth**: Anonymous visitors only. No sign-in.

## Bot Protection & Rate Limiting

| Layer | Mechanism                 | Detail                                                                          |
| ----- | ------------------------- | ------------------------------------------------------------------------------- |
| 1     | Cloudflare Turnstile      | Invisible CAPTCHA (free). Validate token server-side before LLM call.           |
| 2     | Server-side heuristics    | Min 2s between messages. Max ~500 chars. Reject duplicate consecutive messages. |
| 3     | Sliding window rate limit | ~50 messages/hour per session+IP (valid Turnstile token required).              |
| 4     | API spend caps            | Hard limits on Google AI + Anthropic dashboards.                                |

**Rate limit storage**: Supabase table (simple, already in stack).

**Session tracking**: Cookie-based session ID (set on first visit) + IP.

## Contact Form

Modal triggered from portfolio or via `[contact-form]` marker in AI responses (configured in `meta.md`).

- **Fields**: name (optional), company (optional), jobTitle (optional), email (required), message (required, max 2000 chars)
- **Dual write**: Supabase `contact_messages` table + Resend email notification (fire-and-forget)
- **Rate limit**: 3/hour per IP, Turnstile-protected
- **Hiring-focused**: Fields oriented toward recruiters/hiring managers

## Dynamic Follow-Up Suggestions

`/api/suggestions` endpoint — Gemini 2.5 Flash structured output picks 3 from a 77-question pool.

- **Selection rules**: one deeper on current topic, one pivot to undiscussed topic, one generally interesting
- **Timing**: Fires after each AI response (parallel with chat stream)
- **Fallback**: Client-side static chips if API fails
- **Pool**: Curated questions in `app/data/suggestions.ts`

## Design

Minimal/clean. White space, typography-focused. References: linear.app, rauno.me. Neutral color palette.

- **Font**: Geist Sans (primary), system stack fallback
- **Colors**: Tailwind neutral scale (`neutral-50` through `neutral-950`). Light: white bg, neutral-900 text. Dark: neutral-950 bg, neutral-50 text. Chat panel: subtle offset bg (neutral-50 light / neutral-900 dark).
- **Dark mode**: Toggle in nav. System preference (`prefers-color-scheme`) as default.
- **Animations**: Subtle fade-in on page load. Smooth scroll. Chat panel slide transition. No section reveals, no parallax.
- **Experience timeline**: Simple list with dates and role progression (not a visual timeline with dots/lines)
- **Skills pills**: Grouped by category (languages, frameworks, tools, platforms). Same neutral style, no color coding.
- **App cards**: Icon/emoji + title + short description. Expandable to show tech stack + link to live app.
- **Error states**: Generic "Something went wrong — try again" if both AI providers fail. No technical details exposed.
- **Empty chat state**: Suggested question chips + brief welcome line ("Ask me anything about Patrick's work")
- **Conversation cap**: No hard cap. Natural conversation length.
- **Mobile chat history**: Bottom sheet preserves prior messages from same session.

## Phases

### Phase 1: Foundation

- [ ] Tear down multi-route scaffold (remove `/experience`, `/projects`, `/chat` routes + nav bar)
- [ ] Adaptive split layout shell (single route)
- [ ] Chat panel component (collapsible, slide transition, responsive)
- [ ] Portfolio sections: Intro (with GitHub/LinkedIn), Apps, Experience, Skills (placeholder content)
- [ ] Mobile bottom sheet for chat
- [ ] Dark mode toggle + system preference detection
- [ ] Supabase client (SSR with `@supabase/ssr`)
- [ ] Deploy skeleton to Vercel

### Phase 2: Content

- [ ] Create `content/` directory with markdown files
- [ ] Interview → populate content files
- [ ] Expandable app cards (Beach League, GiftWell) with live links
- [ ] App card click → open chat + auto-send "Tell me about [project]"
- [ ] Experience timeline component (C3.ai role progression)
- [ ] Skills/tech stack visual tags/pills

### Phase 3: AI Chat

- [ ] Add `@ai-sdk/google`, configure Gemini 2.5 Flash primary provider
- [ ] Configure `@ai-sdk/anthropic` as fallback
- [ ] Supabase `documents` table (pgvector)
- [ ] Embedding pipeline: markdown → chunks → gemini-embedding-001 → pgvector
- [ ] Vercel AI SDK route handler with streaming
- [ ] Chat UI: message list, auto-expanding textarea, shimmer indicator
- [ ] Suggested question chips (static initial + dynamic follow-ups)
- [ ] System prompt + `content/meta.md`
- [ ] Google context caching for system prompt + RAG context
- [ ] Cloudflare Turnstile (client widget + server validation)
- [ ] Server-side heuristics (2s delay, 500 char limit, dedup)
- [ ] Sliding window rate limit (~50 msg/hr per session+IP)
- [ ] API spend caps on provider dashboards
- [ ] Contact form modal + Supabase + Resend integration
- [ ] Dynamic follow-up suggestions endpoint
- [ ] Content sync pipeline (`sync-content`, `download-content`, `content-versions`)
- [ ] Inline content fallback via `?raw` imports

### Phase 4: Polish & Ship

- [ ] SEO: meta tags, Open Graph, structured data
- [ ] Performance: Lighthouse audit, image optimization
- [ ] Accessibility: keyboard nav, screen reader, contrast (both themes)
- [ ] Favicon + OG image
- [ ] Production deploy + custom domain

## Profile

- **GitHub**: github.com/pschwagler
- **LinkedIn**: linkedin.com/in/pschwagler
- **Page title**: "Patrick Schwagler" with rotating subtitle cycling through: Forward Deployed Engineer, Software Engineer, Engineering Manager, AI Engineer
- **Tagline**: "Builder. Engineer. Leader."

## Open Questions

- **Custom domain**: TBD before Phase 4
- **Beach League + GiftWell live URLs**: Needed for Phase 2 app cards
