// The Vocab module: WORDS, as a peer to the phrase library — not a subset of it.
//
// A phrase is something you SAY ("¿Te cambio el pañal?"). A word is something
// you NAME ("la rodilla"). They earn separate tables because a word carries
// grammar a phrase doesn't: a gender, an article, a plural you have to agree
// with. Folding words into `phrases` would mean every phrase row carrying four
// always-null columns, and the phrase state machine (nueva → practicando →
// usada, driven by conversation observations) doesn't describe learning a noun.
//
// Two data families, same split as Exercises (see lib/exercises/README.md):
//   - CONTENT (the authored sets: el cuerpo, los animales, la comida) — static
//     versioned JSON in the repo, shipped in the bundle, works offline.
//   - PROGRESS (which words you've added, how often you've practised them) —
//     `localStorage`, table-shaped, per-device.

/** Grammatical gender. `invariable` covers the handful that don't inflect. */
export type Gender = "m" | "f" | "invariable"

/**
 * The packs. Every authored pack is preloaded: its words are studyable from the
 * first visit, no saving step. The learner can add words to any pack, and
 * `propias` ("Tus palabras") is the pack for anything that fits nowhere else.
 */
export type VocabSetId =
  | "bebe"
  | "comida"
  | "cuerpo"
  | "ropa"
  | "casa"
  | "juguetes"
  | "animales"
  | "calle"
  | "colores"
  | "emociones"
  | "verbos"
  | "propias"

/** An authored pack, i.e. every set but the learner's own. */
export type PackId = Exclude<VocabSetId, "propias">

/** A word as authored in `content/*.json`. Read-only; never written to. */
export interface CatalogWord {
  /** Stable id, unique across all packs: "<pack>-<slug>". */
  id: string
  /** The bare noun, no article: "rodilla". */
  spanish: string
  /** The definite article that agrees with it: "la". */
  article: string
  gender: Gender
  /** English gloss: "knee". */
  english: string
  /** A short sentence a parent would actually say, using the word in context. */
  example: string
  exampleTranslation: string
  /** Optional grouping inside a set — "cara", "fruta", "mascotas". */
  group?: string
}

/** An authored pack: the catalog file plus its display metadata. */
export interface VocabSet {
  id: PackId
  /** Spanish display name, as it appears on the chip: "El cuerpo". */
  label: string
  /** English one-liner under the section head. */
  blurb: string
  words: CatalogWord[]
  /** Ordered group ids, for sets that use them. */
  groups?: { id: string; label: string }[]
}

/**
 * How a word got into the learner's list:
 * - catalogo — tapped/saved from one of the authored sets
 * - propia   — typed in English and translated by /api/vocab/translate
 */
export type VocabSource = "catalogo" | "propia"

/**
 * A row in the `vocab_words` table: either the review progress of a catalog
 * word (written the first time it's reviewed, see lib/vocab/store.ts) or a
 * word the learner added to a pack themselves.
 *
 * Deliberately denormalised: the Spanish, article and gender are COPIED from
 * the catalog rather than referenced by id. Progress must keep working if the
 * catalog entry is later reworded or dropped, and a learner's own word has no
 * catalog row to point at. `catalogId` links a progress row to its pack word.
 */
export interface VocabWord {
  id: string
  spanish: string
  article: string
  gender: Gender
  english: string
  example?: string
  exampleTranslation?: string
  set: VocabSetId
  source: VocabSource
  /** The catalog row this came from, when it came from one. */
  catalogId?: string
  /** Flashcard reviews, same meaning as Phrase.timesPracticed. */
  timesPracticed: number
  /** Reviews where the learner said they knew it. */
  timesKnown: number
  /**
   * Leitner box, 0..MAX_BOX. Climbs on "lo sabía", drops one on "otra vez".
   * See lib/vocab/schedule.ts.
   */
  box: number
  /** When this word next surfaces in a review. ISO datetime. */
  dueAt: string
  createdAt: string // ISO datetime
  lastTouchedAt: string // ISO datetime
}

/** With the article attached, the way it should always be learnt: "la rodilla". */
export function withArticle(word: Pick<VocabWord, "article" | "spanish">): string {
  return word.article ? `${word.article} ${word.spanish}` : word.spanish
}
