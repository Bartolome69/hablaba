# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Hablaba is a Spanish language learning app for B1-level learners — built around
one loop: **conversations produce observations and phrase usage → observations
and phrases seed the next conversation.** Every surface is a slice of that loop.

Domain model:
- **Conversation** — the core object; turns carry `modality: text | voice`
- **Observation** — derived from a conversation by the analysis pass
- **Phrase** — one library (`lib/phrases/`): text, translation, moment, source
  (captured | saved | generated), state (nueva → practicando → usada), timesUsed
- **Word** — the vocabulary list (`lib/vocab/`): spanish, article, gender,
  english, set, source (catalogo | propia), plus a Leitner box and dueAt. A peer
  of Phrase, not a subset: say vs. name, and progress is a review schedule
  rather than a conversation-driven state machine
- **Profile** — dialect, correction style, child (`lib/profile/`)
- **Exercise topic** — grammar drills; the one spine not derived from conversations

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
nav is **Today / Charlar / Phrases / Palabras / Exercises**:
- `/app/today` — Today: big Charlar card (resumes the latest thread, or starts one), phrases due today, daily prompt, saved-phrase review
- `/app/charla` — Conversations hub: resume cards (expire after 14 days), starters, history
- `/app/charla/[id]` — **A conversation.** Type or talk; see Conversations below
- `/app/charla/historial` — Every conversation
- `/app/speak` — Phrases: capture, the moment pack (a live query over the library), routine browsing with audio
- `/app/palabras` — Palabras: the vocabulary surface. A tappable body diagram, authored sets (el cuerpo / los animales / la comida), your own words (type English, get the Spanish), and a spaced-repetition review. A deck holds only what's DUE (Leitner ladder, `lib/vocab/schedule.ts`); when nothing is due the screen says "Estás al día" rather than nagging. See `lib/vocab/README.md`
- `/app/semana` — "Tu semana": the 7-day report over all conversations
- `/app/exercises` — Grammar quizzes from `lib/exercises/` content packs; `?topic=<taxonomy id>` deep-links straight into that topic's quiz (used by session reviews)
- `/app/practice` and `/app/chat` are **retired** — 301'd to `/app/today` and `/app/charla`. Practice split into Today (the dashboard half) and Charlar (the conversations half); text chat became a conversation thread.

**The Grow module is retired (IA restructure, Aug 2026).** Its boundary existed
to keep future extraction cheap; we aren't extracting it, so it collapsed into
the unified stores: `criar_sparring_sessions` → conversations (text turns),
`criar_voice_*` → conversations (voice turns), `criar_packs`/`criar_captures` →
phrases, `criar_children` → profile. `migrateGrowCollapse` in `lib/migrations.ts`
is flag-guarded and non-destructive (legacy `criar_*` keys are read, never
cleared). `/grow/*` and `/criar/*` 301 to the unified surfaces. Do not
reintroduce a Grow module or the `criar_` prefix.

