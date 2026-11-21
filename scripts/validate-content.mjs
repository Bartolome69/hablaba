// Build/ingest gate for the authored content: Exercises packs, and (refresh
// Phase 5) the vocabulary packs, the phrase moments and the routines, plus
// the tú rule across all of them.
//
// Runs with plain Node (no TS toolchain): `npm run validate:content`.
// Reads every pack in lib/exercises/content/ and checks the load-bearing
// invariants. Exits non-zero on the first failing file so malformed packs never
// reach the app.
//
// NOTE: lib/exercises/schema.ts is the CANONICAL schema (the app validates at
// load with it). This file mirrors the same invariants for a toolchain-free
// gate — keep the two in sync when the schema changes.

import { existsSync, readFileSync, readdirSync } from "node:fs"
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

  failed += validateVocab() + validateMoments() + validateTu()

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed validation.`)
    process.exit(1)
  }
  console.log(`\nAll ${files.length} grammar pack(s), the vocabulary packs, the phrase moments and the tú rule: valid.`)
}

// --- vocabulary packs (lib/vocab/content/*.json) ---------------------------

const ROOT = join(HERE, "..")
const VOCAB_DIR = join(ROOT, "lib", "vocab", "content")
const MOMENTS_FILE = join(ROOT, "lib", "phrases", "content", "moments.json")
const ROUTINES_FILE = join(ROOT, "lib", "routines.ts")
const VOSEO_FILE = join(ROOT, "lib", "voseo.ts")
const CUENTOS_FIXTURES = join(ROOT, "tests", "fixtures", "cuentos")
const MOMENT_IDS = ["despertar", "cambiar", "comida", "juego", "paseo", "baño", "calmar", "dormir"]

const norm = (t) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¡!¿?.,;:'"«»“”‘’]/g, "").replace(/\s+/g, " ").trim()

const vocabWord = z.object({
  id: z.string().min(1),
  spanish: z.string().min(1),
  article: z.enum(["el", "la", "los", "las", ""]),
  gender: z.enum(["m", "f", "invariable"]),
  english: z.string().min(1),
  group: z.string().min(1),
  example: z.string().optional(),
  exampleTranslation: z.string().optional(),
  draft: z.boolean().optional(),
})

function validateVocab() {
  let failed = 0
  const ids = new Map()
  const spellings = new Map()
  for (const file of readdirSync(VOCAB_DIR).filter((f) => f.endsWith(".json"))) {
    const words = JSON.parse(readFileSync(join(VOCAB_DIR, file), "utf8"))
    const result = z.array(vocabWord).safeParse(words)
    if (!result.success) {
      console.error(`✗ vocab/${file}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`)
      failed++
      continue
    }
    for (const w of result.data) {
      if (ids.has(w.id)) (console.error(`✗ vocab/${file}: duplicate id "${w.id}" (also in ${ids.get(w.id)})`), failed++)
      ids.set(w.id, file)
      const key = norm(w.spanish)
      if (spellings.has(key)) (console.error(`✗ vocab/${file}: "${w.spanish}" is also in ${spellings.get(key)}`), failed++)
      spellings.set(key, file)
    }
  }
  if (!failed) console.log(`✓ vocabulary: ${ids.size} words, no duplicate ids or spellings`)
  return failed
}

// --- phrase moments (lib/phrases/content/moments.json) + baby routines -------

const momentEntry = z
  .object({
    text: z.string().min(1),
    translation: z.string().min(1),
    minMonths: z.number().int().min(0).optional(),
    maxMonths: z.number().int().min(0).optional(),
    draft: z.boolean().optional(),
  })
  .refine((e) => e.minMonths === undefined || e.maxMonths === undefined || e.minMonths <= e.maxMonths, {
    message: "minMonths must be <= maxMonths",
  })

/** Spanish strings from lib/routines.ts (TS, so read by pattern, not import). */
function routineSpanish() {
  const src = readFileSync(ROUTINES_FILE, "utf8")
  return [...src.matchAll(/spanish:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])
}

function validateMoments() {
  let failed = 0
  const data = JSON.parse(readFileSync(MOMENTS_FILE, "utf8"))
  const keys = Object.keys(data)
  if (keys.join() !== MOMENT_IDS.join()) {
    console.error(`✗ moments.json: keys must be exactly ${MOMENT_IDS.join(", ")} in that order (got ${keys.join(", ")})`)
    failed++
  }
  const seen = new Map()
  let count = 0
  for (const id of keys) {
    const result = z.array(momentEntry).safeParse(data[id])
    if (!result.success) {
      console.error(`✗ moments.json ${id}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`)
      failed++
      continue
    }
    for (const e of result.data) {
      count++
      const key = norm(e.text)
      if (seen.has(key)) (console.error(`✗ moments.json ${id}: "${e.text}" duplicates ${seen.get(key)}`), failed++)
      seen.set(key, `moments.json ${id}`)
    }
  }
  // Baby routines are merged into the moments in the app: no line twice.
  for (const text of routineSpanish()) {
    const key = norm(text)
    if (seen.get(key)?.startsWith("moments.json")) (console.error(`✗ routines.ts: "${text}" duplicates ${seen.get(key)}`), failed++)
  }
  if (!failed) console.log(`✓ phrase moments: ${count} lines in ${keys.length} moments, no duplicates with the routines`)
  return failed
}

// --- the tú rule --------------------------------------------------------------
// Taught Spanish is tú, always. The blocklist is lib/voseo.ts's own (read by
// pattern so the two can't drift): whole words, deliberately not morphological.

function validateTu() {
  const src = readFileSync(VOSEO_FILE, "utf8")
  const list = src.slice(src.indexOf("VOSEO_FORMS"), src.indexOf("]", src.indexOf("VOSEO_FORMS")))
  const forms = [...list.matchAll(/"([^"]+)"/g)].map((m) => m[1])
  const lower = (t) => ` ${t.toLowerCase().replace(/[¡!¿?.,;:'"«»“”‘’()]/g, " ").replace(/\s+/g, " ")} `
  const hit = (t) => forms.find((f) => lower(t).includes(` ${f} `))

  const lines = []
  for (const file of readdirSync(VOCAB_DIR).filter((f) => f.endsWith(".json")))
    for (const w of JSON.parse(readFileSync(join(VOCAB_DIR, file), "utf8"))) if (w.example) lines.push([`vocab/${file}`, w.example])
  const moments = JSON.parse(readFileSync(MOMENTS_FILE, "utf8"))
  for (const [id, entries] of Object.entries(moments)) for (const e of entries) lines.push([`moments.json ${id}`, e.text])
  for (const text of routineSpanish()) lines.push(["routines.ts", text])
  // Cuentos fixtures: the Spanish we expect a translated page to look like.
  if (existsSync(CUENTOS_FIXTURES))
    for (const file of readdirSync(CUENTOS_FIXTURES).filter((f) => f.endsWith(".es.txt")))
      for (const line of readFileSync(join(CUENTOS_FIXTURES, file), "utf8").split("\n").filter((l) => l.trim()))
        lines.push([`cuentos/${file}`, line])
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"))) {
    const pack = JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf8"))
    for (const it of pack.items ?? []) for (const t of [it.prompt, ...(it.answers ?? []), it.sampleAnswer].filter(Boolean)) lines.push([file, t])
    for (const l of pack.lessons ?? []) for (const ex of l.examples ?? []) lines.push([file, ex.spanish])
  }

  let failed = 0
  for (const [where, text] of lines) {
    const form = hit(text)
    if (form) (console.error(`✗ tú rule, ${where}: "${form}" in "${text}"`), failed++)
  }
  if (!failed) console.log(`✓ tú rule: ${lines.length} Spanish lines, no voseo`)
  return failed
}

main()
