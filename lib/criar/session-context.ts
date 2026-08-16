"use client"

// Curriculum context for conversation sessions (sparring and voice): the last
// ~week of pack phrases plus the capture mini-lessons the parent is working
// on. Extracted from use-sparring.ts so voice mode feeds on the same material
// rather than growing a second, drifting version of this query.

import type { CriarChild } from "./types"
import type { SparringContext } from "./prompts"
import { describeAge } from "./stage"
import { listPacks } from "./store"

export function assembleSessionContext(child: CriarChild): SparringContext {
  const packs = listPacks(child.id).slice(0, 5) // roughly this week
  const packPhrases = packs.flatMap((p) => p.phrases.map((ph) => ph.spanish))
  const packLessons = packs.flatMap((p) =>
    p.captureLessons.map((l) => ({ request: l.request, spanish: l.spanish })),
  )
  return {
    childName: child.name,
    ageDescription: describeAge(child.birthdate),
    packPhrases,
    captureLessons: packLessons,
  }
}
