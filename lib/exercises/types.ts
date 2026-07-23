// Types for the Exercises module.
//
// Two data families with different homes (see README.md):
//   - CONTENT (topics + ingested source packs) — static, versioned JSON in the
//     repo. Shapes live in schema.ts (zod) and taxonomy.json; re-exported here.
//   - PROGRESS (attempts, derived mastery) — runtime state in localStorage.
//     Table-shaped like lib/criar/store.ts so it can move to Supabase unchanged.

import type { ExerciseType } from "./schema"

export type { ExerciseType, ExerciseItem, ExerciseSource, SourceLesson, LessonExample } from "./schema"

// --- content: taxonomy ---

export type GrammarArea = "prepositions" | "tenses" | "mood" | "verbs" | "pronouns"
export type Cefr = "A1" | "A2" | "B1" | "B2"

export interface ExerciseTopic {
  id: string
  title: string // English display name
  spanish: string // the concept's Spanish name
  emoji: string
  cefr: Cefr
  area: GrammarArea
  blurb: string // one line describing the rule domain
}

// --- progress: attempts (localStorage, one row per answered item) ---

/** How the learner answered — recognition (choice) is weaker evidence than production (open). */
export type AttemptFormat = ExerciseType

export interface Attempt {
  id: string
  itemId: string
  topicId: string
  format: AttemptFormat
  correct: boolean
  answerGiven: string
  createdAt: string // ISO datetime
}

// --- progress: derived mastery (never stored — computed from attempts) ---

export type MasteryBand = "untested" | "mislearned" | "learning" | "confident"

export interface TopicMastery {
  topicId: string
  /** -100..+100, Kwiziq-style: negative = confidently wrong, capped by best format answered. */
  score: number
  band: MasteryBand
  attemptCount: number
  lastPracticedAt: string | null // ISO datetime
}
