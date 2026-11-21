# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Hablaba is a Spanish app for parents raising bilingual kids, most of them B1
learners themselves. **Positioning (Nov 2026):** the marketing site speaks to
bilingual parents only; the app keeps every general-learning feature (open
conversation, adult routines, all grammar) as the parent's own practice. Don't
add non-parent audience pages, and don't cut app features for not being about
the baby. It's built around
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
npm run lint     # ESLint (flat config in eslint.config.mjs; 0 errors expected)
npm run validate:content   # content packs, vocab, moments, the tú rule (incl. Cuentos fixtures)
npm test         # Vitest unit tests (tests/unit, jsdom + fake-indexeddb)
npm run test:e2e # Playwright at 390x844 (tests/e2e); needs `npm run build` first, mocks all AI routes
```

Test tooling arrived with Cuentos (Nov 2026): Vitest for logic and stores,
Playwright Test for flows. Both are devDependencies only. `predev`/`prebuild`
copy the self-hosted Tesseract files into `public/tesseract` (git-ignored).

## Architecture

**Stack**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui (New York style)

**Routes**:

Marketing (route group `app/(marketing)/`, full-width):
- `/` — Landing page (hero, how it works, features, audience teasers, FAQ)
- `/for/[slug]` — Programmatic audience pages, content from `lib/marketing/audiences.ts`. Slugs in `audienceSlugs`: parents, toddlers, beginners-with-kids, b1-learners ("parents at B1"). `/for/travelers` and `/for/expats` 301 to `/for/parents`.

App (under `app/app/`, constrained to `max-w-lg` via its own layout). Bottom
nav is **Today / Charlar / Phrases / Palabras / Exercises**:
- **"¿Cómo se dice?" bar** (refresh Phase 1): rides on top of the bottom nav on every tab (`components/ask/ask-bar.tsx`), opens one global sheet (`components/ask/ask-sheet.tsx`, state in `lib/ask/sheet.ts`). The same `AskPanel` is the box at the top of Frases and a pack's "¿Falta alguna?". Type, or use the mic: tap to start and tap again to send, or hold and release (`hooks/use-recorder.ts` → `/api/transcribe`; a release before the mic opens, e.g. on the permission prompt, latches instead of discarding); keep the answer as a word (Tus palabras or the pack) or a phrase (Frases), or close. Hidden while a quiz, a flashcard deck or voice mode is up (`useImmersive`, `lib/ui/immersive.ts`)
- `/app/today` — Hoy, built on the five jobs (refresh Phase 2): the ask bar (global, jobs 1–3), the one green chat card (resume or start) with "Elegir otro tema" (job 4), a Repasar card (words due, else this week's pattern or the weakest topic, job 5; `lib/review/focus.ts`), an "Esta semana" line into Tu semana, and "Para hoy con [child]": two phrases for this time of day
- `/app/repasar` — **Repasar** (refresh Phase 3), one session for job 5, one tap from Hoy: up to 8 flashcards (due across every pack, topped up with new words from the pack you touched last; `buildRepasarDeck`), 3 questions from this week's grammar pattern (else the weakest topic, else the first untried), and 1 saved phrase to recall; then a calm summary with the "Guardar las frases" bridge where the topic has one. Plan in `lib/review/session.ts`; results go through the same writers as Palabras, Práctica and Frases. "Estás al día" when nothing is waiting. The quiz it embeds is `components/exercises/quiz.tsx`, shared with Práctica
- `/app/charla` — Conversations hub: resume cards (expire after 14 days), starters, history
- `/app/charla/[id]` — **A conversation.** Type or talk; see Conversations below
  - **Words from chat** (refresh Phase 4): holding a word in Elena's message (`components/conversations/lookup-text.tsx`) opens the ask sheet with that word and its sentence, word mode; a tap still toggles the translation. A one-time hint sits under her latest message until the first lookup
  - **Every thread is seeded**, typed or spoken (`lib/conversations/seed.ts`): the working set of phrases plus the words reviewed in the last week (`getConversationSeedWords`). `/api/chat` and `/api/voice/session` both weave them in; the seed is stored on the conversation so the analysis knows what to look for
  - **Typed threads are analysed too**: leaving the thread or backgrounding the app runs `ensureConversationAnalysis` when there are typed turns the review hasn't seen (a new typed turn clears `analyzedAt`). A seeded phrase used naturally shows as a quiet note under that turn, never while voice is live, and in Tu semana under "Te salieron solas"
- `/app/charla/historial` — Every conversation
- `/app/speak` — Frases: the ask box, the phrase of the day, then **one set of moments** (refresh Phase 5): Recientes plus despertar, cambiar (Pañal), comida, juego, paseo, baño, calmar, dormir. Each moment is the learner's own phrases first, then the built-ins: `lib/phrases/content/moments.json` plus the matching baby routine from `lib/routines.ts` (merged in `lib/phrases/starter.ts`), so bath appears once. The adult situations (small talk, cafés, getting around) sit below in **"Para ti"**. `/frases/*` SEO pages still read `lib/routines.ts` and keep their URLs
- `/app/speak/cuentos` — **Cuentos** (Nov 2026, `docs/cuentos-plan.md`): photograph a page of an English picture book the parent owns, read it aloud in child-level tú Spanish that keeps the rhyme. ONE static route; the view is in the query string (`?libro=…&leer=3`, `lib/cuentos/nav.ts`), moved with the history API, because book ids only exist on the device and a per-book URL can't be precached. See "Cuentos" below. Entry: a card on Frases after the moments; the Frases tab stays active (`startsWith`)
- `/app/palabras` — Palabras: a shelf of word packs studied as flashcards. One green "Repaso de hoy" block (what's DUE across every pack, Leitner ladder in `lib/vocab/schedule.ts`; "Estás al día" when nothing is, never a nag), then "Tus palabras" and fourteen preloaded packs as tiles in three sections (`SHELF_SECTIONS` in `lib/vocab/catalog.ts`: Del bebé / Casa y calle / Para describir), so every library is one tap from the tab. Bebidas and Muebles used to be groups inside La comida and La casa; Adjetivos comunes is new. `/app/palabras/[pack]` lists a pack's words, studies them (a real card flip; due words first, then up to 8 new), and takes your own additions (English or Spanish in; Spanish kept as typed). Press and hold a word for "Ya la sé" / "Quitar". No chips, no body diagram. See `lib/vocab/README.md`
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
- `POST /api/ask` — "¿Cómo se dice?" (jobs 1 to 3): English or Spanish in, a WORD (bare Spanish + **article and gender as fields** + example) or a PHRASE (+ moment) out, en-GB gloss, and the other dialect's word where it differs. Spanish input is the learner's own construction: kept, never swapped for a synonym. Replaced `/api/vocab/translate` (retired) and the client side of capture mode
- `POST /api/tts` — Text-to-speech (optional `register=rioplatense`)
- `POST /api/transcribe` — Speech-to-text (optional `language=auto`)
- `POST /api/waitlist` — `{ email, source, audience?, placement? }`. Adds to Resend audience (if env vars set), captures `waitlist_signup` to PostHog server-side.
- `POST /api/cuentos/ocr` — a downscaled page photo (multipart, ≤3 MB, jpeg/png/webp) → `{ text, blocks }` via gpt-4o vision; 422 `no_text`, 503 `no_key` (the device then reads it itself). The image exists only in memory for the call; nothing logs the image or the text
- `POST /api/cuentos/translate` — `{ text, dialect }` → `{ spanish, notes? }`, gpt-4o, the brief's system prompt VERBATIM (`lib/cuentos/prompts.ts`). `containsVoseo` + a vosotros check run on the result: one retry, then 502 rather than teach it
- `POST /api/feedback` — Stub, returns 501 (not implemented)

## Age-aware content (refresh Phase 5)

The child's age is **derived** from the birthdate in Ajustes, never stored
(`lib/profile/age.ts`: `monthsOld`, `ageBand`, `fitsAge`, `ageGuidance`;
`childMonths()` in `lib/profile/store.ts`). Content can carry
`minMonths`/`maxMonths`: moment phrases, routine phrases, voice topics
(`rol-jardin` 18, `rol-plaza` 12) and "Con tu peque" (18, in the Charlar hub).
**Gate, don't delete:** with no birthdate nothing is gated, which is exactly the
old behaviour. With one, lines that don't fit are hidden and lines written for
that age lead. Elena gets one age line in every prompt (`/api/chat` material
block, voice persona, `/api/phrases/generate` moment mode), so a 6-month-old's
parent hears about naps and weaning, not the playground. Entries with
`"draft": true` (moments.json, bebe.json) are awaiting Bart's review.

`npm run validate:content` covers grammar packs, the vocabulary packs (shape,
no duplicate ids or spellings), the moments (shape, no duplicates with the
routines) and **the tú rule** across all taught Spanish, using `lib/voseo.ts`'s
own blocklist.

## Cuentos

Picture books the parent photographs, read aloud in Spanish by the PARENT
(Elena only says a word you tap, or the page if you press "Leer"). `lib/cuentos/`
and `components/cuentos/`.

- **Storage.** Text in localStorage tables like everything else (`books`,
  `book_pages`, `book_translations`; ISO timestamps). Photos and audio in
  IndexedDB (`hablaba_media`, `lib/cuentos/blobs.ts`, the app's first use of
  it), stored as ArrayBuffers for older iOS. Unlike the other stores, writes
  THROW `StorageFullError` instead of swallowing quota errors: a page that
  silently didn't save is a page that's gone.
- **Translations are per page AND dialect**, keyed by a hash of the English
  they were made from: change the English and they're stale. The parent's
  edited Spanish is never replaced without asking ("Dejar el mío").
- **Dialect is per book** (from Ajustes at creation), vocabulary only; tú always.
- **Page order** is drag and drop in the book's page list
  (`components/cuentos/sortable-pages.tsx`): a grip per row, pointer events
  with `touch-action: none`, auto-scroll at the edges, arrow keys on the grip.
  No library. `movePageTo` in the store keeps `lastPageIndex` on the same page.
  A missed page is added last and dragged into place.
- **Turning pages** is a swipe (`components/cuentos/page-turn.tsx`): the old
  page lifts off as a static snapshot rotated in 3D around the spine side,
  revealing the live new page; it follows the finger, turns past a third or on
  a flick, else falls back. Buttons and arrow keys use the same turn. The page
  area is `touch-action: pan-y` (vertical scroll stays native) and the click
  after a swipe is swallowed (so a swipe that starts on a word doesn't speak
  it). Reduced motion: the page just changes.
- **Audio** is Elena's TTS (`manner: clear`), cached per word and per page in
  IndexedDB, played only on a tap. Word clips are a shared cache capped at 400.
- **OCR fallback**: Tesseract.js, lazy-imported, self-hosted under
  `public/tesseract` (copied by `scripts/copy-tesseract.mjs`). Never point it
  at a CDN. Typing the English is always the last way out.
- **Offline**: `public/sw.js` (v2) precaches `/app/speak/cuentos` and matches
  navigations ignoring the query string. A book opened once works with no network.
- **Privacy**: photos never leave the phone except for the one OCR call; no
  Cuentos analytics, and PostHog drops the query string on Cuentos URLs
  (`before_send` in `components/posthog-provider.tsx`). The privacy and
  personal-use note is on the shelf's first open and in Ajustes.
- **Fixtures** (`tests/fixtures/cuentos/`) are ours: never a photo or text
  from a real book.

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
- **One voice, no picker.** She is Elena, and her voice is `marin`
  (`lib/voices.ts` — `PARTNER_NAME`, `PARTNER_VOICE`). Both `/api/tts` and
  `/api/voice/session` use that constant; the client sends no voice at all, so
  the two can't drift apart. There used to be a six-voice picker, which made a
  named persona configurable, offered three male voices while every line of
  copy calls her "she", and listed three ids (nova, onyx, fable) Realtime
  cannot speak. If her voice ever changes it must change to another id valid on
  BOTH engines: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin,
  cedar.
- **Accents are never corrected, and are inferred from context instead.** Bart
  types on a phone with no accent layout, so they're absent from everything he
  writes; prompts on `/api/chat` and `/api/analyze` both say to take the
  obvious reading ("Que decimos ?" → "¿Qué decimos?") and answer that, rather
  than flag it or ask which he meant. `shouldShowCorrection`
  (`lib/corrections.ts`) enforces it in code, because the prompt alone is not
  trusted here.
  **Tense and person still get caught — in VOICE mode.** Spoken turns are
  judged on grammar, and "hablo"/"habló" are genuinely different words when
  said aloud, so `/api/analyze` reports those. That is the deliberate division:
  typing loses the distinction and says nothing about it, speaking keeps it and
  is where it's taught.
- **The tú rule has a runtime guard, not just a prompt.** `lib/voseo.ts`
  blocks a correction that would put voseo in the learner's mouth their own
  message didn't have. Prompts alone failed twice: a thread full of the
  assistant's earlier voseo out-votes a rule at the top of the system prompt,
  so `/api/chat` also repeats `REGISTER_REMINDER` as a system message AFTER the
  history, which explicitly disowns the thread's own style. The blocklist is
  whole-word and deliberately NOT morphological — "-ás" is future-tense tú
  ("podrás", "serás") as often as it is voseo.
- **Corrections are conditional.** The prompt used to demand one for every
  message "even if their Spanish is perfect"; with nothing to correct the model
  filled the field with its own reply. Now: omit the field unless there's a
  real mistake, and "corrected" must be a rewrite of the learner's words and
  nothing else.
- **Never name her Spanish after the dialect in a prompt.** "Use natural
  Argentine (Rioplatense) Spanish" outranked the tú bullet under it and made
  `/api/chat` speak voseo AND rewrite the learner's correct tú into it
  ("pones" → "ponés"). Keep the structure `lib/voice/prompts.ts` uses: grammar
  is its own emphatic block, the dialect block names VOCABULARY only.
- **Dialect reaches every surface.** Voice mode, `/api/tts` AND `/api/chat` all
  take the profile dialect. Text chat used to be hardcoded Colombian/Mexican
  ("carro", "computadora"), so she was Argentine on the mic and Colombian in
  writing. Grammar is tú on all of them regardless — dialect is vocabulary
  flavour, never a grammar switch.
- **App-authored Spanish that becomes the LEARNER'S message follows the tú
  rule** (and since Nov 2026 so does the chrome). The quick-ask chips in
  `components/chat/chat-input.tsx` were voseo ("¿Lo podés repetir?",
  "Ayudame"), so the chat model correctly flagged them as errors — the app put
  voseo in the parent's mouth and then corrected them for it.
- **TTS delivery has two axes** (`/api/tts`): `dialect` is her accent and
  follows the profile; `manner` is what the line is for. `conversational`
  (Repetir, read-aloud) echoes the VOICE block in `lib/voice/prompts.ts` so a
  replayed line sounds like the voice-mode performance; `clear` (Frases,
  Palabras, flashcards) gives study material room without changing who she is.
  Before this, one instruction told her to be "a warm and patient tutor" for
  every line, and the porteño path was dead — its only caller was Grow, retired
  in the August restructure, so the dialect setting had stopped reaching TTS
  entirely. If TTS ever sounds unlike voice mode, compare these two blocks.
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
  vocabulary sets, chat and voice, **and the UI chrome too** ("Toca", "Prueba de
  nuevo", "Repasa tus palabras"). Until Nov 2026 the chrome was voseo on
  purpose; Bart reversed that so learners aren't reading vos forms all day.
  Rioplatense *vocabulary* can stay in chrome ("Dale", "mozo") because that's
  dialect, not grammar. Don't reintroduce vos forms in UI strings.
- **Turn-taking is patient on purpose** (`/api/voice/session`): semantic VAD
  at `eagerness: "low"` (she waits when you sound unfinished), plus
  `noise_reduction: far_field` so a baby's squeal or a bang is filtered before
  turn detection, plus a SOUNDS AROUND THEM block in `lib/voice/prompts.ts`
  (babble, cries and words to the child are not the parent's turn), plus
  `interrupt_response: false` (Bart's call): she always finishes her sentence,
  so a squeal can't cut her off; Pausa is how you stop her. The server can't
  reply to words said over her, so `openai-realtime.ts` does once she's done
  (`maybeAnswerWhatWasSaidOverHer`), and only when the transcript is real words.
- **The thread composer has ONE action slot** (`components/chat/chat-input.tsx`):
  "Hablar" (start voice) when the box is empty, the send arrow once you type.
  The quick-ask chips show the Spanish they send and hide while you type.
- Post-session analysis (`/api/analyze`) tags observations with
  **exercises-taxonomy topic ids** — the closed vocabulary that makes session
  reviews and the weekly report link into `/app/exercises?topic=…`. Keep tags
  groupable; never free text.
- Primary platform is **Chrome on Android as an installed PWA** (screen-off
  sessions survive; iOS Safari pauses instead). Platform forks live in
  `lib/voice/platform.ts` — never make backgrounding behavior unconditional.
- **The pocket view** (refresh Phase 6, `components/voice/pocket-view.tsx`): a
  dark full-screen view with Pausa/Seguir (88px) and Terminar as a 1-second
  press and HOLD, so a pocket can't end the conversation. It opens by itself on
  iPhone when the screen wake lock is held (a locked iPhone screen pauses the
  session), and is one tap away elsewhere ("Modo bolsillo"). `useWakeLock`
  returns `held | unsupported | denied | off` and the iPhone copy follows it:
  never promise the screen stays on unless the lock is actually held. The
  real-device run is `docs/voice-device-checklist.md`.

**SEO**: `app/sitemap.ts`, `app/robots.ts`, root `app/opengraph-image.tsx` and per-audience `app/(marketing)/for/[slug]/opengraph-image.tsx` generate dynamic OG images.

**Key files**:
- `lib/conversations/` — the unified conversation entity: store, types, `use-conversation.ts` (text side), `persistence.ts` (voice binding), `analysis.ts`
- `app/api/chat/route.ts` — OpenAI integration for text turns, streams `{ reply, translation, correction }`
- `lib/voice/` — the shared voice engine (adapter, `openai-realtime.ts`, platform forks, session hook)
- `lib/voice-topics.ts` — conversation starters. `voiceTopics` are the curated starters; `subjectVoiceTopics` gives the "Intereses"/"Vida diaria" subject cards (`lib/data.ts`) their spoken prompts. Both resolve through `getVoiceTopic`, which falls back to "dia" for an unknown id — so a topic WITHOUT an entry silently becomes the baby-day conversation. Every id offered anywhere in the picker must have one; `isKnownVoiceTopic` says whether it does
- `lib/types.ts` — shared types: `Message`, `Correction`, `SavedPhrase`, `DailyPrompt`

**Persistence**: No server database — everything is per-device, table-shaped localStorage designed to map 1:1 to future SQL: `conversations` / `conversation_turns` / `conversation_observations` (`lib/conversations/store.ts`), `phrases` (`lib/phrases/store.ts`), `vocab_words` (`lib/vocab/store.ts`), `profile` (`lib/profile/store.ts`), `books` / `book_pages` / `book_translations` (`lib/cuentos/store.ts`). Binary (Cuentos photos and audio) is in IndexedDB, `lib/cuentos/blobs.ts`. Exercises progress lives in `lib/exercises/store.ts`. The feedback API is a stub.

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
