# Bio — Product Requirements Document

## Vision

Single-page portfolio with adaptive split layout — portfolio content left, AI chat right (open by default). Visitors explore Patrick's professional experience through expandable widgets and conversational AI. Anonymous visitors only, ephemeral conversations, no auth.

## Stack

- **Framework**: React Router 7 (SSR, Vite)
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (DB, pgvector)
- **AI**: Vercel AI SDK v4 + Gemini 2.5 Flash (primary) + Anthropic Claude (fallback)
- **Embeddings**: Google text-embedding-004
- **Bot Protection**: Cloudflare Turnstile
- **Analytics**: Vercel Analytics
- **Error Monitoring**: Sentry (free tier)
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
- Suggested question chips: 3–4 static starters (e.g., "What did Patrick build at C3?", "What's his tech stack?", "Tell me about Beach League")
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

**Pipeline**: `content/*.md` → chunk → embed via Google text-embedding-004 → Supabase pgvector. Rebuild via manual script (run before deploy when content changes).

**Chunking**: ~500 tokens per chunk, 50-token overlap. Top-5 retrieval per query.

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

## Analytics

Vercel Analytics (built-in, privacy-friendly).

## Observability & Alerting

**Sentry** (free tier) for error monitoring. No PII captured — all visitors are anonymous with ephemeral sessions.

- **SDK**: `@sentry/react-router` (covers both client React and server-side React Router 7)
- **What to capture**:
  - Runtime errors — automatic via Sentry SDK integration
  - AI provider fallback events — custom breadcrumb when Gemini fails and Anthropic takes over
  - Both-providers-down errors — `Sentry.captureException()` on the existing catch-all error path
  - Supabase connection failures — captured automatically as unhandled errors
- **Alerts**: Email alerts on error spikes (Sentry default alert rules)
- **Source maps**: Automatic via Sentry's Vercel integration (connects at deploy time)
- **Privacy**: No user data captured. No session replay. Anonymous visitors only, ephemeral conversations.

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
- [ ] Vercel Analytics
- [ ] Sentry project setup + SDK integration (client + server)

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
- [ ] Embedding pipeline: markdown → chunks → Google text-embedding-004 → pgvector
- [ ] Vercel AI SDK route handler with streaming
- [ ] Chat UI: message list, auto-expanding textarea, shimmer indicator
- [ ] Static suggested question chips
- [ ] System prompt + `content/meta.md`
- [ ] Google context caching for system prompt + RAG context
- [ ] Cloudflare Turnstile (client widget + server validation)
- [ ] Server-side heuristics (2s delay, 500 char limit, dedup)
- [ ] Sliding window rate limit (~50 msg/hr per session+IP)
- [ ] API spend caps on provider dashboards
- [ ] Sentry breadcrumbs for AI provider fallback events

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
- **Suggested question chips**: Current examples ("What did Patrick build at C3?", "What's his tech stack?", "Tell me about Beach League") — finalize during Phase 2
