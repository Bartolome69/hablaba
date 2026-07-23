// Table-shaped localStorage store for Exercises progress (attempts) plus derived
// mastery. Mirrors lib/criar/store.ts: the `exercises_attempts` key maps 1:1 to
// a future SQL table, so swapping this for Supabase is a drop-in. Client-only.

import type { Attempt, AttemptFormat, MasteryBand, TopicMastery } from "./types"

const KEY = "exercises_attempts"

function read(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attempt[]) : []
  } catch {
    return []
  }
}

function write(rows: Attempt[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {}
}

export function listAttempts(): Attempt[] {
  return read()
}

export function attemptsForTopic(topicId: string): Attempt[] {
  return read().filter((a) => a.topicId === topicId)
}

export function recordAttempt(input: {
  itemId: string
  topicId: string
  format: AttemptFormat
  correct: boolean
  answerGiven: string
}): Attempt {
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    itemId: input.itemId,
    topicId: input.topicId,
    format: input.format,
    correct: input.correct,
    answerGiven: input.answerGiven,
    createdAt: new Date().toISOString(),
  }
  write([attempt, ...read()])
  return attempt
}

export function resetProgress() {
  write([])
}

// --- derived mastery (never stored; computed from attempts) ---
//
// Phase 1: simple accuracy over all attempts for the topic. Phase 2 will move to
// the signed, format-capped, time-decaying score described in the README.

function bandFor(score: number, attemptCount: number): MasteryBand {
  if (attemptCount === 0) return "untested"
  if (score >= 80) return "confident"
  if (score >= 50) return "learning"
  return "mislearned"
}

export function topicMastery(topicId: string): TopicMastery {
  const attempts = attemptsForTopic(topicId)
  if (attempts.length === 0) {
    return { topicId, score: 0, band: "untested", attemptCount: 0, lastPracticedAt: null }
  }
  const correct = attempts.filter((a) => a.correct).length
  const score = Math.round((correct / attempts.length) * 100)
  const lastPracticedAt = attempts.reduce(
    (max, a) => (a.createdAt > max ? a.createdAt : max),
    attempts[0].createdAt,
  )
  return {
    topicId,
    score,
    band: bandFor(score, attempts.length),
    attemptCount: attempts.length,
    lastPracticedAt,
  }
}
