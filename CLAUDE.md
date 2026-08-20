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

App (under `app/app/`, constrained to `max-w-lg` via its own layout):
- `/app/practice` — Dashboard with practice mode selector, daily prompt, saved phrases, session resume
- `/app/speak` — Speak/routine view; entry card into `/app/charla`
- `/app/chat` — Chat interface, takes `?mode=solo|together` query param
- `/app/exercises` — Grammar quizzes from `lib/exercises/` content packs; `?topic=<taxonomy id>` deep-links straight into that topic's quiz (used by voice session reviews)
- `/app/charla` (+ `historial/`, `[id]/`) — Hands-free voice conversation (see Voice mode below)
- Legacy `/practice`, `/speak`, `/chat` paths 301-redirect to `/app/*` via `next.config.mjs`.

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

## Voice mode

Hands-free spoken conversation (OpenAI Realtime over WebRTC, speech-to-speech)
on two surfaces: `/grow/voice` (Grow; seeds pack phrases + captures, criar_*
tables) and `/app/charla` (main app; child-free topics, voice_* tables).
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
- `hooks/use-chat.ts` — All chat state: messages array, loading, conversation history ref, correction attachment
- `app/api/chat/route.ts` — OpenAI integration. Uses `openai.responses.create()` with `gpt-4o`, enforces JSON output (`{ reply, correction }`)
- `lib/types.ts` — All shared types: `Message`, `Correction`, `Session`, `SavedPhrase`, `DailyPrompt`
- `lib/data.ts` — Mock data only; no database exists yet
- `lib/api.ts` — Client-side fetch wrappers

**Data flow**: `ChatInput` → `use-chat.ts` → `lib/api.ts` → `/api/chat` → OpenAI → response parsed and attached to message history

**Persistence**: No server database — everything is per-device, table-shaped localStorage designed to map 1:1 to future SQL: `criar_*` keys in `lib/criar/store.ts` (Grow: children, packs, captures, sparring + voice sessions/turns/observations) and `voice_*` keys in `lib/voice/store.ts` (main-app voice). Exercises progress lives in `lib/exercises/store.ts`. The chat/practice surfaces remain in-memory; the feedback API is a stub.

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
