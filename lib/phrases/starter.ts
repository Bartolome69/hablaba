// Built-in phrases for the moment packs: the static floor under the library.
//
// One set of moments (refresh Phase 5): each moment's built-ins are the
// authored lines in content/moments.json plus the matching baby routine from
// lib/routines.ts (which still feeds the /frases SEO pages), deduped. They are
// read-only rows materialised at query time (see pack.ts), NOT written into
// the library: the learner's own captured, saved and generated phrases always
// outrank them, and they never leak into conversation seeding or the review
// deck.
//
// Age-aware: entries can carry minMonths/maxMonths. With a birthdate set,
// lines that don't suit the child are hidden (gated, never deleted) and lines
// written for their age come first. Ids are derived from the text, so a line
// can move within the file without changing identity.
//
// Register: tú always, parent-to-little-one talk; content/moments.json entries
// marked "draft" are awaiting Bart's review.

import { fitsAge, isAgeSpecific, type AgeGated } from "@/lib/profile/age"
import { routines } from "@/lib/routines"
import momentsJson from "./content/moments.json"
import { normalizePhraseText } from "./store"
import type { Phrase, PhraseMoment } from "./types"

export const STARTER_ID_PREFIX = "starter-"

/** True for a pack row that came from the starter set, not the library. */
export function isStarterPhrase(p: Pick<Phrase, "id">): boolean {
  return p.id.startsWith(STARTER_ID_PREFIX)
}

// Starters aren't library rows, so "quitar" on one can't delete it: it hides
// it instead, per device. Key `hidden_starters`, a plain id list.
const HIDDEN_KEY = "hidden_starters"

export function hiddenStarterIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeHidden(ids: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]))
  } catch {}
}

export function hideStarter(id: string) {
  const ids = hiddenStarterIds()
  ids.add(id)
  writeHidden(ids)
}

export function unhideStarter(id: string) {
  const ids = hiddenStarterIds()
  ids.delete(id)
  writeHidden(ids)
}

// Fixed timestamp so starter rows are stable and always sort behind anything
// the learner actually did (packOrder already puts them last by band).
const STARTER_DATE = "2026-01-01T00:00:00.000Z"

interface BuiltIn extends AgeGated {
  id: string
  text: string
  translation: string
}

const MOMENT_CONTENT = momentsJson as Record<PhraseMoment, (AgeGated & { text: string; translation: string; draft?: boolean })[]>

// The six baby routines (the /frases SEO pages) live inside the moments in
// the app now: one set of moments, so bath appears once (refresh Phase 5).
const ROUTINE_MOMENT: Record<string, PhraseMoment> = {
  wakeup: "despertar",
  diaper: "cambiar",
  feeding: "comida",
  outside: "paseo",
  bath: "baño",
  bedtime: "dormir",
}

const slug = (text: string) =>
  normalizePhraseText(text).replace(/[^a-z0-9ñ]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)

function builtInsFor(moment: PhraseMoment): BuiltIn[] {
  const authored = (MOMENT_CONTENT[moment] ?? []).map((e) => ({
    id: `${STARTER_ID_PREFIX}${moment}-${slug(e.text)}`,
    text: e.text,
    translation: e.translation,
    minMonths: e.minMonths,
    maxMonths: e.maxMonths,
  }))
  const fromRoutines = routines
    .filter((r) => ROUTINE_MOMENT[r.id] === moment)
    .flatMap((r) =>
      r.phrases.map((p, i) => ({
        id: `${STARTER_ID_PREFIX}r-${r.id}-${i}`,
        text: p.spanish,
        translation: p.english,
        minMonths: p.minMonths,
        maxMonths: p.maxMonths,
      })),
    )
  const seen = new Set<string>()
  return [...authored, ...fromRoutines].filter((b) => {
    const key = normalizePhraseText(b.text)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * A moment's built-in phrases as read-only Phrase rows: the authored set plus
 * the matching baby routine, filtered to the child's age (everything when no
 * birthdate is set) with lines written for this age first.
 */
export function getStarterPhrases(moment: PhraseMoment, months: number | null = null): Phrase[] {
  const fitting = builtInsFor(moment).filter((b) => fitsAge(b, months))
  const ordered = [
    ...fitting.filter((b) => isAgeSpecific(b, months)),
    ...fitting.filter((b) => !isAgeSpecific(b, months)),
  ]
  return ordered.map((b) => ({
    id: b.id,
    text: b.text,
    translation: b.translation,
    moment,
    source: "generated",
    state: "nueva",
    timesUsed: 0,
    timesPracticed: 0,
    createdAt: STARTER_DATE,
    lastTouchedAt: STARTER_DATE,
  }))
}
