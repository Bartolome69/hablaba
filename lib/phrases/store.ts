"use client"

// The phrase library. Key `phrases`, table-shaped for the future SQL move.
// State transitions live here so every surface moves phrases the same way.

import type { Phrase, PhraseMoment, PhraseSource, PhraseState } from "./types"

const KEY = "phrases"

function readAll(): Phrase[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Phrase[]) : []
  } catch {
    return []
  }
}

function writeAll(rows: Phrase[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {}
}

const byRecent = (a: Phrase, b: Phrase) => b.lastTouchedAt.localeCompare(a.lastTouchedAt)

export function listPhrases(): Phrase[] {
  return readAll().sort(byRecent)
}

export function getPhrase(id: string): Phrase | null {
  return readAll().find((p) => p.id === id) ?? null
}

/** Case/accent-insensitive form used for dedupe and loose observation matching. */
export function normalizePhraseText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¡!¿?.,;:'"«»]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

export function addPhrase(input: {
  text: string
  translation: string
  moment?: PhraseMoment
  source: PhraseSource
  state?: PhraseState
  timesUsed?: number
  timesPracticed?: number
  createdAt?: string
  id?: string
}): Phrase | null {
  const rows = readAll()
  // Dedupe by normalized Spanish — the library is one entity, so the same
  // phrase arriving twice (saved, then generated) must not fork.
  if (input.text && rows.some((p) => normalizePhraseText(p.text) === normalizePhraseText(input.text))) {
    return null
  }
  const now = new Date().toISOString()
  const phrase: Phrase = {
    id: input.id ?? crypto.randomUUID(),
    text: input.text,
    translation: input.translation,
    moment: input.moment,
    source: input.source,
    state: input.state ?? "nueva",
    timesUsed: input.timesUsed ?? 0,
    timesPracticed: input.timesPracticed ?? 0,
    createdAt: input.createdAt ?? now,
    lastTouchedAt: input.createdAt ?? now,
  }
  writeAll([phrase, ...rows])
  return phrase
}

export function updatePhrase(id: string, patch: Partial<Phrase>) {
  writeAll(readAll().map((p) => (p.id === id ? { ...p, ...patch } : p)))
}

export function removePhrase(id: string) {
  writeAll(readAll().filter((p) => p.id !== id))
}

// --- state transitions (the progress model) ---

/** Seeded into a conversation: nueva → practicando. Already-further states stay. */
export function markSeeded(ids: string[]) {
  const idSet = new Set(ids)
  const now = new Date().toISOString()
  writeAll(
    readAll().map((p) =>
      idSet.has(p.id) && p.state === "nueva"
        ? { ...p, state: "practicando", lastTouchedAt: now }
        : p,
    ),
  )
}

/**
 * A target_phrase_used observation fired for something the learner said —
 * find the phrase it matches and move it to usada. Loose match on purpose:
 * the analysis quotes what was SAID, which rarely equals the phrase verbatim.
 */
export function markUsedByText(spokenText: string): Phrase | null {
  const spoken = normalizePhraseText(spokenText)
  if (!spoken) return null
  const rows = readAll()
  const match = rows.find((p) => {
    if (!p.text || p.state === "usada") return false
    const own = normalizePhraseText(p.text)
    return own.length > 0 && (spoken.includes(own) || own.includes(spoken))
  })
  if (!match) return null
  const now = new Date().toISOString()
  const updated: Phrase = {
    ...match,
    state: "usada",
    timesUsed: match.timesUsed + 1,
    lastTouchedAt: now,
  }
  writeAll(rows.map((p) => (p.id === match.id ? updated : p)))
  return updated
}

/** Flashcard review in the Review deck — practice, not confirmed real-world use. */
export function recordPractice(id: string) {
  const now = new Date().toISOString()
  writeAll(
    readAll().map((p) =>
      p.id === id
        ? { ...p, timesPracticed: p.timesPracticed + 1, lastTouchedAt: now }
        : p,
    ),
  )
}
