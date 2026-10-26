# Vocab (Palabras)

Words, as a peer of the phrase library — the fifth app surface (`/app/palabras`).

Frases teaches you things to **say** ("¿Te cambio el pañal?"). Palabras teaches
you things to **name** ("la rodilla"). That's a different move with different
grammar attached, and it's learnt a different way: packs of words, studied as
flashcards.

## The shape: a shelf of packs

Two levels, no filters. The Palabras home is a shelf: one green block for
"Repaso de hoy" (what's due across every pack), then the packs. A pack screen
(`/app/palabras/<pack>`) lists its words under plain subgroup headings, has one
"Estudiar este pack" button, and an add box. There used to be a set chip row, a
body/face diagram with its own switch, and a direction toggle in the deck;
Bart found the layers confusing and didn't use the diagram, so all three went
(Oct 2026).

**Every authored pack is preloaded.** Its words are studyable from the first
visit, with no saving step. A catalog word that's never been reviewed has no
row in `vocab_words`: `store.ts` serves it as a *virtual* word (id
`cat:<catalog id>`, box 0) and writes its row on the first review. Rows from
before packs existed are matched back to their pack word by `catalogId`, or by
spelling (preferring the row's own pack), so old progress carries over; that's
how a verb added by the Exercises bridge ended up in Verbos with its history.

The learner can **add words to any pack** (English or Spanish in, via
`add.ts`); "Tus palabras" (`propias`) is the pack for anything that fits
nowhere else. Press and hold a word for "Ya la sé" (straight to the top box)
or "Quitar" (an authored word is hidden per device in `vocab_hidden`, with
undo and a "Mostrarlas" footer; an added word is deleted).

**Sessions.** A pack session is its due words first, then up to 8 new ones, 12
cards at most, so a fresh pack arrives a handful at a time. Direction follows
the word: Spanish-first while it's new or shaky, English-first once it's
reached box 2. Only a card's first answer in a session moves it on the ladder;
a missed card goes back to the end of the deck (up to twice), and getting it
right on the retry schedules it for tomorrow (`recordRelearned`) without
climbing.

## Why a separate table

A word carries grammar a phrase doesn't — a gender and the article that agrees
with it. Folding words into `phrases` would mean every phrase row carrying
always-null `article`/`gender` columns, and the phrase state machine (nueva →
practicando → usada, driven by conversation observations) doesn't describe
learning a noun: nobody can *observe* you knowing "la rodilla". Progress here is
a review schedule instead.

## The ladder

`schedule.ts` — a Leitner ladder. Each word sits in a box, and each box waits
longer before showing the word again:

| Box | Waits | Band shown |
| --- | --- | --- |
| 0 | due now | Nueva |
| 1 | 1 day | Practicando |
| 2 | 3 days | Practicando |
| 3 | 7 days | Practicando |
| 4 | 16 days | Sabida |
| 5 | 35 days | Sabida (resting) |

"Lo sabía" climbs a box. "Otra vez" drops **one** box *and* makes the word due
immediately — two separate mercies, and it needs both. Dropping one box rather
than resetting to zero means a blank doesn't wipe weeks of knowing the word;
being due now means the word you just failed comes back next session rather
than disappearing for three days, which is what dropping a box alone would do.

Five "lo sabía" from new takes a word to the top box, ~97 days end to end.
After that it rests for over a month before surfacing to check it stuck.

Chosen over SM-2 because SM-2 wants a graded recall quality (0–5) and this deck
asks one honest binary. Inventing a quality score from a yes/no would be
modelling precision that isn't there.

**Repaso de hoy holds only what's DUE** (and a pack session adds a capped
handful of new words on top). That's the whole point: it's what stops 237
words making every session the same 237 cards. When nothing
is due the hero says "Estás al día" rather than nagging, with a quiet "Repasar
igual" for anyone who wants to practise anyway. No streak, no guilt: an empty
queue is a good day.

Rows written before scheduling existed are normalised on **read** (`box: 0`,
`dueAt: createdAt`) rather than by a migration, so the store is self-healing.

## Content vs progress

The same split as Exercises (see `lib/exercises/README.md`), for the same
reason — it's why the feature needs no database.

| | What | Where |
| --- | --- | --- |
| **Content** | The authored packs: eleven of them, from Cosas del bebé to Verbos | Versioned JSON in `content/*.json`, shipped in the bundle, works offline |
| **Progress** | Review history, the learner's own words, removed words | `localStorage` keys `vocab_words` (table-shaped) and `vocab_hidden` |

Content is authored at dev time and reviewed in a git diff. Nothing writes to
it at runtime.

## What lives where

| Path | Purpose |
| --- | --- |
| `types.ts` | `CatalogWord` (authored), `VocabWord` (the learner's row), `withArticle()` |
| `content/*.json` | The authored packs. One file per pack |
| `catalog.ts` | Typed access, pack metadata and order, word of the day |
| `schedule.ts` | The Leitner ladder: intervals, `nextSchedule()`, `isDue()`, the band labels. Pure — no storage, no React |
| `store.ts` | The `vocab_words` table, virtual words, `packContents()`, `packStats()`, the deck builders, remove/hide |
| `add.ts` | English (or Spanish) in → Spanish out → into the pack being viewed (the mirror of `capturePhrase`). Spanish input is the word the learner wants, so it's kept and glossed, never swapped for a synonym |
| `app/api/vocab/translate/` | The en→es route. Returns article and gender as **fields**, not prose |

## Adding a pack

1. Write `content/<id>.json`, an array of `CatalogWord`, 18 to 22 words across
   the pack's groups. Ids must be unique across all packs (prefix them).
2. Add the id to `VocabSetId` in `types.ts`, and the pack to `SETS` and
   `PACK_ORDER` in `catalog.ts` with its groups.
3. Add an icon mapping in `vocabSetIcon()` (`components/icons.tsx`).

Spanish in the sets follows the app's rules: **grammar is tú, never voseo**,
and vocabulary carries the Rioplatense flavour (frutilla, palta, chancho). The
UI chrome around it is the app's own porteño voice and does use voseo — that
split is deliberate, and it's the same one `lib/voice/prompts.ts` draws.

## Later

- Seed conversations with recent words the way phrases are seeded, so a word
  you saved gets *used* rather than only reviewed.
- Revisit the intervals once there's real review history — they're a reasoned
  starting point, not a measured one.
- Swap `store.ts` for Supabase when progress needs to cross devices. The key is
  table-shaped, so it's a drop-in.
