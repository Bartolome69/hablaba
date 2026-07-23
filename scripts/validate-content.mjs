// Build/ingest gate for Exercises content packs.
//
// Runs with plain Node (no TS toolchain): `npm run validate:content`.
// Reads every pack in lib/exercises/content/ and checks the load-bearing
// invariants. Exits non-zero on the first failing file so malformed packs never
// reach the app.
//
// NOTE: lib/exercises/schema.ts is the CANONICAL schema (the app validates at
// load with it). This file mirrors the same invariants for a toolchain-free
// gate — keep the two in sync when the schema changes.

import { readFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { z } from "zod"
import taxonomy from "../lib/exercises/taxonomy.json" with { type: "json" }

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(HERE, "..", "lib", "exercises", "content")

const TOPIC_IDS = taxonomy.map((t) => t.id)
const topicId = z.enum(TOPIC_IDS)

const example = z.object({
  spanish: z.string().min(1),
  english: z.string().min(1),
  note: z.string().optional(),
})

const lesson = z.object({
  topicId,
  summary: z.string().min(1),
  examples: z.array(example).min(1),
})

const base = {
  id: z.string().min(1),
  topicId,
  prompt: z.string().min(1),
  promptEnglish: z.string().optional(),
  explanation: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
}

// discriminatedUnion members must be plain objects — cross-field rules go in .superRefine.
const item = z
  .discriminatedUnion("type", [
    z.object({ ...base, type: z.literal("choice"), options: z.array(z.string().min(1)).min(2), answers: z.array(z.string().min(1)).min(1) }),
    z.object({ ...base, type: z.literal("cloze"), answers: z.array(z.string().min(1)).min(1) }),
    z.object({ ...base, type: z.literal("conjugation"), answers: z.array(z.string().min(1)).min(1) }),
    z.object({ ...base, type: z.literal("transform"), answers: z.array(z.string().min(1)).optional(), guidance: z.string().optional() }),
    z.object({ ...base, type: z.literal("open"), guidance: z.string().min(1), sampleAnswer: z.string().optional() }),
  ])
  .superRefine((it, ctx) => {
    if (it.type === "choice" && !it.answers.every((a) => it.options.includes(a))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "choice answers must all appear in options", path: ["answers"] })
    }
    if (it.type === "transform" && !((it.answers?.length ?? 0) > 0 || it.guidance)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "transform items need either answers or guidance" })
    }
  })

const source = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    teacher: z.string().optional(),
    date: z.string().optional(),
    description: z.string().optional(),
    topicIds: z.array(topicId).min(1),
    lessons: z.array(lesson).min(1),
    items: z.array(item).min(1),
    ingestedAt: z.string().optional(),
  })
  .refine((s) => new Set(s.items.map((i) => i.id)).size === s.items.length, { message: "item ids must be unique within a source", path: ["items"] })
  .refine((s) => s.items.every((i) => s.topicIds.includes(i.topicId)), { message: "every item.topicId must be declared in source.topicIds", path: ["items"] })
  .refine((s) => s.lessons.every((l) => s.topicIds.includes(l.topicId)), { message: "every lesson.topicId must be declared in source.topicIds", path: ["lessons"] })

function main() {
  let files
  try {
    files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"))
  } catch {
    console.log("No content directory yet — nothing to validate.")
    return
  }

  if (files.length === 0) {
    console.log("No content packs found — nothing to validate.")
    return
  }

  const seenSourceIds = new Map()
  let failed = 0

  for (const file of files) {
    const path = join(CONTENT_DIR, file)
    let parsed
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"))
    } catch (err) {
      console.error(`✗ ${file}: invalid JSON — ${err.message}`)
      failed++
      continue
    }

    const result = source.safeParse(parsed)
    if (!result.success) {
      console.error(`✗ ${file}:`)
      for (const issue of result.error.issues) {
        console.error(`    ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      }
      failed++
      continue
    }

    const prior = seenSourceIds.get(result.data.id)
    if (prior) {
      console.error(`✗ ${file}: duplicate source id "${result.data.id}" (also in ${prior})`)
      failed++
      continue
    }
    seenSourceIds.set(result.data.id, file)

    console.log(`✓ ${file} — ${result.data.items.length} items across ${result.data.topicIds.length} topic(s)`)
  }

  if (failed > 0) {
    console.error(`\n${failed} pack(s) failed validation.`)
    process.exit(1)
  }
  console.log(`\nAll ${files.length} pack(s) valid.`)
}

main()
