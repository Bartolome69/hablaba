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
- `/app/speak` — Speak/routine view
- `/app/chat` — Chat interface, takes `?mode=solo|together` query param
- Legacy `/practice`, `/speak`, `/chat` paths 301-redirect to `/app/*` via `next.config.mjs`.

Criar (under `app/criar/`, hidden module, `noindex`):
- `/criar` — Bilingual-parenting module (daily Rioplatense phrase packs, capture, sparring, journal). Reached via a gated tab in `components/app-tabs.tsx` (`criar_enabled` localStorage flag; long-press the Hablaba wordmark to toggle). Cleanly bounded: see `lib/criar/README.md` for boundary rules before importing anything across the module edge in either direction.

API:
- `POST /api/chat` — Sends message + conversation history to OpenAI, returns `{ reply, correction? }`
- `POST /api/waitlist` — `{ email, source, audience?, placement? }`. Adds to Resend audience (if env vars set), captures `waitlist_signup` to PostHog server-side.
- `POST /api/tts` — Text-to-speech
- `POST /api/feedback` — Stub, returns 501 (not implemented)

**SEO**: `app/sitemap.ts`, `app/robots.ts`, root `app/opengraph-image.tsx` and per-audience `app/(marketing)/for/[slug]/opengraph-image.tsx` generate dynamic OG images.

**Key files**:
- `hooks/use-chat.ts` — All chat state: messages array, loading, conversation history ref, correction attachment
- `app/api/chat/route.ts` — OpenAI integration. Uses `openai.responses.create()` with `gpt-4o`, enforces JSON output (`{ reply, correction }`)
- `lib/types.ts` — All shared types: `Message`, `Correction`, `Session`, `SavedPhrase`, `DailyPrompt`
- `lib/data.ts` — Mock data only; no database exists yet
- `lib/api.ts` — Client-side fetch wrappers

**Data flow**: `ChatInput` → `use-chat.ts` → `lib/api.ts` → `/api/chat` → OpenAI → response parsed and attached to message history

**No persistence**: All state is in-memory. The feedback API and any phrase-saving features are unimplemented stubs.

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
