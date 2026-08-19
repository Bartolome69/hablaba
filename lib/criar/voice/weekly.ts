"use client"

// Aggregation for the weekly report ("Tu semana"): the 7-day group-by over
// criar_voice_observations that the whole observation schema was designed
// around, plus session stats and the speaking streak. Pure reads over the
// store — the one LLM call (narrative) goes through /api/analyze/weekly.

import { listRecentVoiceObservations, listVoiceSessions, listVoiceTurns, todayKey } from "../store"
import type { CriarVoiceObservation, CriarVoiceSession } from "./types"
import { isPracticeableTag } from "./types"

const WINDOW_DAYS = 7

export interface WeeklyPattern {
  tag: string
  count: number
  examples: { original?: string; corrected?: string; note?: string }[]
}

export interface WeeklyData {
  stats: { sessions: number; minutes: number; userTurns: number; streakDays: number }
  patterns: WeeklyPattern[]
  celebrations: string[] // target phrases actually used
  repetitions: { word: string; alternatives?: string }[]
  /** Every grammar correction of the week — the review stack's material. */
  corrections: CriarVoiceObservation[]
  observationCount: number
}

/**
 * Consecutive days with at least one conversation, counting back from today —
 * or from yesterday, so the streak isn't broken at breakfast before today's
 * walk has happened.
 */
export function speakingStreakDays(sessions: CriarVoiceSession[], now: Date = new Date()): number {
  const days = new Set(sessions.map((s) => s.startedAt.slice(0, 10)))
  const cursor = new Date(now)
  if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(todayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeWeeklyData(childId: string, now: Date = new Date()): WeeklyData {
  const allSessions = listVoiceSessions(childId)
  const weekSessions = allSessions.filter(
    (s) => now.getTime() - new Date(s.startedAt).getTime() <= WINDOW_DAYS * 86400_000,
  )

  const minutes = Math.round(
    weekSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60,
  )
  const userTurns = weekSessions.reduce(
    (sum, s) => sum + listVoiceTurns(s.id).filter((t) => t.speaker === "user").length,
    0,
  )

  const observations = listRecentVoiceObservations(childId, WINDOW_DAYS)

  // The group-by: grammar + avoidance findings bucketed by taxonomy tag.
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
      sessions: weekSessions.length,
      minutes,
      userTurns,
      streakDays: speakingStreakDays(allSessions, now),
    },
    patterns,
    celebrations,
    repetitions,
    corrections,
    observationCount: observations.length,
  }
}

// --- narrative, cached so reopening the report doesn't re-bill ---

const CACHE_KEY = "criar_voice_weekly_cache"

interface WeeklyNarrativeCache {
  key: string
  narrative: string
  tagLabels: Record<string, string>
}

/** Regenerate when the day rolls over or new data lands — otherwise serve cached. */
function cacheKeyFor(data: WeeklyData): string {
  return `${todayKey()}:${data.stats.sessions}:${data.observationCount}`
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