API (all stateless LLM proxies; the client owns persistence):
- `POST /api/chat` — Sends message + conversation history to OpenAI, returns `{ reply, correction? }`
- `POST /api/voice/session` — Mints an ephemeral OpenAI Realtime client secret (60s TTL); model/voice/instructions fixed server-side. Serves both voice surfaces.
- `POST /api/phrases/generate` — Phrase generation: capture mode (real-life gap → the natural phrase, immediately) and moment mode (fill a moment's pack only when the library runs short)
- `POST /api/analyze` — Conversation transcript in, tagged observations out (imports the exercises taxonomy for tag validation)
- `POST /api/analyze/weekly` — Weekly-report narrative + taxonomy tag labels
- `POST /api/translate` — One turn of Spanish → English (tap-to-translate)
- `POST /api/vocab/translate` — One English word → the Spanish, with **article and gender as fields** (the part a B1 learner gets wrong), plus an example sentence. The en→es counterpart to the above
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
- Legacy stores are migrated in on first load via `runMigrations()`
  (`lib/migrations.ts`) — flag-guarded and non-destructive: `hablaba_sessions` +
  `hablaba_chat_*`, `voice_*`, and the whole `criar_*` family. Legacy keys are
  read, never cleared.

## Voice mode

Hands-free spoken conversation (OpenAI Realtime over WebRTC, speech-to-speech)
inside conversations (`/app/charla/[id]`). The short version:

- Engine + UI live in `lib/voice/` + `components/voice/`; conversations bind
  persistence via `lib/conversations/persistence.ts`. `lib/voice/openai-realtime.ts`
  is the only file allowed to know about WebRTC/OpenAI event names.
- **One persona app-wide** (decided with Bart): the same warm Argentine
  partner. Don't split the persona per surface without asking.
- **One voice set, both engines.** `lib/voices.ts` is the whole catalogue, and
  every id in it is valid on BOTH `gpt-4o-mini-tts` and `gpt-realtime` (alloy,
  ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar). Adding a voice
  only one engine supports re-splits the app, which is the bug this replaced:
  TTS read this file while `/api/voice/session` had `marin` hardcoded, so the
  speaker button and voice mode were different people. Both now resolve the
  learner's `hablaba_voice` preference through `resolveVoiceId`, server-side.
  Default is `marin` ("Elena"). Legacy ids (nova, onyx, fable) are migrated on
  read — Realtime cannot speak them at all.
- **Read-aloud is opt-in** (`hablaba_read_aloud`, off by default): text chat
  speaks her replies only if the parent asked for it. Sound is something you
  request, never something that happens to you on a bus. Voice mode is
  unaffected — it speaks either way.
- **Grammar is tú everywhere, full stop.** Voseo is not a mode and there is no
  register switch — one system for the learner to hold, across written content,
  text chat and voice alike. **Dialect** is the separate axis: Rioplatense is a
  *flavour* (vocabulary, warmth, porteño TTS voice) layered on tú grammar,
  selectable in the profile. `SpanishDialect` lives in `lib/profile/store.ts`,
  the dialect flavour blocks in `lib/voice/prompts.ts`; never reintroduce a
  grammar flag. The rule governs the Spanish being **taught** — content packs,
  vocabulary sets, chat and voice. The app's own UI chrome ("Tocá", "Probá de
  nuevo", "Repasá tus palabras") is porteño and does use voseo; that split is
  deliberate, so don't "fix" either side into the other.
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
- `lib/types.ts` — shared types: `Message`, `Correction`, `SavedPhrase`, `DailyPrompt`

**Persistence**: No server database — everything is per-device, table-shaped localStorage designed to map 1:1 to future SQL: `conversations` / `conversation_turns` / `conversation_observations` (`lib/conversations/store.ts`), `phrases` (`lib/phrases/store.ts`), `vocab_words` (`lib/vocab/store.ts`), `profile` (`lib/profile/store.ts`). Exercises progress lives in `lib/exercises/store.ts`. The feedback API is a stub.

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

Tailwind CSS 4 with `@tailwindcss/postcss`. The visual system is **Clay + calm**
(Aug 2026 handoff — see `DESIGN.md`): fixed hex palette (cream bg `#F8F3EB`,
forest ink `#1E3D2C`, green `#1B5A2E`, terracotta `#C4633E` as a one-per-screen
spot colour), press-physics utilities (`clay-card`, `clay-green`,
`clay-recessed`…) and motion keyframes defined in `app/globals.css`. Fonts:
Outfit (UI) and Newsreader (display + all Spanish phrase text) via `next/font`.
Icons are the bespoke duotone set in `components/icons.tsx` — no emoji, no
icon libraries on app surfaces.

## Notes

- `next.config.mjs` sets `ignoreBuildErrors: true` for TypeScript — build succeeds even with TS errors
- Path alias `@/` maps to the repo root
- shadcn/ui components live in `components/ui/` and should not be manually edited; use the CLI to add/update them
