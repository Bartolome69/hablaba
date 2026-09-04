# Vocab (Palabras)

Words, as a peer of the phrase library — the fifth app surface (`/app/palabras`).

Frases teaches you things to **say** ("¿Te cambio el pañal?"). Palabras teaches
you things to **name** ("la rodilla"). That's a different move with different
grammar attached, and it wants a different way in: a picture you touch rather
than a list you read.

## Why a separate table

A word carries grammar a phrase doesn't — a gender and the article that agrees
with it. Folding words into `phrases` would mean every phrase row carrying
always-null `article`/`gender` columns, and the phrase state machine (nueva →
practicando → usada, driven by conversation observations) doesn't describe
learning a noun: nobody can *observe* you knowing "la rodilla". So progress here
is counters (`timesPracticed`, `timesKnown`), not states.

## Content vs progress

The same split as Exercises (see `lib/exercises/README.md`), for the same
reason — it's why the feature needs no database.

| | What | Where |
| --- | --- | --- |
| **Content** | The authored sets: el cuerpo, los animales, la comida | Versioned JSON in `content/*.json`, shipped in the bundle, works offline |
| **Progress** | The learner's own list and its review counts | `localStorage` key `vocab_words`, table-shaped |

Content is authored at dev time and reviewed in a git diff. Nothing writes to
it at runtime.

## What lives where

| Path | Purpose |
| --- | --- |
| `types.ts` | `CatalogWord` (authored), `VocabWord` (the learner's row), `withArticle()` |
| `content/*.json` | The authored sets. One file per set |
| `catalog.ts` | Typed access, set metadata, grouping, word of the day |
| `body-map.ts` | Geometry for the tappable diagram — data, not JSX |
| `store.ts` | The `vocab_words` table + `buildDeck()` |
| `add.ts` | English in → Spanish out → onto the list (the mirror of `capturePhrase`) |
| `app/api/vocab/translate/` | The en→es route. Returns article and gender as **fields**, not prose |

## The diagram

`body-map.ts` describes two figures (Cuerpo and Cara) as lists of regions, each
naming a `cuerpo.json` word id. The component draws the figure **out of** its
labelled parts rather than putting invisible hotspots over an outline, so what
you can tap and what the diagram shows cannot drift apart.

Two figures, not one: drawn at a single scale the face parts come out as
unhittable slivers next to a torso.

Some words have no region — `espalda` can't be shown on a front-facing figure,
`dientes` and `lengua` sit inside the mouth. They aren't lost: the surface
lists every word in the set under the diagram. That list is also what makes
this accessible, and it's why a few regions being smaller than the 44px
minimum is acceptable — **the picture is a way in, never the only way to reach
a word.**

## Adding a set

1. Write `content/<id>.json` — an array of `CatalogWord`. Ids must be unique
   across all sets (prefix them, as the existing files do).
2. Add it to `SETS` and `SET_ORDER` in `catalog.ts`.
3. Add an icon mapping in `vocabSetIcon()` (`components/icons.tsx`).

Spanish in the sets follows the app's rules: **grammar is tú, never voseo**,
and vocabulary carries the Rioplatense flavour (frutilla, palta, chancho). The
UI chrome around it is the app's own porteño voice and does use voseo — that
split is deliberate, and it's the same one `lib/voice/prompts.ts` draws.

## Later

- Seed conversations with recent words the way phrases are seeded, so a word
  you saved gets *used* rather than only reviewed.
- Move `buildDeck` from least-practised ordering to real spaced repetition once
  there's enough review history to justify it.
- Swap `store.ts` for Supabase when progress needs to cross devices. The key is
  table-shaped, so it's a drop-in.
