"use client"

// The learner's word list. Key `vocab_words`, table-shaped for the future SQL
// move — same contract as lib/phrases/store.ts.
//
// Progress here is a COUNTER, not a state machine. A phrase moves nueva →
// practicando → usada because conversation analysis can observe it being said;
// nobody can observe you knowing "la rodilla", so the honest signal is how
// often you've practised it and how often you got it. The deck reads both.

import { initialSchedule, isDue, nextSchedule } from "./schedule"
import type { CatalogWord, Gender, VocabSetId, VocabSource, VocabWord } from "./types"

const KEY = "vocab_words"

/**
 * Rows written before scheduling existed have no box or dueAt. Normalising on
 * READ rather than running a migration keeps this store self-healing and
 * matches how the phrase library handles its own legacy shapes: a word saved
 * last week simply arrives at box 0, due now.
 */
function normalize(row: VocabWord): VocabWord {
  if (typeof row.box === "number" && typeof row.dueAt === "string") return row
  const seeded = initialSchedule(new Date(row.createdAt))
  return { ...row, box: row.box ?? seeded.box, dueAt: row.dueAt ?? seeded.dueAt }
}

function readAll(): VocabWord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as VocabWord[]).map(normalize) : []
  } catch {
    return []
  }
}

function writeAll(rows: VocabWord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {}
}

const byRecent = (a: VocabWord, b: VocabWord) => b.lastTouchedAt.localeCompare(a.lastTouchedAt)

export function listWords(): VocabWord[] {
  return readAll().sort(byRecent)
}

export function listWordsInSet(set: VocabSetId): VocabWord[] {
  return listWords().filter((w) => w.set === set)
}

/** Case/accent-insensitive form used for dedupe. Mirrors normalizePhraseText. */
export function normalizeWord(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¡!¿?.,;:'"«»]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** The catalog ids already saved, so the body map can mark parts you have. */
export function savedCatalogIds(): Set<string> {
  return new Set(readAll().map((w) => w.catalogId).filter((id): id is string => !!id))
}

export function hasWord(spanish: string): boolean {
  const norm = normalizeWord(spanish)
  return readAll().some((w) => normalizeWord(w.spanish) === norm)
}

export function addWord(input: {
  spanish: string
  article: string
  gender: Gender
  english: string
  example?: string
  exampleTranslation?: string
  set: VocabSetId
  source: VocabSource
  catalogId?: string
}): VocabWord | null {
  const rows = readAll()
  // Dedupe on the bare noun: the same word saved from the catalog and then
  // typed in by hand is one word, not two cards in the deck.
  const norm = normalizeWord(input.spanish)
  if (!norm || rows.some((w) => normalizeWord(w.spanish) === norm)) return null

  const now = new Date().toISOString()
  const schedule = initialSchedule(new Date(now))
  const word: VocabWord = {
    id: crypto.randomUUID(),
    spanish: input.spanish,
    article: input.article,
    gender: input.gender,
    english: input.english,
    example: input.example,
    exampleTranslation: input.exampleTranslation,
    set: input.set,
    source: input.source,
    catalogId: input.catalogId,
    timesPracticed: 0,
    timesKnown: 0,
    box: schedule.box,
    dueAt: schedule.dueAt,
    createdAt: now,
    lastTouchedAt: now,
  }
  writeAll([word, ...rows])
  return word
}

/** Save a catalog row into the learner's list. Null if they already have it. */
export function addCatalogWord(word: CatalogWord, set: VocabSetId): VocabWord | null {
  return addWord({
    spanish: word.spanish,
    article: word.article,
    gender: word.gender,
    english: word.english,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
    set,
    source: "catalogo",
    catalogId: word.id,
  })
}

export function removeWord(id: string) {
  writeAll(readAll().filter((w) => w.id !== id))
}

/** Remove by catalog id — the body map and grids toggle on the catalog row. */
export function removeCatalogWord(catalogId: string) {
  writeAll(readAll().filter((w) => w.catalogId !== catalogId))
}

/**
 * One flashcard review. `known` is the learner's own call, not a grade — it
 * moves the word up or down the Leitner ladder and sets when it comes back.
 */
export function recordReview(id: string, known: boolean) {
  const at = new Date()
  const now = at.toISOString()
  writeAll(
    readAll().map((w) => {
      if (w.id !== id) return w
      const schedule = nextSchedule({ box: w.box, dueAt: w.dueAt }, known, at)
      return {
        ...w,
        timesPracticed: w.timesPracticed + 1,
        timesKnown: known ? w.timesKnown + 1 : w.timesKnown,
        box: schedule.box,
        dueAt: schedule.dueAt,
        lastTouchedAt: now,
      }
    }),
  )
}

/** Words ready to come back — everything whose dueAt has passed. */
export function listDueWords(set?: VocabSetId, at = new Date()): VocabWord[] {
  const pool = set ? listWordsInSet(set) : listWords()
  return pool.filter((w) => isDue({ box: w.box, dueAt: w.dueAt }, at))
}

export function countDue(set?: VocabSetId, at = new Date()): number {
  return listDueWords(set, at).length
}

/**
 * The deck for a study session: the words that are DUE, lowest box first so
 * the shakiest come while attention is freshest. Words in a high box aren't
 * here at all — that's the point of the ladder, and it's what stops a list of
 * eighty words turning every session into the same eighty cards.
 *
 * `includeNotDue` builds a deck anyway, ignoring the schedule, for the "practise
 * anyway" route out of the all-caught-up state. It never records differently —
 * an early review still moves the word up or down.
 */
export function buildDeck(
  set?: VocabSetId,
  size = 20,
  opts?: { includeNotDue?: boolean },
): VocabWord[] {
  const at = new Date()
  const pool = opts?.includeNotDue ? (set ? listWordsInSet(set) : listWords()) : listDueWords(set, at)
  return [...pool]
    .sort((a, b) => a.box - b.box || a.dueAt.localeCompare(b.dueAt))
    .slice(0, size)
}
