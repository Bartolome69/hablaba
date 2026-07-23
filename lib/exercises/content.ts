// Runtime content registry for the Exercises module.
//
// Content packs are static JSON validated by scripts/validate-content.mjs and
// the schema in schema.ts. This module imports the ingested packs and exposes
// them to the app grouped by topic. When /ingest-pdf produces a new pack, add
// one import + one line to the `sources` array below.

import type { ExerciseSource, ExerciseItem, SourceLesson, ExerciseTopic } from "./types"
import { topics as taxonomyTopics } from "./taxonomy"
import { isClientGradable } from "./grade"

import jenniferPorPara from "./content/jennifer-por-para.json"
import presentPerfect from "./content/simple-spanish-present-perfect.json"
import reflexiveVerbs from "./content/simple-spanish-reflexive-verbs.json"
import conditional from "./content/simple-spanish-conditional.json"

// The example pack (por-vs-para-example.json) is intentionally excluded — it's a
// schema reference, not real teacher content.
export const sources = [
  jenniferPorPara,
  presentPerfect,
  reflexiveVerbs,
  conditional,
] as unknown as ExerciseSource[]

export const allItems: ExerciseItem[] = sources.flatMap((s) => s.items)

export function itemsForTopic(topicId: string): ExerciseItem[] {
  return allItems.filter((i) => i.topicId === topicId)
}

export function lessonsForTopic(topicId: string): SourceLesson[] {
  return sources.flatMap((s) => s.lessons).filter((l) => l.topicId === topicId)
}

export interface CoveredTopic {
  topic: ExerciseTopic
  /** Number of on-device–gradable questions (what a quiz can currently serve). */
  quizCount: number
  /** Total items, including open-production (LLM-graded, phase 2). */
  totalCount: number
}

/** Taxonomy topics that actually have content, in taxonomy order. */
export function coveredTopics(): CoveredTopic[] {
  return taxonomyTopics
    .map((topic) => {
      const items = itemsForTopic(topic.id)
      return {
        topic,
        quizCount: items.filter(isClientGradable).length,
        totalCount: items.length,
      }
    })
    .filter((t) => t.totalCount > 0)
}
