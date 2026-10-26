"use client"

// The learner's side of Palabras. Key `vocab_words`, table-shaped for the
// future SQL move, same contract as lib/phrases/store.ts.
//
// Every authored pack is PRELOADED: its words are studyable from the first
// visit, with no saving step. A catalog word the learner has never reviewed
// has no row; it's served as a "virtual" word (id `cat:<catalog id>`, box 0)
// and its row is written the first time it's reviewed. That keeps the table
// to words with real history, plus the words the learner added themselves.
//
// Progress is a review schedule, not a state machine: nobody can observe you
// knowing "la rodilla", so the honest signal is the Leitner ladder in
// schedule.ts.

import { getCatalogWord, packLabel, packOfCatalogWord, PACK_ORDER, SETS } from "./catalog"
import { BOX_INTERVAL_DAYS, LEARNED_BOX, bandFor, initialSchedule, isDue, nextSchedule } from "./schedule"
import type { CatalogWord, Gender, PackId, VocabSetId, VocabSource, VocabWord } from "./types"

const KEY = "vocab_words"
/** Catalog words the learner removed from a pack. Hidden per device, never deleted. */
const HIDDEN_KEY = "vocab_hidden"
const VIRTUAL_PREFIX = "cat:"
const DAY_MS = 86_400_000

/** A study deck's size. Short sessions, often, beat long ones. */
export const SESSION_SIZE = 12
/** How many never-seen words one pack session introduces at most. */
const MAX_NEW_PER_SESSION = 8

// --- storage ---

/**
 * Rows written before scheduling existed have no box or dueAt. Normalising on
 * READ rather than running a migration keeps the store self-healing: a word
 * saved long ago simply arrives at box 0, due now.
 */
function normalize(row: VocabWord): VocabWord {
  if (typeof row.box === "number" && typeof row.dueAt === "string") return row
  const seeded = initialSchedule(new Date(row.createdAt))
  return { ...row, box: row.box ?? seeded.box, dueAt: row.dueAt ?? seeded.dueAt }
}

function readAll(): VocabWord[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as VocabWord[]).map(normalize) : []
  } catch {
    return []
  }
}

function writeAll(rows: VocabWord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {}
}

function readHidden(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function writeHidden(ids: Set<string>) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...ids]))
  } catch {}
}

