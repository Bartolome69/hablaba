// On-device grading for Exercises. Client-gradable item types (choice, cloze,
// conjugation, transform-with-answers) are checked here by normalized string
// match. Open-production items need the LLM grading route (phase 2).

import type { ExerciseItem } from "./types"

/** Lowercase, strip accents and punctuation, collapse whitespace — so "Para" == "para" == "pará". */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining diacritics
    .replace(/[¡!¿?.,;:"'()]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** True if the item can be graded without an LLM. */
export function isClientGradable(item: ExerciseItem): boolean {
  if (item.type === "open") return false
  return "answers" in item && (item.answers?.length ?? 0) > 0
}

/** Accepted answers for display (e.g. showing the correct answer after a miss). */
export function acceptedAnswers(item: ExerciseItem): string[] {
  return "answers" in item && item.answers ? item.answers : []
}

export function gradeAnswer(item: ExerciseItem, given: string): boolean {
  const answers = acceptedAnswers(item)
  if (answers.length === 0) return false
  const g = normalizeAnswer(given)
  return answers.some((a) => normalizeAnswer(a) === g)
}
