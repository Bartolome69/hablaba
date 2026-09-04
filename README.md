# Hablaba

Spanish practice for parents raising a bilingual baby. Built for someone with
one hand on a pram: mobile-first, installable as a PWA, usable in five minutes
or fifteen.

Deployed on Vercel at [spanishroutine.com](https://spanishroutine.com).

## What's in it

| Surface | What it does |
| --- | --- |
| **Phrases** (`/app/speak`) | Ready-to-say phrases grouped by daily routine, with audio |
| **Practice** (`/app/practice`, `/app/chat`) | Text conversation with an AI tutor that corrects as you go |
| **Charlar** (`/app/charla`) | Hands-free *spoken* conversation, screen-off — transcribed, reviewed afterwards |
| **Palabras** (`/app/palabras`) | Vocabulary: a tappable body diagram, sets for animals and food, your own words translated on the spot, and a flashcard review |
| **Exercises** (`/app/exercises`) | Grammar quizzes generated from teacher handouts |
| **Grow** (`/grow`) | Bounded bilingual-parenting module: daily Rioplatense phrase packs, gap capture, sparring, journal, voice |

The loop that matters: **speak → get your patterns back → practise the exact
gap → speak again.** A spoken session is analysed into tagged observations, a
weekly report ("Tu semana") groups them into patterns, and each pattern links
straight to the quiz for that rule.

## Running it

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production build
npm run lint     # ESLint
npx tsc --noEmit # typecheck (the build ignores TS errors — see below)
```

There is no test framework. Verification is typecheck + build + manual testing
on a phone.

`npm run validate:content` checks the Exercises content packs against their
schema.

### Environment

Only `OPENAI_API_KEY` is required — every AI feature runs through it (chat,
packs, TTS, transcription, the Realtime voice engine, and the transcript
analysis). Everything else is optional; see `CLAUDE.md` for the full list.

Voice mode additionally needs **Realtime API access** on the OpenAI account,
which is gated separately from the chat models.

### Testing voice mode

`getUserMedia` requires a secure origin, so voice mode does not work over plain
`http://<lan-ip>:3000`. Either use an HTTPS tunnel to your dev server, or test
against the deployed site. Primary target is **Chrome on Android installed as a
PWA**, where a session survives the screen going off; iOS Safari suspends the
mic instead and gets an explicit paused state.

## Architecture notes

- **Next.js 16** App Router, React 19, TypeScript, Tailwind 4, shadcn/ui.
- **No server database.** All state is per-device, table-shaped localStorage
  designed to map 1:1 to future SQL. API routes are stateless LLM proxies; the
  client owns persistence.
- **`next.config.mjs` sets `ignoreBuildErrors: true`** for TypeScript and
  ESLint, so the build passes with type errors. Run `npx tsc --noEmit`
  yourself — expect two known pre-existing errors in `app/manifest.ts` (Next's
  type is narrower than the web manifest spec allows for `purpose`).
- **Grow is a deliberately bounded module** with rules about what may cross its
  edge in either direction. Read `lib/criar/README.md` before importing across
  it.
- **Vocabulary is a separate table from phrases** (`lib/vocab/`), because a word
  carries an article and a gender and a phrase doesn't. Read
  `lib/vocab/README.md` before merging the two.
- The **voice engine** is shared (`lib/voice/`), and
  `lib/voice/openai-realtime.ts` is the only file that knows about WebRTC or
  OpenAI event names — so the provider stays swappable.

`CLAUDE.md` is the working reference for anyone (human or agent) picking this
up; `PRODUCT.md` and `DESIGN.md` carry the product and visual-design intent.
