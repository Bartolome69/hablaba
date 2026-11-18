"use client"

// What to practise next, from what's already stored: this week's most frequent
// grammar pattern (from conversation analysis) and the weakest grammar topic
// (from quiz attempts). Hoy's Repasar card reads these today; the Repasar
// session (refresh Phase 3) builds its grammar questions from the same two.

import { computeWeeklyData } from "@/lib/conversations/weekly"
import { coveredTopics } from "@/lib/exercises/content"
import { topicMastery } from "@/lib/exercises/store"
import { getTopic } from "@/lib/exercises/taxonomy"
import { isPracticeableTag } from "@/lib/voice/types"
import { sentenceCase } from "@/lib/utils"

export interface FocusTopic {
  id: string
  /** Spanish name, sentence case: "Pretérito o imperfecto". */
  label: string
}

function asFocus(id: string): FocusTopic | null {
  const topic = getTopic(id)
  return topic ? { id, label: sentenceCase(topic.spanish ?? topic.title) } : null
}

/** This week's top grammar pattern that has a quiz behind it, if any. */
export function weeklyPattern(now = new Date()): (FocusTopic & { count: number }) | null {
  const covered = new Set(coveredTopics().map((c) => c.topic.id))
  for (const p of computeWeeklyData(now).patterns) {
    if (p.tag && isPracticeableTag(p.tag) && covered.has(p.tag)) {
      const focus = asFocus(p.tag)
      if (focus) return { ...focus, count: p.count }
    }
  }
  return null
}

/**
 * The weakest topic the learner has actually practised: proven wrong first,
 * then still learning, lowest score first. Null when nothing has been tried
 * yet, because "weakest" means nothing before the first quiz.
 */
export function weakestTopic(): FocusTopic | null {
  const tried = coveredTopics()
    .map((c) => topicMastery(c.topic.id))
    .filter((m) => m.attemptCount > 0 && (m.band === "mislearned" || m.band === "learning"))
    .sort((a, b) => (a.band === b.band ? a.score - b.score : a.band === "mislearned" ? -1 : 1))
  return tried[0] ? asFocus(tried[0].topicId) : null
}