/** Case/accent-insensitive form used for dedupe and matching. Mirrors normalizePhraseText. */
export function normalizeWord(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[¡!¿?.,;:'"«»“”‘’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// --- matching rows to pack words ---

export function isVirtual(word: Pick<VocabWord, "id">): boolean {
  return word.id.startsWith(VIRTUAL_PREFIX)
}

function virtualWord(word: CatalogWord, pack: PackId): VocabWord {
  return {
    id: `${VIRTUAL_PREFIX}${word.id}`,
    spanish: word.spanish,
    article: word.article,
    gender: word.gender,
    english: word.english,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
    set: pack,
    source: "catalogo",
    catalogId: word.id,
    timesPracticed: 0,
    timesKnown: 0,
    box: 0,
    dueAt: "",
    createdAt: "",
    lastTouchedAt: "",
  }
}

interface Index {
  rows: VocabWord[]
  /** catalog id → the row holding its progress */
  byCatalog: Map<string, VocabWord>
  /** row ids that belong to a catalog word */
  claimed: Set<string>
  hidden: Set<string>
}

/**
 * Pair rows with catalog words. By catalog id first; then by spelling, so a
 * word saved before packs existed (or typed in by hand, or added by the
 * Exercises bridge) keeps its progress once a pack contains it. Spelling
 * matches prefer the row's own pack, so "naranja" the colour and "naranja"
 * the fruit can't swap histories.
 */
function buildIndex(): Index {
  const rows = readAll()
  const hidden = readHidden()
  const byCatalog = new Map<string, VocabWord>()
  const claimed = new Set<string>()

  for (const r of rows) {
    if (r.catalogId && getCatalogWord(r.catalogId) && !byCatalog.has(r.catalogId)) {
      byCatalog.set(r.catalogId, { ...r, set: packOfCatalogWord(r.catalogId) ?? r.set })
      claimed.add(r.id)
    }
  }

  const inPack = new Map<string, string>()
  const anyPack = new Map<string, string>()
  for (const pack of PACK_ORDER) {
    for (const w of SETS[pack].words) {
      const norm = normalizeWord(w.spanish)
      inPack.set(`${pack}|${norm}`, w.id)
      if (!anyPack.has(norm)) anyPack.set(norm, w.id)
    }
  }
  for (const r of rows) {
    if (claimed.has(r.id)) continue
    const norm = normalizeWord(r.spanish)
    const cid = inPack.get(`${r.set}|${norm}`) ?? anyPack.get(norm)
    if (cid && !byCatalog.has(cid)) {
      byCatalog.set(cid, { ...r, catalogId: cid, set: packOfCatalogWord(cid) ?? r.set })
      claimed.add(r.id)
    }
  }
  return { rows, byCatalog, claimed, hidden }
}

/** Every word with a row (reviewed, or added by the learner) that's still showing. */
function liveRows(ix: Index): VocabWord[] {
  const own = ix.rows.filter((r) => !ix.claimed.has(r.id))
  const catalog = [...ix.byCatalog.entries()]
    .filter(([cid]) => !ix.hidden.has(cid))
    .map(([, row]) => row)
  return [...catalog, ...own]
}

// --- packs ---

export interface PackContents {
  /** The pack's authored words in catalog order: progress rows where they exist, virtual words otherwise. */
  catalog: VocabWord[]
  /** Words the learner added to this pack. */
  own: VocabWord[]
  /** Catalog words removed from this pack on this device. */
  hiddenCount: number
}

export function packContents(pack: VocabSetId): PackContents {
  const ix = buildIndex()
  const own = ix.rows.filter((r) => !ix.claimed.has(r.id) && r.set === pack)
  if (pack === "propias") return { catalog: [], own, hiddenCount: 0 }
  const words = SETS[pack].words
  return {
    catalog: words
      .filter((w) => !ix.hidden.has(w.id))
      .map((w) => ix.byCatalog.get(w.id) ?? virtualWord(w, pack)),
    own,
    hiddenCount: words.filter((w) => ix.hidden.has(w.id)).length,
  }
}

export interface PackStats {
  total: number
  /** Seen before and ready to come back now. */
  due: number
  /** Never reviewed. */
  unseen: number
  practicando: number
  sabidas: number
}

export function packStats(pack: VocabSetId, at = new Date()): PackStats {
  const { catalog, own } = packContents(pack)
  const all = [...catalog, ...own]
  const stats: PackStats = { total: all.length, due: 0, unseen: 0, practicando: 0, sabidas: 0 }
  for (const w of all) {
    if (isVirtual(w) || w.timesPracticed === 0) {
      stats.unseen++
      continue
    }
    if (isDue(w, at)) stats.due++
    const band = bandFor(w)
    if (band === "sabida") stats.sabidas++
    else stats.practicando++
  }
  return stats
}

// --- decks ---

const lowestBoxFirst = (a: VocabWord, b: VocabWord) => a.box - b.box || a.dueAt.localeCompare(b.dueAt)

/** Seen words that are due now, across every pack. Words never reviewed aren't "due" — they're new. */
function dueRows(ix: Index, at: Date): VocabWord[] {
  return liveRows(ix).filter((w) => w.timesPracticed > 0 && isDue(w, at))
}

/** "Repaso de hoy": what's due across all packs, shakiest first. */
export function countDue(at = new Date()): number {
  return dueRows(buildIndex(), at).length
}

export function buildReviewDeck(size = SESSION_SIZE, at = new Date()): VocabWord[] {
  return dueRows(buildIndex(), at).sort(lowestBoxFirst).slice(0, size)
}

/** True once the learner has reviewed anything at all. */
export function hasStudied(): boolean {
  return readAll().some((r) => r.timesPracticed > 0)
}

/**
 * A pack session: the pack's due words first, then new ones to fill the deck.
 * New words are capped per session so a fresh pack arrives a handful at a
 * time rather than as a wall of 20 strangers.
 */
export function buildPackDeck(pack: VocabSetId, size = SESSION_SIZE, at = new Date()): VocabWord[] {
  const { catalog, own } = packContents(pack)
  const all = [...own, ...catalog]
  const due = all.filter((w) => !isVirtual(w) && w.timesPracticed > 0 && isDue(w, at)).sort(lowestBoxFirst)
  const fresh = all.filter((w) => isVirtual(w) || w.timesPracticed === 0)
  const deck = due.slice(0, size)
  return [...deck, ...fresh.slice(0, Math.min(MAX_NEW_PER_SESSION, size - deck.length))]
}

/**
 * The way out of "Estás al día": seen words that aren't due yet, soonest
 * first. An early review still moves a word up or down the ladder.
 */
export function buildPracticeAnywayDeck(pack?: VocabSetId, size = SESSION_SIZE): VocabWord[] {
  const pool = pack
    ? (() => {
        const { catalog, own } = packContents(pack)
        return [...catalog, ...own].filter((w) => !isVirtual(w) && w.timesPracticed > 0)
      })()
    : liveRows(buildIndex()).filter((w) => w.timesPracticed > 0)
  return pool.sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, size)
}

// --- writes ---

/** The real row behind a deck card, writing it first if the card is virtual. */
function ensureRow(id: string): { rows: VocabWord[]; row: VocabWord } | null {
  const rows = readAll()
  if (!id.startsWith(VIRTUAL_PREFIX)) {
    const row = rows.find((r) => r.id === id)
    return row ? { rows, row } : null
  }
  const catalogId = id.slice(VIRTUAL_PREFIX.length)
  const existing = buildIndex().byCatalog.get(catalogId)
  if (existing) {
    const row = rows.find((r) => r.id === existing.id)
    if (row) return { rows, row }
  }
  const word = getCatalogWord(catalogId)
  const pack = packOfCatalogWord(catalogId)
  if (!word || !pack) return null
  const now = new Date().toISOString()
  const row: VocabWord = {
    ...virtualWord(word, pack),
    id: crypto.randomUUID(),
    ...initialSchedule(new Date(now)),
    createdAt: now,
    lastTouchedAt: now,
  }
  rows.unshift(row)
  return { rows, row }
}

function patchRow(id: string, patch: (row: VocabWord) => Partial<VocabWord>) {
  const found = ensureRow(id)
  if (!found) return
  const { rows, row } = found
  writeAll(rows.map((r) => (r.id === row.id ? { ...r, ...patch(r), lastTouchedAt: new Date().toISOString() } : r)))
}

/**
 * One flashcard review — the first answer a card gets in a session. `known` is
 * the learner's own call, not a grade; it moves the word up or down the ladder.
 */
export function recordReview(id: string, known: boolean) {
  const at = new Date()
  patchRow(id, (w) => ({
    ...nextSchedule({ box: w.box, dueAt: w.dueAt }, known, at),
    timesPracticed: w.timesPracticed + 1,
    timesKnown: known ? w.timesKnown + 1 : w.timesKnown,
  }))
}

/**
 * A card missed earlier in this session, now got right. It doesn't climb (the
 * miss stands), but it's relearned, so it waits at least a day instead of
 * sitting due-now and greeting the learner straight back in Repaso de hoy.
 */
export function recordRelearned(id: string) {
  const at = Date.now()
  patchRow(id, (w) => ({
    dueAt: new Date(at + Math.max(1, BOX_INTERVAL_DAYS[w.box] ?? 1) * DAY_MS).toISOString(),
    timesPracticed: w.timesPracticed + 1,
  }))
}

/** "Ya la sé": straight to the top box, resting until it's worth checking. */
export function markKnown(id: string) {
  const at = Date.now()
  patchRow(id, (w) => ({
    box: LEARNED_BOX,
    dueAt: new Date(at + BOX_INTERVAL_DAYS[LEARNED_BOX] * DAY_MS).toISOString(),
    timesPracticed: Math.max(1, w.timesPracticed),
  }))
}

/** Everything needed to put a removed word back. */
export interface RemovedWord {
  catalogId?: string
  row?: VocabWord
}

/**
 * Take a word out of its pack. An authored word is hidden on this device (and
 * its progress row dropped); a word the learner added is deleted.
 */
export function removeFromPack(word: VocabWord): RemovedWord {
  const removed: RemovedWord = {}
  if (word.catalogId) {
    const hidden = readHidden()
    hidden.add(word.catalogId)
    writeHidden(hidden)
    removed.catalogId = word.catalogId
  }
  if (!isVirtual(word)) {
    const rows = readAll()
    removed.row = rows.find((r) => r.id === word.id)
    writeAll(rows.filter((r) => r.id !== word.id))
  }
  return removed
}

export function restoreRemoved(removed: RemovedWord) {
  if (removed.catalogId) {
    const hidden = readHidden()
    hidden.delete(removed.catalogId)
    writeHidden(hidden)
  }
  if (removed.row) {
    const rows = readAll()
    if (!rows.some((r) => r.id === removed.row!.id)) writeAll([removed.row, ...rows])
  }
}

/** Bring back every authored word removed from a pack on this device. */
export function unhidePack(pack: PackId) {
  const ids = new Set(SETS[pack].words.map((w) => w.id))
  writeHidden(new Set([...readHidden()].filter((id) => !ids.has(id))))
}

/**
 * Where a Spanish word already lives, if anywhere: a pack (authored or added)
 * or Tus palabras. Used to say "ya está en Los animales" instead of adding a
 * duplicate card.
 */
export function findWord(spanish: string): { pack: VocabSetId; label: string; hidden: boolean } | null {
  const norm = normalizeWord(spanish)
  if (!norm) return null
  const ix = buildIndex()
  for (const pack of PACK_ORDER) {
    const hit = SETS[pack].words.find((w) => normalizeWord(w.spanish) === norm)
    if (hit) return { pack, label: packLabel(pack), hidden: ix.hidden.has(hit.id) }
  }
  const row = ix.rows.find((r) => !ix.claimed.has(r.id) && normalizeWord(r.spanish) === norm)
  return row ? { pack: row.set, label: packLabel(row.set), hidden: false } : null
}

/** Unhide one authored word by its Spanish — when the learner re-adds a word they'd removed. */
export function unhideBySpanish(spanish: string) {
  const norm = normalizeWord(spanish)
  const hidden = readHidden()
  for (const w of PACK_ORDER.flatMap((p) => SETS[p].words)) {
    if (normalizeWord(w.spanish) === norm) hidden.delete(w.id)
  }
  writeHidden(hidden)
}

/** Add a word of the learner's own to a pack (or to Tus palabras). Null if it already exists. */
export function addWord(input: {
  spanish: string
  article: string
  gender: Gender
  english: string
  example?: string
  exampleTranslation?: string
  set: VocabSetId
  source: VocabSource
}): VocabWord | null {
  if (!normalizeWord(input.spanish) || findWord(input.spanish)) return null
  const now = new Date().toISOString()
  const word: VocabWord = {
    id: crypto.randomUUID(),
    spanish: input.spanish,
    article: input.article,
    gender: input.gender,
    english: input.english,
    example: input.example,
    exampleTranslation: input.exampleTranslation,
    set: input.set,
    source: input.source,
    timesPracticed: 0,
    timesKnown: 0,
    ...initialSchedule(new Date(now)),
    createdAt: now,
    lastTouchedAt: now,
  }
  writeAll([word, ...readAll()])
  return word
}
