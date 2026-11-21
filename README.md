# Hablaba

Spanish practice for parents raising a bilingual child. Built for someone with
one hand on a pram: mobile-first, installable as a PWA, usable in five minutes
or fifteen.

Deployed on Vercel. The canonical domain comes from `NEXT_PUBLIC_SITE_URL`
(see `lib/site.ts`).

## What's in it

Five tabs, each a slice of one loop:

| Tab | What it does |
| --- | --- |
| **Hoy** (`/app/today`) | The five jobs in one screen: resume or start a conversation, Repasar (words due, else the grammar to work on), this week's pattern, and two phrases for this time of day. The "¿Cómo se dice?" bar sits above the tabs on every screen. The only screen with settings |
| **Charlar** (`/app/charla`) | Conversations with Elena, typed or hands-free spoken in the same thread. Typed turns get inline corrections; spoken turns are reviewed after the session. **Tu semana** (`/app/semana`) is the weekly report across all conversations |
| **Frases** (`/app/speak`) | Things to say: phrase of the day, a capture box for what you couldn't say, your phrases by daily moment, and 15 routines of ready-to-say phrases with audio. **Cuentos** (`/app/speak/cuentos`): photograph a page of an English picture book you own and read it aloud in child-level Spanish that keeps the rhyme |
| **Palabras** (`/app/palabras`) | Things to name: a shelf of 14 preloaded word packs in three sections (baby things, food, drinks, clothes, furniture, adjectives and more) studied as spaced-repetition flashcards. Add your own words to any pack in English or Spanish |
| **Práctica** (`/app/exercises`) | Grammar quizzes: 27 topics from authored and teacher-handout content packs, sortable by area, weakness or staleness. `?topic=<id>` deep-links into one |

The loop that matters: **speak → get your patterns back → practise the exact
gap → speak again.** A conversation is analysed into observations tagged with
grammar topics, Tu semana groups them into patterns, and each pattern links
straight to the quiz for that rule. Finishing a quiz can seed phrases that use
the rule into the next conversation.

The marketing site (`app/(marketing)/`) collects email signups for early
access and publishes the grammar topics (`/gramatica/...`) and phrase routines
(`/frases/...`) as free, indexable pages.

`/app/practice` and `/app/chat` are retired and redirect to `/app/today` and
`/app/charla`. The old Grow module (`/grow`, `/criar`) was folded into the main
tabs in August 2026 and redirects too.

## Running it

```bash
npm install
npm run dev               # localhost:3000
npm run build             # production build
npm run lint              # ESLint
npx tsc --noEmit          # typecheck (the build ignores TS errors, see below)
npm run validate:content  # content packs, vocab, moments, the tú rule
npm test                  # unit tests (Vitest, tests/unit)
npm run build && npm run test:e2e   # end-to-end at 390x844 (Playwright, tests/e2e)
```

Unit tests run in jsdom with an in-memory IndexedDB. The e2e suite starts
`next start` itself and mocks every AI route, so it needs no key; on a new
machine run `npx playwright install chromium` once. Real phones are still the
last word for the mic, the camera and voice (`docs/voice-device-checklist.md`).

### Environment

Only `OPENAI_API_KEY` is required. Every AI feature runs through it: chat,
phrase and word generation, TTS, transcription, the Realtime voice engine and
the transcript analysis. Everything else is optional; see `CLAUDE.md` for the
full list.

Voice mode additionally needs **Realtime API access** on the OpenAI account,
which is gated separately from the chat models.

### Testing voice mode

`getUserMedia` requires a secure origin, so voice mode does not work over plain
`http://<lan-ip>:3000`. Either use an HTTPS tunnel to your dev server, or test
against the deployed site. The primary target is **Chrome on Android installed
as a PWA**, where a session survives the screen going off; iOS Safari suspends
the mic instead and shows an explicit paused state.

## Architecture notes

- **Next.js 16** App Router, React 19, TypeScript, Tailwind 4, shadcn/ui.
- **No server database.** All state is per-device, table-shaped localStorage
  designed to map 1:1 to future SQL. API routes are stateless LLM proxies; the
  client owns persistence.
- **`next.config.mjs` sets `ignoreBuildErrors: true`** for TypeScript and
  ESLint, so the build passes with type errors. Run `npx tsc --noEmit`
  yourself; it should come back clean.
- **One conversation entity, two modalities** (`lib/conversations/`):
  `modality: text | voice` lives on each turn, so a thread can move between
  typing and speaking with one history and one review.
- **Vocabulary is a separate table from phrases** (`lib/vocab/`), because a word
  carries an article and a gender and a phrase doesn't. Read
  `lib/vocab/README.md` before merging the two.
- The **voice engine** is shared (`lib/voice/`), and
  `lib/voice/openai-realtime.ts` is the only file that knows about WebRTC or
  OpenAI event names, so the provider stays swappable.

## Docs

- `CLAUDE.md`: the working reference for anyone (human or agent) picking this up.
- `docs/VISION.md`: what the app is, who it's for, and where it's going.
- `docs/cuentos-plan.md`: the Cuentos plan, phases and decisions.
- `PRODUCT.md`: users, brand personality, design principles.
- `DESIGN.md`: the visual system, Clay + calm.
