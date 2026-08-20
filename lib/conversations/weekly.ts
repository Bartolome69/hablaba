"use client"

// "Tu semana" over the unified stores — every conversation feeds it now, text
// and voice alike. Ported from the Grow module when it collapsed; the fuller
// aggregation layer (IA phase 3) will absorb this, but the report must not go
// dark in the meantime.

import { isPracticeableTag } from "@/lib/voice/types"
import { listConversations, listRecentObservations, listTurns } from "./store"
import type { Conversation, ConversationObservation } from "./types"

const WINDOW_DAYS = 7

export interface WeeklyPattern {
  tag: string
  count: number
  examples: { original?: string; corrected?: string; note?: string }[]
}

export interface WeeklyData {
  stats: { sessions: number; minutes: number; userTurns: number; streakDays: number }
  patterns: WeeklyPattern[]
  celebrations: string[]
  repetitions: { word: string; alternatives?: string }[]
  corrections: ConversationObservation[]
  observationCount: number
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

/** Consecutive days with conversation activity, counting back from today or yesterday. */
export function speakingStreakDays(conversations: Conversation[], now: Date = new Date()): number {
  const days = new Set<string>()
  for (const c of conversations) {
    days.add(dayKey(c.startedAt))
    days.add(dayKey(c.lastTurnAt))
  }
  const cursor = new Date(now)
  const localKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  if (!days.has(localKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(localKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeWeeklyData(now: Date = new Date()): WeeklyData {
  const all = listConversations()
  const inWindow = all.filter(
    (c) => now.getTime() - new Date(c.lastTurnAt).getTime() <= WINDOW_DAYS * 86400_000,
  )

  // Voice minutes are exact (accumulated per stretch). Typed minutes arrive
  // properly in IA phase 4; until then this understates mixed threads.
  const minutes = Math.round(inWindow.reduce((sum, c) => sum + (c.voiceSeconds ?? 0), 0) / 60)
  const userTurns = inWindow.reduce(
    (sum, c) => sum + listTurns(c.id).filter((t) => t.speaker === "user").length,
    0,
  )

  const observations = listRecentObservations(WINDOW_DAYS)

  const byTag = new Map<string, WeeklyPattern>()
  for (const o of observations) {
    if (o.type !== "error_grammar" && o.type !== "avoidance") continue
    const tag = o.detail.tag ?? "other"
    let bucket = byTag.get(tag)
    if (!bucket) {
      bucket = { tag, count: 0, examples: [] }
      byTag.set(tag, bucket)
    }
    bucket.count++
    if (bucket.examples.length < 2) {
      bucket.examples.push({
        original: o.detail.original,
        corrected: o.detail.corrected,
        note: o.detail.note,
      })
    }
  }
  const patterns = [...byTag.values()].sort((a, b) => b.count - a.count).slice(0, 5)

  const celebrations = observations
    .filter((o) => o.type === "target_phrase_used" && o.detail.original)
    .map((o) => o.detail.original as string)
    .slice(0, 8)

  const repetitions = observations
    .filter((o) => o.type === "repetition" && o.detail.original)
    .map((o) => ({ word: o.detail.original as string, alternatives: o.detail.corrected }))
    .slice(0, 4)

  const corrections = observations.filter(
    (o) => o.type === "error_grammar" && o.detail.original && o.detail.corrected,
  )

  return {
    stats: {
      sessions: inWindow.length,
      minutes,
      userTurns,
      streakDays: speakingStreakDays(all, now),
    },
    patterns,
    celebrations,
    repetitions,
    corrections,
    observationCount: observations.length,
  }
}

// --- narrative, cached so reopening the report doesn't re-bill ---

const CACHE_KEY = "weekly_narrative_cache"

interface WeeklyNarrativeCache {
  key: string
  narrative: string
  tagLabels: Record<string, string>
}

function cacheKeyFor(data: WeeklyData, now: Date = new Date()): string {
  const d = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  return `${d}:${data.stats.sessions}:${data.observationCount}`
}

export async function fetchWeeklyNarrative(
  data: WeeklyData,
): Promise<{ narrative: string; tagLabels: Record<string, string> }> {
  const key = cacheKeyFor(data)
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const cached = JSON.parse(raw) as WeeklyNarrativeCache
      if (cached.key === key && cached.narrative) {
        return { narrative: cached.narrative, tagLabels: cached.tagLabels ?? {} }
      }
    }
  } catch {}

  const res = await fetch("/api/analyze/weekly", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      stats: data.stats,
      patterns: data.patterns.filter((p) => isPracticeableTag(p.tag) || p.tag === "other"),
      celebrations: data.celebrations,
      repetitions: data.repetitions,
    }),
  })
  if (!res.ok) throw new Error(`Weekly API error: ${res.status}`)
  const result = (await res.json()) as { narrative: string; tagLabels: Record<string, string> }

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ key, narrative: result.narrative, tagLabels: result.tagLabels }),
    )
  } catch {}

  return result
}
