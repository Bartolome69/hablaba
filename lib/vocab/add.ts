"use client"

// Adding a word of your own: English or Spanish in, the Spanish word (with its
// article and gender) out, straight into the pack the learner is looking at.
// The mirror of `capturePhrase` in lib/phrases/pack.ts: what the learner asked
// for should be usable NOW, not queued for tomorrow.

import { getProfile } from "@/lib/profile/store"
import { addWord, findWord, unhideBySpanish } from "./store"
import type { Gender, VocabSetId, VocabWord } from "./types"

export type AddWordOutcome =
  | { status: "added"; word: VocabWord }
  /** Already in a pack. `restored` when it had been removed and is now back. */
  | { status: "duplicate"; spanish: string; packLabel: string; restored: boolean }

interface TranslatedWord {
  spanish: string
  article: string
  gender: Gender
  english: string
  example?: string
  exampleTranslation?: string
}

/**
 * Translate a term and store it in `set`. Throws on network failure so the
 * caller can offer a retry; returns `duplicate` (rather than throwing) when the
 * word is already somewhere, so the UI can say where.
 */
export async function addOwnWord(term: string, set: VocabSetId): Promise<AddWordOutcome> {
  const profile = getProfile()
  const res = await fetch("/api/vocab/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      term,
      dialect: profile.dialect,
      childName: profile.child?.name,
    }),
  })
  if (!res.ok) throw new Error(`Vocab translate error: ${res.status}`)
  const data = (await res.json()) as { word?: TranslatedWord }
  const word = data.word
  if (!word?.spanish) throw new Error("Vocab translate returned no word")

  const existing = findWord(word.spanish)
  if (existing) {
    if (existing.hidden) unhideBySpanish(word.spanish)
    return { status: "duplicate", spanish: word.spanish, packLabel: existing.label, restored: existing.hidden }
  }

  const stored = addWord({
    spanish: word.spanish,
    article: word.article,
    gender: word.gender,
    english: word.english,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
    // The pack the learner added it from wins over the model's own guess.
    set,
    source: "propia",
  })
  if (!stored) return { status: "duplicate", spanish: word.spanish, packLabel: "", restored: false }
  return { status: "added", word: stored }
}
