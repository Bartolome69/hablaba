# Criar (user-facing name: "Grow")

A cleanly bounded module inside Hablaba for a parent raising a child bilingually
(one-parent-one-language) in Rioplatense Argentine Spanish. The parent is the user,
not the child: the product keeps the parent's daily spoken Spanish rich and correct,
and captures real-life gaps so the next day's material teaches them back.

**Naming**: the module shows up to Bart as **"Grow"** (heading, tab label, page
titles, the `/grow` URL). Everything below — folders, type names, localStorage
keys — keeps the original **"Criar"** codename. That split is deliberate: the
rename request was cosmetic, and renaming the internal code too would touch
~15 files and every `criar_*` localStorage key for zero user-visible benefit.
Don't silently "finish the job" and rename the internals — ask first.

## What lives where

| Path | Purpose |
| --- | --- |
| `app/grow/` | Routes: home (daily pack + capture), `sparring/`, `journal/`, `voice/`. `/criar/*` 301-redirects here (`next.config.mjs`) |
| `app/api/criar/` | Stateless LLM routes: `pack/` (daily pack generation), `sparring/` (conversation) |
| `components/criar/` | All Grow UI components (`voice/` for voice mode) |
| `lib/criar/` | Types, store, stage logic, prompts, seed, this README (`voice/` for voice mode) |

## Voice mode (`/grow/voice`)

Hands-free spoken conversation — a sibling of sparring for a parent pushing a
pram. Listed as "Charlar" in `GrowSectionNav` alongside Today/Catch up/Journal
(still behind the module's own `criar_enabled` gate, same as the rest of Grow).

The engine is **shared code** (`lib/voice/`, `components/voice/`) because
voice mode also serves Speak; Grow keeps only its bindings here:

- `lib/voice/adapter.ts` — the `VoiceEngine` interface. Provider-neutral.
- `lib/voice/openai-realtime.ts` — **the only file that knows about WebRTC or
  OpenAI event names.** Trialling ElevenLabs Conversational AI for a better
  Argentine voice means adding a sibling implementation and changing the
  factory in `lib/voice/use-voice-session.ts`.
- `lib/voice/use-voice-session.ts` — surface-agnostic session state; writes
  through a `VoicePersistence` adapter and mints via a caller-chosen endpoint.
- `lib/criar/voice/` — Grow's bindings only: `types.ts` (adds `childId` to the
  shared records for the criar_* tables), `persistence.ts`, `analysis.ts`
  (store orchestration around the shared `/api/analyze` call), `weekly.ts`.

