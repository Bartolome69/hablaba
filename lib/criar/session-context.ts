"use client"

// Curriculum context for conversation sessions (sparring and voice): the last
// ~week of pack phrases plus the capture mini-lessons the parent is working
// on. Extracted from use-sparring.ts so voice mode feeds on the same material
// rather than growing a second, drifting version of this query.

import type { CriarChild } from "./types"
import type { SparringContext } from "./prompts"
import { describeAge } from "./stage"
import { listPacks, listRecentVoiceObservations } from "./store"

/**
 * The learning flywheel: last week's analysis findings, distilled into hints
 * the voice partner can act on. Grammar/avoidance observations grouped by tag,
 * top 3 recurring, each with one real example from the parent's own mouth.
 *
 * The partner is told to create natural openings for these structures WITHOUT
 * announcing it — targeted practice that still feels like conversation
 * (graduated recall applied to chat, not a lesson plan).
 */
export function assembleFocusAreas(childId: string): string[] {
  const byTag = new Map<string, { count: number; example: string }>()
  for (const o of listRecentVoiceObservations(childId, 7)) {
    if (o.type !== "error_grammar" && o.type !== "avoidance") continue
    const tag = o.detail.tag
    if (!tag || tag === "other") continue
    const existing = byTag.get(tag)
    const example =
      o.detail.original && o.detail.corrected
        ? `they said "${o.detail.original}", natural would be "${o.detail.corrected}"`
        : (o.detail.note ?? "")
    if (existing) existing.count++
    else byTag.set(tag, { count: 1, example })
  }
  return [...byTag.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)
    .map(([tag, v]) => `${tag.replace(/-/g, " ")} — ${v.example}`)
    .filter((s) => s.length > 5)
}

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
