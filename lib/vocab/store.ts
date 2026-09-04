"use client"

// The learner's word list. Key `vocab_words`, table-shaped for the future SQL
// move — same contract as lib/phrases/store.ts.
//
// Progress here is a COUNTER, not a state machine. A phrase moves nueva →
// practicando → usada because conversation analysis can observe it being said;
// nobody can observe you knowing "la rodilla", so the honest signal is how
// often you've practised it and how often you got it. The deck reads both.

import type { CatalogWord, Gender, VocabSetId, VocabSource, VocabWord } from "./types"

const KEY = "vocab_words"

function readAll(): VocabWord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as VocabWord[]) : []
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

export function countWords(): number {
  return readAll().length
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

/** One flashcard review. `known` is the learner's own call, not a grade. */
export function recordReview(id: string, known: boolean) {
  const now = new Date().toISOString()
  writeAll(
    readAll().map((w) =>
      w.id === id
        ? {
            ...w,
            timesPracticed: w.timesPracticed + 1,
            timesKnown: known ? w.timesKnown + 1 : w.timesKnown,
            lastTouchedAt: now,
          }
        : w,
    ),
  )
}

/**
 * The deck for a study session: least-practised first, and within that the
 * ones you've got least often. Words you've never missed sink; words you keep
 * missing surface. Pass a set to study just that one.
 */
export function buildDeck(set?: VocabSetId, size = 20): VocabWord[] {
  const pool = set ? listWordsInSet(set) : listWords()
  return [...pool]
    .sort(
      (a, b) =>
        a.timesPracticed - b.timesPracticed ||
        a.timesKnown - b.timesKnown ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, size)
}
