// Content-pack schema for the Exercises module — the single source of truth for
// the shape of an ingested teacher PDF.
//
// A "source" is the durable artifact produced by ingesting one PDF (see the
// /ingest-pdf skill and lib/exercises/README.md). Packs live as versioned JSON
// under lib/exercises/content/ and are validated against this schema both at
// ingest time and by scripts/validate-content.mjs. Progress (attempts, mastery)
// is NOT here — that is runtime state kept in localStorage (see types.ts).

import { z } from "zod"
import taxonomy from "./taxonomy.json"

/** Canonical topic ids, derived from the taxonomy so packs can't reference a topic that doesn't exist. */
export const TOPIC_IDS = taxonomy.map((t) => t.id) as [string, ...string[]]
const topicId = z.enum(TOPIC_IDS)

/** Ascending evidence strength — see README. */
export const EXERCISE_TYPES = ["choice", "cloze", "conjugation", "transform", "open"] as const

const exampleSchema = z.object({
  spanish: z.string().min(1),
  english: z.string().min(1),
  note: z.string().optional(),
})

const lessonSchema = z.object({
  topicId,
  /** The rule, in the teacher's framing — shown alongside the topic and on misses. */
  summary: z.string().min(1),
  examples: z.array(exampleSchema).min(1),
})

const itemBase = {
  id: z.string().min(1),
  topicId,
  /** Sentence or question. A blank to fill is written as "___". */
  prompt: z.string().min(1),
  promptEnglish: z.string().optional(),
  /** The rule/why, grounded in the source. Shown when the learner misses. */
  explanation: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
}

// Client-graded types carry accepted answers; production types carry grader guidance.
// answers are compared accent- and case-insensitively by the grader (not here).

// discriminatedUnion members must be plain objects (no .refine), so
// cross-field rules live in the .superRefine below.
const choiceItem = z.object({
  ...itemBase,
  type: z.literal("choice"),
  options: z.array(z.string().min(1)).min(2),
  answers: z.array(z.string().min(1)).min(1),
})

const clozeItem = z.object({
  ...itemBase,
  type: z.literal("cloze"),
  answers: z.array(z.string().min(1)).min(1),
})

const conjugationItem = z.object({
  ...itemBase,
  type: z.literal("conjugation"),
  answers: z.array(z.string().min(1)).min(1),
})

const transformItem = z.object({
  ...itemBase,
  type: z.literal("transform"),
  answers: z.array(z.string().min(1)).optional(),
  /** For open-ended transforms with no single answer: what a correct rewrite must do. */
  guidance: z.string().optional(),
})

const openItem = z.object({
  ...itemBase,
  type: z.literal("open"),
  /** What a correct free-text answer must demonstrate — fed to the LLM grader. */
  guidance: z.string().min(1),
  sampleAnswer: z.string().optional(),
})

export const itemSchema = z
  .discriminatedUnion("type", [choiceItem, clozeItem, conjugationItem, transformItem, openItem])
  .superRefine((it, ctx) => {
    if (it.type === "choice" && !it.answers.every((a) => it.options.includes(a))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "choice answers must all appear in options", path: ["answers"] })
    }
    if (it.type === "transform" && !((it.answers?.length ?? 0) > 0 || it.guidance)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "transform items need either answers or guidance" })
    }
  })

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  teacher: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  /** Canonical topics this source covers. Every lesson/item topicId must be in here. */
  topicIds: z.array(topicId).min(1),
  lessons: z.array(lessonSchema).min(1),
  items: z.array(itemSchema).min(1),
  ingestedAt: z.string().optional(),
})
  .refine((s) => new Set(s.items.map((i) => i.id)).size === s.items.length, {
    message: "item ids must be unique within a source",
    path: ["items"],
  })
  .refine((s) => s.items.every((i) => s.topicIds.includes(i.topicId)), {
    message: "every item.topicId must be declared in source.topicIds",
    path: ["items"],
  })
  .refine((s) => s.lessons.every((l) => s.topicIds.includes(l.topicId)), {
    message: "every lesson.topicId must be declared in source.topicIds",
    path: ["lessons"],
  })

export type ExerciseType = (typeof EXERCISE_TYPES)[number]
export type LessonExample = z.infer<typeof exampleSchema>
export type SourceLesson = z.infer<typeof lessonSchema>
export type ExerciseItem = z.infer<typeof itemSchema>
export type ExerciseSource = z.infer<typeof sourceSchema>
