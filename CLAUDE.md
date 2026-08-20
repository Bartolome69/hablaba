# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Hablaba is a Spanish language learning app for B1-level learners. Users chat with a GPT-4o AI tutor that responds in Spanish, corrects grammar mistakes, and provides explanations. The app has a home dashboard (streaks, saved phrases, daily prompts) and a chat interface.

## Commands

All commands run from `/Users/bart/hablaba/`:

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui (New York style)

**Routes**:

Marketing (route group `app/(marketing)/`, full-width):
- `/` — Landing page (hero, how it works, features, audience teasers, FAQ)
- `/for/[slug]` — Programmatic audience pages, content from `lib/marketing/audiences.ts`. Slugs in `audienceSlugs`.

App (under `app/app/`, constrained to `max-w-lg` via its own layout). Bottom
nav is **Today / Charlar / Phrases / Exercises**, plus the gated Grow tab:
- `/app/today` — Today: big Charlar card (resumes the latest thread, or starts one), Grow's published pack phrases, daily prompt, saved-phrase review
- `/app/charla` — Conversations hub: resume cards (expire after 14 days), starters, history
- `/app/charla/[id]` — **A conversation.** Type or talk; see Conversations below
- `/app/charla/historial` — Every conversation
- `/app/speak` — Phrases by routine, with audio
- `/app/exercises` — Grammar quizzes from `lib/exercises/` content packs; `?topic=<taxonomy id>` deep-links straight into that topic's quiz (used by session reviews)
- `/app/practice` and `/app/chat` are **retired** — 301'd to `/app/today` and `/app/charla`. Practice split into Today (the dashboard half) and Charlar (the conversations half); text chat became a conversation thread.

Grow (under `app/grow/`, hidden module, `noindex` — internal codename "Criar", see below):
- `/grow` — Bilingual-parenting module (daily Rioplatense phrase packs, capture, sparring, journal, voice). Reached via a gated tab (`criar_enabled` localStorage flag). `/criar/*` 301-redirects to `/grow/*` via `next.config.mjs`. Cleanly bounded: see `lib/criar/README.md` for boundary rules before importing anything across the module edge in either direction.
- `/grow/voice` (+ `historial/`, `semana/`, `[id]/`) — the module's voice mode: live session, history, weekly report ("Tu semana"), transcript + session review.
- The module is user-facing as **"Grow"** but its internal code — `lib/criar/`, `components/criar/`, type names (`CriarChild`, etc.), localStorage keys (`criar_*`) — keeps the original "Criar" codename. This is deliberate: renaming those too would touch ~15 files and localStorage table keys for a purely cosmetic change. Don't "fix" this mismatch without checking with the user first.

API (all stateless LLM proxies; the client owns persistence):
- `POST /api/chat` — Sends message + conversation history to OpenAI, returns `{ reply, correction? }`
- `POST /api/criar/pack`, `POST /api/criar/sparring` — Grow's pack generation and text sparring
- `POST /api/voice/session` — Mints an ephemeral OpenAI Realtime client secret (60s TTL); model/voice/instructions fixed server-side. Serves both voice surfaces.
- `POST /api/analyze` — Voice transcript in, tagged observations out (root because it imports the exercises taxonomy for tag validation, which Grow must not)
- `POST /api/analyze/weekly` — Weekly-report narrative + taxonomy tag labels
- `POST /api/translate` — One turn of Spanish → English (tap-to-translate)
- `POST /api/tts` — Text-to-speech (optional `register=rioplatense`)
- `POST /api/transcribe` — Speech-to-text (optional `language=auto`)
- `POST /api/waitlist` — `{ email, source, audience?, placement? }`. Adds to Resend audience (if env vars set), captures `waitlist_signup` to PostHog server-side.
- `POST /api/feedback` — Stub, returns 501 (not implemented)

## Conversations (main app)

**A conversation is one entity with two modalities.** `modality: text | voice`
lives on the TURN, so a thread can be typed at the table, escalate to speech on
a walk, and come back to typing — one history, one review. `lib/conversations/`
owns it (`conversations` / `conversation_turns` / `conversation_observations`).

- **Escalation**: the mic button in a thread mints a Realtime session seeded
  with the thread's recent turns (`priorTurns`), so she continues rather than
  greeting you cold. Voice turns append to the same thread with offset ordinals;
  a new spoken stretch clears `analyzedAt` so the review re-runs over everything.
