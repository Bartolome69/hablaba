# Exercises

Self-test practice for B1 Spanish grammar, fed by teacher-provided PDFs. The
learner drills a grammar topic (por vs para, ser vs estar, the tenses…) with a
mix of exercise types, gets graded with the rule explained on misses, and builds
a per-topic mastery map over time — the Kwiziq model, scoped to Hablaba.

User-facing name: **Exercises**. Unlike Grow/Criar there is no codename split —
folders, types, and storage keys all use `exercises` / `exercises_*`.

## The core decision: content vs progress

Two data families with different homes. Getting this split right is why the
feature needs no database yet.

| | What | Where | Why |
| --- | --- | --- | --- |
| **Content** | Topics + ingested source packs | Versioned JSON in the repo (`taxonomy.json`, `content/*.json`) | Expensive to produce, static once reviewed, must not be lost, ships to every device in the bundle |
| **Progress** | Attempts + derived mastery | `localStorage` (`exercises_*`), table-shaped | Cheap, small, per-device, tolerable to lose; same upgrade path as `lib/criar/store.ts` |

Content is produced **at dev time**, not in the app: you drop a PDF in
`content/sources/`, run the `/ingest-pdf` skill, and review the generated JSON
in a git diff before committing. There is no in-app upload, no PDF-parsing API
route, and no vision-model cost at runtime. Ingest quality — the main risk — is
gated by human diff review.

## What lives where

| Path | Purpose |
| --- | --- |
| `lib/exercises/taxonomy.json` | Canonical grammar topics (raw data, shared with the validator). Single source of truth for topic ids |
| `lib/exercises/taxonomy.ts` | Typed access + grouping helpers over `taxonomy.json` |
| `lib/exercises/schema.ts` | **Canonical** zod schema for a content pack + inferred types. The app validates packs at load with this |
| `lib/exercises/types.ts` | Module types entrypoint: re-exports content types, defines progress types (`Attempt`, `TopicMastery`) |
| `lib/exercises/content/*.json` | Ingested source packs (one file per PDF). `_`-prefixed files are ignored by the validator |
| `content/sources/*.pdf` | Where teacher PDFs are dropped for ingestion (not shipped, not imported by app code) |
| `scripts/validate-content.mjs` | Toolchain-free build/ingest gate (`npm run validate:content`). Mirrors the schema's load-bearing invariants |

## Data model

```
Topic (canonical taxonomy — fixed, in code)
  └─ Source (one per ingested PDF)
       ├─ lessons[]  — the rule per topic, in the teacher's framing + examples
       └─ items[]    — the question bank
            └─ Attempt (localStorage, one per answered item)
                 └─ derived → TopicMastery (never stored; computed from attempts)
```

PDFs **map onto** the fixed taxonomy — they never invent topics. A PDF
contributes rule explanations, examples, and a question bank for topics that
already exist in `taxonomy.json`. To add a topic, edit `taxonomy.json` first.

## Exercise types (ascending evidence strength)

Recognition is weak evidence; production is strong. Mastery scoring should cap
what recognition-only practice can earn (see the Kwiziq model).

1. `choice` — multiple/binary choice ("¿por o para?"). Client-graded.
2. `cloze` — fill the blank (`___`). Client-graded, accent/case-insensitive.
3. `conjugation` — type the verb form. Client-graded.
4. `transform` — rewrite (e.g. into the pretérito). Client-graded if it has
   `answers`, else LLM-graded via `guidance`.
5. `open` — free production ("write a sentence using *para* for purpose").
   LLM-graded against `guidance`, reusing the existing `{ reply, correction }`
   correction format.

## Status / roadmap

- **Built (this pass)**: taxonomy, content-pack schema + validator, one worked
  example pack, the `/ingest-pdf` skill. Foundation only — no runtime UI yet.
- **Next**: `store.ts` (attempts + mastery), the `/app/exercises` tab, quiz
  session flow with `choice`/`cloze` (client-graded).
- **Later**: `open`/`transform` LLM grading route, format-capped mastery scores,
  weakest-topics session composer, topic map UI, speaking-drill handoff into
  `/app/chat`.
- **DB**: swap `store.ts` for Supabase when progress needs to sync across
  devices or real users arrive. Schema is table-shaped so it's a drop-in.
