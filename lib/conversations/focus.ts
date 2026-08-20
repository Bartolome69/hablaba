"use client"

// The learning flywheel: recent analysis findings, distilled into hints the
// partner can act on — grammar/avoidance observations grouped by tag, top 3
// recurring, each with one real example from the learner's own mouth. The
// partner is told to create natural openings for these WITHOUT announcing it.

import { listRecentObservations } from "./store"

export function assembleFocusAreas(): string[] {
  const byTag = new Map<string, { count: number; example: string }>()
  for (const o of listRecentObservations(7)) {
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
