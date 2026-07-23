// Canonical grammar taxonomy for the Exercises module. Topics are fixed and
// live in code (taxonomy.json is the raw data, shared with the content
// validator). Ingested PDFs map onto these topics — they never invent new ones.
// See lib/exercises/README.md.

import raw from "./taxonomy.json"
import type { ExerciseTopic, GrammarArea } from "./types"

export const topics: ExerciseTopic[] = raw as ExerciseTopic[]

const byId = new Map(topics.map((t) => [t.id, t]))

export function getTopic(id: string): ExerciseTopic | undefined {
  return byId.get(id)
}

export function isTopicId(id: string): boolean {
  return byId.has(id)
}

const AREA_ORDER: GrammarArea[] = ["verbs", "tenses", "mood", "prepositions", "pronouns"]

export const AREA_LABELS: Record<GrammarArea, string> = {
  verbs: "Verbs",
  tenses: "Tenses",
  mood: "Mood",
  prepositions: "Prepositions",
  pronouns: "Pronouns",
}

/** Topics grouped by area in display order — the shape the topic map UI wants. */
export function topicsByArea(): { area: GrammarArea; topics: ExerciseTopic[] }[] {
  return AREA_ORDER.map((area) => ({
    area,
    topics: topics.filter((t) => t.area === area),
  })).filter((g) => g.topics.length > 0)
}
