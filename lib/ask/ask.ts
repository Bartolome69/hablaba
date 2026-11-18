"use client"

// "¿Cómo se dice…?": lookup and the two ways to keep an answer. One module for
// the global sheet, the Frases box and a pack's add box, so the three behave
// identically. Saving is always a choice; asking stores nothing.

import { getProfile } from "@/lib/profile/store"
import { normalizePhraseText, listPhrases } from "@/lib/phrases/store"
import { saveCapture } from "@/lib/phrases/pack"
import type { Phrase, PhraseMoment } from "@/lib/phrases/types"
import { packLabel } from "@/lib/vocab/catalog"
import { addWord, findWord, unhideBySpanish } from "@/lib/vocab/store"
import type { Gender, VocabSetId, VocabWord } from "@/lib/vocab/types"

export interface AskAnswer {
  kind: "word" | "phrase"
  /** Bare word (no article) for a word; the whole sentence for a phrase. */
  spanish: string
  /** en-GB gloss. */
  gloss: string
  article?: string
  gender?: Gender
  example?: string
  exampleGloss?: string
  moment?: PhraseMoment
  /** The other dialect's word where it differs (remera / camiseta). */
  otherDialect?: { dialect: "rioplatense" | "neutral"; spanish: string }
}

export async function askLookup(
  query: string,
  opts: { want?: "auto" | "word"; context?: string } = {},
): Promise<AskAnswer> {
  const profile = getProfile()
  const res = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      want: opts.want ?? "auto",
      context: opts.context,
      dialect: profile.dialect,
      childName: profile.child?.name,
    }),
  })
  if (!res.ok) throw new Error(`Ask error: ${res.status}`)
  const data = (await res.json()) as { answer?: AskAnswer }
  if (!data.answer?.spanish) throw new Error("Ask returned no answer")
  return data.answer
}

/** "la bufanda" for a word answer, the sentence for a phrase. */
export function answerDisplay(answer: AskAnswer): string {
  return answer.kind === "word" && answer.article ? `${answer.article} ${answer.spanish}` : answer.spanish
}

export type SaveWordOutcome =
  | { status: "added"; word: VocabWord }
  /** Already somewhere. `restored` when it had been removed and is now back. */
  | { status: "duplicate"; pack: VocabSetId; packLabel: string; restored: boolean }

/** Keep a word answer: into `set` (Tus palabras by default), due now on the ladder. */
export function saveAnswerAsWord(answer: AskAnswer, set: VocabSetId = "propias"): SaveWordOutcome {
  const existing = findWord(answer.spanish)
  if (existing) {
    if (existing.hidden) unhideBySpanish(answer.spanish)
    return { status: "duplicate", pack: existing.pack, packLabel: existing.label, restored: existing.hidden }
  }
  const stored = addWord({
    spanish: answer.spanish,
    article: answer.article ?? "",
    gender: answer.gender ?? "invariable",
    english: answer.gloss,
    example: answer.example,
    exampleTranslation: answer.exampleGloss,
    set,
    source: "propia",
  })
  return stored
    ? { status: "added", word: stored }
    : { status: "duplicate", pack: set, packLabel: packLabel(set), restored: false }
}

/** Keep a phrase answer (or a word's example sentence): Frases, Recientes, seedable. */
export function saveAnswerAsPhrase(answer: AskAnswer): Phrase | null {
  const isWord = answer.kind === "word"
  const text = isWord ? answer.example : answer.spanish
  const translation = isWord ? answer.exampleGloss : answer.gloss
  if (!text) return null
  return saveCapture({ text, translation: translation ?? "", moment: isWord ? undefined : answer.moment })
}

/** Is this answer already kept? Drives "Ya está en …" instead of a save button. */
export function alreadySaved(answer: AskAnswer): {
  word: { pack: VocabSetId; label: string } | null
  phrase: boolean
} {
  const found = answer.kind === "word" ? findWord(answer.spanish) : null
  const word = found ? { pack: found.pack, label: found.label } : null
  const text = answer.kind === "word" ? answer.example : answer.spanish
  const key = text ? normalizePhraseText(text) : ""
  return { word, phrase: !!key && listPhrases().some((p) => normalizePhraseText(p.text) === key) }
}
