# Criar

A cleanly bounded module inside Hablaba for a parent raising a child bilingually
(one-parent-one-language) in Rioplatense Argentine Spanish. The parent is the user,
not the child: the product keeps the parent's daily spoken Spanish rich and correct,
and captures real-life gaps so the next day's material teaches them back.

## What lives where

| Path | Purpose |
| --- | --- |
| `app/criar/` | Routes: home (daily pack + capture), `sparring/`, `journal/` |
| `app/api/criar/` | Stateless LLM routes: `pack/` (daily pack generation), `sparring/` (conversation) |
| `components/criar/` | All Criar UI components |
| `lib/criar/` | Types, store, stage logic, prompts, seed, this README |

There are **no links from the main app to Criar** — direct URL access only
(`/criar`), and the layout sets `robots: noindex`.

## PWA install

Criar installs as **its own PWA**, separate from the Hablaba icon: the layout
links `/criar/manifest.webmanifest` (served by a route handler — Next only
supports one `app/manifest.ts`) with `start_url`/`scope` of `/criar`, and
`app/criar/apple-icon.tsx` gives the install a distinct green home-screen icon
on iOS. Visit `/criar` in the browser → Add to Home Screen. In-module
navigation is the fixed bottom bar (`components/criar/criar-nav.tsx`:
Today / Sparring / Journal), hidden on the full-screen sparring chat. The
main-app service worker (`public/sw.js`, network-first) covers `/criar` too.

## Boundary rules

Criar may import from the main app **only**:

- `components/ui/*` — shadcn primitives (Button, Sheet, …)
- `components/chat/chat-bubble`, `components/chat/chat-input` — presentational chat UI
- `hooks/use-recorder`, `hooks/use-tts`, `hooks/use-voice-preference` — audio I/O
- `lib/audio`, `lib/utils`, `lib/voices` — shared utilities
- `lib/types` — only the `Message`/`Correction` shapes (for chat UI reuse)
- Shared API routes: `/api/tts` (with `register=rioplatense`), `/api/transcribe` (with `language=auto`)

The main app must **never** import from `lib/criar/`, `components/criar/`, or link
to `/criar` routes. Anything Criar needs beyond the list above gets copied into the
module, not imported. This keeps the extraction path clean: to spin Criar out into
a standalone app, take the four directories above plus copies of the shared
utilities it uses.

Shared-code changes made for Criar (kept deliberately tiny, both backwards-compatible):

- `/api/tts` + `lib/audio.ts` + `hooks/use-tts.ts`: optional `register` param
  (maps to dialect-specific TTS voice instructions server-side)
- `/api/transcribe` + `hooks/use-recorder.ts`: optional `language` param
  (`"auto"` for mixed-language capture dictation; default stays `"es"`)

## Data model

Everything hangs off a **child** (`CriarChild`: name, birthdate, target
language/dialect, `parentIds[]` for future multi-parent support). Developmental
**stage** is derived from birthdate (`deriveStage`): newborn 0–12m → toddler 1–3y →
preschool 3–5y → school-age 5+. Only the newborn stage has content (`stageMoments`);
later stages plug in without schema changes.

- `CriarPack` — one per child per day: 10–15 Rioplatense phrases (with English gloss,
  optional usage note, `learned` flag), one song/rhyme/nana, and mini-lessons for
  captures woven in.
- `CriarCapture` — a gap the parent hit in real life. Status chain:
  `new` (queued) → `taught` (woven into a pack) → `learning` (exercised in a
  sparring session) → `learned` (future: parent marks it).

## Storage

`lib/criar/store.ts` is a **localStorage repository with table-shaped records** —
keys `criar_children`, `criar_packs`, `criar_captures` map 1:1 to future SQL tables.
There is no server database anywhere in Hablaba yet; API routes are stateless LLM
proxies and the client sends generation context (stage, captures, learned/unlearned
phrases) with each request. When multi-device or multi-parent support is needed,
swap this file's implementation for a real backend (Supabase preferred) without
touching the schema.

`lib/criar/seed.ts` idempotently seeds one realistic example day (Teo,
b. 2026-05-21: bedtime pack + 2 captures) on first visit so the UI is reviewable.

## Register

Rioplatense is enforced in the LLM system prompts (`lib/criar/prompts.ts`): voseo
always (vos tenés, mirá, dale), Argentine baby vocabulary (pañal, chupete, upa,
mamadera, cochecito), peninsular forms listed as errors. TTS uses
`register=rioplatense` for sheísmo delivery. Don't soften these prompts —
generic "neutral Latin American" output is a regression here.

## Out of scope (deliberate)

Child-facing UI, conversation-partner-as-child mode, tricky-questions library,
older-stage content, community/sharing/onboarding/payments, non-Spanish UI.