`OPENAI_API_KEY` never reaches the browser: `/api/voice/session` (root — it
serves every voice surface and imports this module's prompt builder) mints a
60-second ephemeral client secret and the browser does the SDP exchange with
OpenAI directly. Session length is capped client-side (`MAX_SESSION_SECONDS`,
15 min) as the cost guardrail — the credential's TTL can't do it, because a
session outlives the secret that opened it.

**Primary target is Chrome on Android, installed as a PWA** (iOS Safari works
but is the fallback path). The difference is load-bearing and lives in
`voice/platform.ts`:

- **Backgrounding.** Android keeps an active WebRTC session running with the
  screen off — that's the whole point for a parent pushing a pram — so voice
  mode leaves it alone and lets genuine drops surface as connection failures.
  iOS suspends the mic and never resumes it, so there (and only there) hiding
  the page pauses the session with an explicit reconnect. Never make this
  unconditional in either direction.
- **Wake lock** defaults off on Android (a screen held on for 15 minutes in a
  pocket is battery burn plus stray taps) and on elsewhere, with a toggle the
  parent can override.
- **Media Session** gives lock-screen pause/resume/stop and signals to Android
  that the backgrounded tab is doing real work.
- **Pause holds the same session.** `VoiceEngine.pause()` keeps the peer
  connection and the Realtime session open, so resuming continues the same
  conversation with all its context — no history replay. It must genuinely
  release the mic (detach the track from the sender, then stop it, so nothing
  is transmitted and the OS recording indicator goes out): pausing exists
  because someone else started talking, so "paused" has to mean *not
  listening*, never merely "ignoring input". Pausing mid-reply cancels it and
  drops the half sentence; resuming asks her to re-deliver that turn **from the
  beginning**, because after a few minutes away you've lost the thread. A
  forgotten pause is ended and saved after `MAX_PAUSE_SECONDS`.
- **Realtime `error` events are not fatal.** Many are recoverable and some are
  ours (cancelling when nothing is generating). Only a connection-state change
  ends a session. Treating protocol errors as fatal killed sessions on pause —
  don't reintroduce it.
- **Mic-denied recovery copy** differs per platform; `micPermissionHelp()` owns it.

Voice conversations are **persisted from day one** in three store tables —
`criar_voice_sessions`, `criar_voice_turns`, `criar_voice_observations` —
following the store's table-shaped convention. Turns are written individually
as they finalise (a killed tab loses at most the turn in flight, never the
transcript); the session row is stamped with `endedAt`/`durationSeconds` on
every teardown path. History lives at `/grow/voice/historial`, the full
transcript at `/grow/voice/[id]`.

**Post-session analysis**: on session end the client fires `/api/analyze`
(stateless; currently GPT-4o behind a single swappable function — the original
spec named Claude, and switching vendors touches only `runAnalysisModel()`).
The session detail view lazily retries if observations are missing, using the
session row's `analyzedAt` to tell "analyzed, found nothing" from "not yet
analyzed". Grammar observation tags are **exercises-taxonomy topic ids**
(enforced by structured output + revalidation), which is what lets the review
deep-link to `/app/exercises?topic=<tag>` and keeps the future weekly report a
group-by — `listRecentVoiceObservations()` in the store is that report's hook.

**Grammar is tú everywhere** — across packs, sparring and voice alike. Voseo
is not a mode and there is no register flag; don't reintroduce one. Dialect is
the separate axis: Rioplatense is a *flavour* (vocabulary, warmth, porteño TTS)
layered on tú grammar, per child (`CriarChild.dialect`) — see `SpanishDialect`
in `prompts.ts`. **The same persona speaks on every voice surface** — Grow's Charlar and the main app's `/app/charla` share the
one warm Argentine partner (Bart's explicit call: one person across the whole
app, revisit later). Don't give Speak's voice mode a separate
neutral-LatAm persona without asking. The parent's correction preference
("corrígeme mucho / normal / poco") is chosen on the voice screen, stored as
`criar_correction_level`, and folded into the instructions server-side.
Curriculum context (this week's pack phrases + capture lessons) comes from
`session-context.ts` — the same query sparring uses.

## Access & navigation

Grow lives inside the **one installed Hablaba PWA** (scope `/`) — deliberately
not a separate install, because iOS gives each home-screen web app isolated
storage and Grow's data is in localStorage. The layout sets `robots: noindex`.

- **Entry**: a gated third tab in the shared top navigation
  (`components/app-tabs.tsx`: Speak / Practice / Grow). The tab renders only
  when the `criar_enabled` localStorage flag is set — unlocked by
  **long-pressing the Hablaba wordmark** (1.2s, see
  `components/home/app-header.tsx`; long-press again to re-hide) or by
  visiting `/grow` directly (the seed sets the flag). Public visitors never
  see it.
- **In-module navigation**: fixed bottom bar (`components/criar/criar-nav.tsx`:
  Today / Sparring / Journal), hidden on the full-screen sparring chat. The
  Grow home also renders `AppTabs` so you can switch back to Speak/Practice.
- The main-app service worker (`public/sw.js`, network-first) covers `/grow`.

## Boundary rules

Grow may import from the main app **only**:

- `components/ui/*` — shadcn primitives (Button, Sheet, …)
- `components/settings-sheet` — the shared Settings sheet; Grow injects its
  child-details section via the `growDetails` slot (keeps the main app from
  importing Grow code)
- `components/chat/chat-bubble`, `components/chat/chat-input` — presentational chat UI
- `hooks/use-recorder`, `hooks/use-tts`, `hooks/use-voice-preference`, `hooks/use-tts-muted` — audio I/O
- `hooks/use-turn-translations` + `/api/translate` — tap-to-translate for transcript turns
- `lib/audio`, `lib/utils`, `lib/voices` — shared utilities
- `lib/voice-topics` + `components/voice/*` — conversation topics and shared voice UI, deliberately main-app-owned so Speak can reuse them when voice mode lands there
- `lib/types` — only the `Message`/`Correction` shapes (for chat UI reuse)
- Shared API routes: `/api/tts` (with `register=rioplatense`), `/api/transcribe` (with `language=auto`), `/api/analyze` (voice-session transcript analysis — lives at the root because it imports the exercises taxonomy for tag validation, which Grow itself must not)

The main app must **never** import from `lib/criar/` or `components/criar/`.
Its only reference to Grow is the gated `/grow` tab in `components/app-tabs.tsx`
(a URL string + the `criar_enabled` flag — no code imports). Anything Grow needs
beyond the list above gets copied into the module, not imported. This keeps the extraction path clean: to spin Grow out into
a standalone app, take the four directories above plus copies of the shared
utilities it uses.

Shared-code changes made for Grow (kept deliberately tiny, both backwards-compatible):

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
  optional usage note, `learned` flag), a short retelling of a well-known children's
  tale (`story`, for the parent to read aloud), one song/rhyme/nana, and mini-lessons
  for captures woven in.
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

Grammar is **tú**, app-wide and settled — the parent holds one system, never
two. The Argentine *flavour* is a separate, per-child dialect axis: Argentine baby vocabulary (pañal, chupete, upa, mamadera,
cochecito), warmth (dale, che, re, diminutives), peninsular forms still listed
as errors, and `register=rioplatense` TTS for the porteño (sheísmo) accent. The
dialect flavour lives in `lib/criar/prompts.ts` (`SpanishDialect`) and
`lib/criar/seed.ts`. Grammar is not configurable.

## Out of scope (deliberate)

Child-facing UI, conversation-partner-as-child mode, tricky-questions library,
older-stage content, community/sharing/onboarding/payments, non-Spanish UI.
