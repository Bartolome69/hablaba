// Table-shaped localStorage repository for the Criar module.
// Each key maps 1:1 to a future SQL table (criar_children, criar_packs,
// criar_captures) — swapping this file for a real database client is the
// designed upgrade path. Client-side only.

import type {
  CriarCapture,
  CriarCaptureStatus,
  CriarChild,
  CriarPack,
} from "./types"

const KEYS = {
  children: "criar_children",
  packs: "criar_packs",
  captures: "criar_captures",
} as const

function readTable<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeTable<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch {}
}

/** Local date key, e.g. "2026-07-09" — packs are one per child per day. */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// --- children ---

export function listChildren(): CriarChild[] {
  return readTable<CriarChild>(KEYS.children)
}

/** Single-child MVP: the first (only) child. */
export function getChild(): CriarChild | null {
  return listChildren()[0] ?? null
}

export function saveChild(child: CriarChild) {
  const rows = listChildren().filter((c) => c.id !== child.id)
  writeTable(KEYS.children, [child, ...rows])
}

// --- packs ---

export function listPacks(childId: string): CriarPack[] {
  return readTable<CriarPack>(KEYS.packs)
    .filter((p) => p.childId === childId)
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPackByDate(childId: string, date: string): CriarPack | null {
  return listPacks(childId).find((p) => p.date === date) ?? null
}

export function savePack(pack: CriarPack) {
  const rows = readTable<CriarPack>(KEYS.packs).filter((p) => p.id !== pack.id)
  writeTable(KEYS.packs, [pack, ...rows])
}

export function setPhraseLearned(packId: string, phraseId: string, learned: boolean) {
  const rows = readTable<CriarPack>(KEYS.packs).map((p) =>
    p.id === packId
      ? {
          ...p,
          phrases: p.phrases.map((ph) => (ph.id === phraseId ? { ...ph, learned } : ph)),
        }
      : p,
  )
  writeTable(KEYS.packs, rows)
}

// --- captures ---

export function listCaptures(childId: string): CriarCapture[] {
  return readTable<CriarCapture>(KEYS.captures)
    .filter((c) => c.childId === childId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addCapture(childId: string, text: string): CriarCapture {
  const capture: CriarCapture = {
    id: crypto.randomUUID(),
    childId,
    text: text.trim(),
    status: "new",
    createdAt: new Date().toISOString(),
  }
  writeTable(KEYS.captures, [capture, ...readTable<CriarCapture>(KEYS.captures)])
  return capture
}

export function updateCapture(
  id: string,
  patch: Partial<Pick<CriarCapture, "status" | "taughtInPackId" | "text">>,
) {
  const rows = readTable<CriarCapture>(KEYS.captures).map((c) =>
    c.id === id ? { ...c, ...patch } : c,
  )
  writeTable(KEYS.captures, rows)
}

export function markCapturesTaught(ids: string[], packId: string) {
  const idSet = new Set(ids)
  const rows = readTable<CriarCapture>(KEYS.captures).map((c) =>
    idSet.has(c.id) ? { ...c, status: "taught" as CriarCaptureStatus, taughtInPackId: packId } : c,
  )
  writeTable(KEYS.captures, rows)
}

// --- derived context for pack generation ---

/** Spanish texts the parent marked learned — generation should avoid these. */
export function learnedPhraseTexts(childId: string): string[] {
  return listPacks(childId)
    .flatMap((p) => p.phrases)
    .filter((ph) => ph.learned)
    .map((ph) => ph.spanish)
}

/** Recent not-yet-learned phrases — generation should recycle a few. */
export function unlearnedRecentPhraseTexts(childId: string, packLimit = 5): string[] {
  return listPacks(childId)
    .slice(0, packLimit)
    .flatMap((p) => p.phrases)
    .filter((ph) => !ph.learned)
    .map((ph) => ph.spanish)
}