- **Corrections split by modality, deliberately.** Text keeps inline correction
  cards. Voice defers every correction to the post-session review — and
  `/api/analyze` is told that SPOKEN turns are speech-to-text output, so nothing
  orthographic (accents, punctuation, capitalisation, spelling) may be reported
  on them. Don't "improve" that by flagging accents on spoken turns.
- Legacy `hablaba_sessions` + `hablaba_chat_*` and `voice_*` are migrated in on
  first load (`migrateLegacyConversations`, flag-guarded and non-destructive).
- **Grow is NOT unified** — it keeps its own sparring, voice mode and criar_*
  tables behind its module boundary.

## Voice mode

Hands-free spoken conversation (OpenAI Realtime over WebRTC, speech-to-speech)
on two surfaces: `/grow/voice` (Grow; seeds pack phrases + captures, criar_*
tables) and main-app conversations (`/app/charla/[id]`).
Architecture and platform decisions live in `lib/criar/README.md`; the short
version:

- Engine + UI are shared (`lib/voice/`, `components/voice/`); each surface
  binds its own persistence and analysis. `lib/voice/openai-realtime.ts` is
  the only file allowed to know about WebRTC/OpenAI event names.
- **One persona app-wide** (decided with Bart): the same warm Argentine
  partner — voice `marin` — speaks on BOTH surfaces. Don't split the persona
  per surface without asking.
- **Grammar is tú everywhere, full stop.** Voseo is not a mode and there is no
  register switch — one system for the learner to hold, across written content,
  text chat and voice alike. **Dialect** is the separate axis: Rioplatense is a
  *flavour* (vocabulary, warmth, porteño TTS voice) layered on tú grammar,
  selectable per child/profile. `SpanishDialect` in `lib/criar/prompts.ts` is
  where a dialect is added; never reintroduce a grammar flag.
- Post-session analysis (`/api/analyze`) tags observations with
  **exercises-taxonomy topic ids** — the closed vocabulary that makes session
  reviews and the weekly report link into `/app/exercises?topic=…`. Keep tags
  groupable; never free text.
- Primary platform is **Chrome on Android as an installed PWA** (screen-off
  sessions survive; iOS Safari pauses instead). Platform forks live in
  `lib/voice/platform.ts` — never make backgrounding behavior unconditional.

**SEO**: `app/sitemap.ts`, `app/robots.ts`, root `app/opengraph-image.tsx` and per-audience `app/(marketing)/for/[slug]/opengraph-image.tsx` generate dynamic OG images.

**Key files**:
- `lib/conversations/` — the unified conversation entity: store, types, `use-conversation.ts` (text side), `persistence.ts` (voice binding), `analysis.ts`
- `app/api/chat/route.ts` — OpenAI integration for text turns, streams `{ reply, translation, correction }`
- `lib/voice/` — the shared voice engine (adapter, `openai-realtime.ts`, platform forks, session hook)
- `lib/voice-topics.ts` — conversation starters; topic choice doubles as grammar targeting
- `lib/today-highlights.ts` — the published-view contract that lets Today show Grow's pack **without** the main app importing Grow
- `lib/types.ts` — shared types: `Message`, `Correction`, `SavedPhrase`, `DailyPrompt`

**Persistence**: No server database — everything is per-device, table-shaped localStorage designed to map 1:1 to future SQL: `conversations` / `conversation_turns` / `conversation_observations` in `lib/conversations/store.ts` (main app), `criar_*` keys in `lib/criar/store.ts` (Grow). Exercises progress lives in `lib/exercises/store.ts`. The feedback API is a stub.

## Environment

```
OPENAI_API_KEY=               # Required — GPT-4o access
NEXT_PUBLIC_SITE_URL=         # Canonical site URL (e.g. https://hablaba.app). Used in metadata, sitemap, robots.
NEXT_PUBLIC_POSTHOG_KEY=      # Optional — PostHog analytics
NEXT_PUBLIC_POSTHOG_HOST=     # Optional — PostHog ingest host
RESEND_API_KEY=               # Optional — for /api/waitlist; if unset, signups log only
RESEND_AUDIENCE_ID=           # Optional — Resend audience to add waitlist contacts to
```

## Styling

Tailwind CSS 4 with `@tailwindcss/postcss`. CSS variables use OKLch color space, defined in `app/globals.css`. Fonts: DM Sans (body) and Fraunces (headings) via `next/font`.

## Notes

- `next.config.mjs` sets `ignoreBuildErrors: true` for TypeScript — build succeeds even with TS errors
- Path alias `@/` maps to the repo root
- shadcn/ui components live in `components/ui/` and should not be manually edited; use the CLI to add/update them
