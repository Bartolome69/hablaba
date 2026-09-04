"use client"

// Adding a word of your own: English in, Spanish (with its article and gender)
// out, straight into the list. The mirror of `capturePhrase` in
// lib/phrases/pack.ts — same shape, same contract, same reason: what the
// learner asked for should be usable NOW, not queued for tomorrow.

import { getProfile } from "@/lib/profile/store"
import { addWord, hasWord } from "./store"
import type { Gender, VocabSetId, VocabWord } from "./types"

export type AddWordOutcome =
  | { status: "added"; word: VocabWord }
  | { status: "duplicate"; spanish: string }

interface TranslatedWord {
  spanish: string
  article: string
  gender: Gender
  english: string
  example?: string
  exampleTranslation?: string
  set: VocabSetId
}

/**
 * Translate an English term and store it. Throws on network failure so the
 * caller can offer a retry; returns `duplicate` (rather than throwing) when
 * the translation turns out to be a word already on the list, so the UI can
 * say "you've got that one" instead of silently doing nothing.
 */
export async function addOwnWord(term: string): Promise<AddWordOutcome> {
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

  if (hasWord(word.spanish)) return { status: "duplicate", spanish: word.spanish }

  const stored = addWord({
    spanish: word.spanish,
    article: word.article,
    gender: word.gender,
    english: word.english,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
    // The model classifies into a set, so a body part typed by hand lands
    // under El cuerpo rather than in an undifferentiated "mine" pile.
    set: word.set,
    source: "propia",
  })
  if (!stored) return { status: "duplicate", spanish: word.spanish }
  return { status: "added", word: stored }
}
