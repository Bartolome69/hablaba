// The Phrase entity — ONE library for every phrase the learner is working
// with, wherever it came from. Replaces three predecessors: the Grow daily
// pack's stored phrases, Grow's captures, and the main app's saved phrases.
//
// The daily pack is no longer a stored object: it's a QUERY over this library
// (see pack.ts), generating new rows only to fill gaps.
//
// Table-shaped like every store here: `phrases` ↔ a future SQL table.

/** Daily-routine moments a phrase belongs to. */
export type PhraseMoment =
  | "baño"
  | "comida"
  | "dormir"
  | "juego"
  | "paseo"
  | "despertar"
  | "calmar"

export const PHRASE_MOMENTS: PhraseMoment[] = [
  "despertar",
  "comida",
  "juego",
  "paseo",
  "baño",
  "calmar",
  "dormir",
]

/**
 * Where a phrase came from:
 * - captured — the learner hit a gap in real life and captured it
 * - saved — bookmarked from a conversation (a correction or a partner turn)
 * - generated — created to fill a moment's pack
 */
export type PhraseSource = "captured" | "saved" | "generated"

/**
 * Progress is state transitions, not counters:
 * nueva → practicando when the phrase is seeded into a conversation,
 * practicando → usada when a target_phrase_used observation fires for it.
 */
export type PhraseState = "nueva" | "practicando" | "usada"

export interface Phrase {
  id: string
  /** The Spanish. Empty string = captured but not yet generated (see pack.ts). */
  text: string
  /** English gloss — or, for a pending capture, the raw thing they couldn't say. */
  translation: string
  moment?: PhraseMoment
  source: PhraseSource
  state: PhraseState
  /** Times a target_phrase_used observation confirmed real use. */
  timesUsed: number
  /** Flashcard reviews (the Review deck) — deliberately separate from real use. */
  timesPracticed: number
  createdAt: string // ISO datetime
  /** Last state-relevant event: seeded, used, or practised. */
  lastTouchedAt: string // ISO datetime
}
