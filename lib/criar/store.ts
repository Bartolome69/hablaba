// Table-shaped localStorage repository for the Criar module.
// Each key maps 1:1 to a future SQL table (criar_children, criar_packs,
// criar_captures) — swapping this file for a real database client is the
// designed upgrade path. Client-side only.

import type { Message } from "@/lib/types"
import type {
  CriarCapture,
  CriarCaptureStatus,
  CriarChild,
  CriarPack,
  CriarSparringSession,
  SparringHistoryMessage,
} from "./types"
import type {
  CriarVoiceObservation,
  CriarVoiceSession,
  CriarVoiceTurn,
} from "./voice/types"

const KEYS = {
  children: "criar_children",
  packs: "criar_packs",
  captures: "criar_captures",
  sparringSessions: "criar_sparring_sessions",
  voiceSessions: "criar_voice_sessions",
  voiceTurns: "criar_voice_turns",
  voiceObservations: "criar_voice_observations",
} as const

type StoredSparringSession = Omit<CriarSparringSession, "messages"> & {
  messages: (Omit<Message, "timestamp"> & { timestamp: string })[]
}

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

// --- sparring sessions ---

/** Same-day session, if one exists — the caller resumes it instead of restarting. */
export function getSparringSession(
  childId: string,
  date: string,
): { messages: Message[]; history: SparringHistoryMessage[] } | null {
  const row = readTable<StoredSparringSession>(KEYS.sparringSessions).find(
    (s) => s.childId === childId && s.date === date,
  )
  if (!row) return null
  return {
    messages: row.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    history: row.history,
  }
}

export function saveSparringSession(
  childId: string,
  date: string,
  data: { messages: Message[]; history: SparringHistoryMessage[] },
) {
  const rows = readTable<StoredSparringSession>(KEYS.sparringSessions).filter(
    (s) => !(s.childId === childId && s.date === date),
  )
  const serialized: StoredSparringSession = {
    childId,
    date,
    messages: data.messages.map((m) => ({ ...m, timestamp: m.timestamp.toISOString() })),
    history: data.history,
  }
  writeTable(KEYS.sparringSessions, [serialized, ...rows])
}

// --- voice sessions ---
//
// Turns are written INDIVIDUALLY as they finalise during a live conversation,
// not as one blob at session end — a killed tab loses at most the turn in
// flight, never the transcript. The session row is created when the
// conversation goes live and stamped with endedAt/duration when it ends; a row
// with endedAt === null whose session isn't running anymore is a tab that died
// mid-conversation, and its transcript is still intact.

export function addVoiceSession(session: CriarVoiceSession) {
  const rows = readTable<CriarVoiceSession>(KEYS.voiceSessions).filter((s) => s.id !== session.id)
  writeTable(KEYS.voiceSessions, [session, ...rows])
}

export function endVoiceSession(id: string, endedAt: string, durationSeconds: number) {
  const rows = readTable<CriarVoiceSession>(KEYS.voiceSessions).map((s) =>
    // Idempotent: the first stamp wins, so overlapping teardown paths
    // (stop button, engine close, visibility pause) can all call this.
    s.id === id && s.endedAt === null ? { ...s, endedAt, durationSeconds } : s,
  )
  writeTable(KEYS.voiceSessions, rows)
}

export function markVoiceSessionAnalyzed(id: string) {
  const rows = readTable<CriarVoiceSession>(KEYS.voiceSessions).map((s) =>
    s.id === id ? { ...s, analyzedAt: new Date().toISOString() } : s,
  )
  writeTable(KEYS.voiceSessions, rows)
}

export function listVoiceSessions(childId: string): CriarVoiceSession[] {
  return readTable<CriarVoiceSession>(KEYS.voiceSessions)
    .filter((s) => s.childId === childId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

export function getVoiceSession(id: string): CriarVoiceSession | null {
  return readTable<CriarVoiceSession>(KEYS.voiceSessions).find((s) => s.id === id) ?? null
}

export function saveVoiceTurn(turn: CriarVoiceTurn) {
  const rows = readTable<CriarVoiceTurn>(KEYS.voiceTurns).filter((t) => t.id !== turn.id)
  writeTable(KEYS.voiceTurns, [...rows, turn])
}

export function listVoiceTurns(sessionId: string): CriarVoiceTurn[] {
  return readTable<CriarVoiceTurn>(KEYS.voiceTurns)
    .filter((t) => t.sessionId === sessionId)
    .sort((a, b) => a.ordinal - b.ordinal)
}

// --- voice observations (post-session analysis, Phase 4) ---

export function saveVoiceObservations(observations: CriarVoiceObservation[]) {
  if (observations.length === 0) return
  const sessionIds = new Set(observations.map((o) => o.sessionId))
  // Replace per session rather than append: re-running the analysis for a
  // session (e.g. after a failed first attempt) must not duplicate findings.
  const rows = readTable<CriarVoiceObservation>(KEYS.voiceObservations).filter(
    (o) => !sessionIds.has(o.sessionId),
  )
  writeTable(KEYS.voiceObservations, [...rows, ...observations])
}

export function listVoiceObservations(sessionId: string): CriarVoiceObservation[] {
  return readTable<CriarVoiceObservation>(KEYS.voiceObservations).filter(
    (o) => o.sessionId === sessionId,
  )
}

/**
 * WEEKLY REPORT HOOK. The future report is exactly this query for `days = 7`,
 * grouped by (type, detail.tag), plus one narrative-generation call. Nothing
 * else about the schema should need to change.
 */
export function listRecentVoiceObservations(
  childId: string,
  days: number,
): CriarVoiceObservation[] {
  const sessionIds = new Set(
    listVoiceSessions(childId)
      .filter((s) => Date.now() - new Date(s.startedAt).getTime() <= days * 86400_000)
      .map((s) => s.id),
  )
  return readTable<CriarVoiceObservation>(KEYS.voiceObservations).filter((o) =>
    sessionIds.has(o.sessionId),
  )
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
