"use client"

// Repasar (refresh Phase 3): one short session for job 5 that mixes what's due.
// About five minutes:
//   - up to 8 flashcards: due words across every pack, topped up with new
//     words when fewer are due (decision 2, buildRepasarDeck)
//   - 3 grammar questions: this week's top pattern, else the weakest topic,
//     else the first topic not yet tried
//   - 1 saved phrase to recall: the practicando phrase touched longest ago,
//     else the oldest nueva one
// Every result goes through the same writers as the separate flows
// (recordReview / recordAttempt / updatePhrase), so Palabras, Práctica and
// Frases all see it. No session table (decision 8).

import { coveredTopics, itemsForTopic } from "@/lib/exercises/content"
import { isClientGradable } from "@/lib/exercises/grade"
import { topicMastery } from "@/lib/exercises/store"
import type { ExerciseItem } from "@/lib/exercises/types"
import { getPhrase, listPhrases, updatePhrase } from "@/lib/phrases/store"
import type { Phrase } from "@/lib/phrases/types"
import { sentenceCase, shuffle } from "@/lib/utils"
import { buildRepasarDeck } from "@/lib/vocab/store"
import type { VocabWord } from "@/lib/vocab/types"
import { weakestTopic, weeklyPattern, type FocusTopic } from "./focus"

export const REPASAR_CARDS = 8
export const REPASAR_QUESTIONS = 3

export interface RepasarPlan {
  cards: VocabWord[]
  grammar: { topic: FocusTopic; why: "semana" | "flojo" | "nuevo"; items: ExerciseItem[] } | null
  phrase: Phrase | null
}

/** The first topic, in taxonomy order, never tried yet: somewhere to start. */
function firstUntried(): FocusTopic | null {
  const c = coveredTopics().find((t) => topicMastery(t.topic.id).attemptCount === 0)
  return c ? { id: c.topic.id, label: sentenceCase(c.topic.spanish ?? c.topic.title) } : null
}

export function buildRepasarPlan(now = new Date()): RepasarPlan {
  const cards = buildRepasarDeck(REPASAR_CARDS, now)

  const pattern = weeklyPattern(now)
  const weakest = pattern ? null : weakestTopic()
  const fresh = pattern || weakest ? null : firstUntried()
  const topic = pattern ?? weakest ?? fresh
  const items = topic
    ? shuffle(itemsForTopic(topic.id).filter(isClientGradable)).slice(0, REPASAR_QUESTIONS)
    : []
  const grammar =
    topic && items.length
      ? { topic, why: pattern ? ("semana" as const) : weakest ? ("flojo" as const) : ("nuevo" as const), items }
      : null

  const library = listPhrases().filter((p) => p.text && p.translation)
  const oldest = (state: Phrase["state"]) =>
    library.filter((p) => p.state === state).sort((a, b) => a.lastTouchedAt.localeCompare(b.lastTouchedAt))[0]
  const phrase = oldest("practicando") ?? oldest("nueva") ?? null

  return { cards, grammar, phrase }
}

export function isEmptyPlan(plan: RepasarPlan): boolean {
  return plan.cards.length === 0 && !plan.grammar && !plan.phrase
}

/** One phrase recall, self-graded. Counts as practice either way; nothing is lost on a miss. */
export function recordPhraseRecall(id: string) {
  const phrase = getPhrase(id)
  if (!phrase) return
  updatePhrase(id, { timesPracticed: (phrase.timesPracticed ?? 0) + 1, lastTouchedAt: new Date().toISOString() })
}
