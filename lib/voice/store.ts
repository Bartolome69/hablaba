"use client"

// The main app's voice-session storage (Speak's "Charlar"): table-shaped
// localStorage records, keys voice_sessions / voice_turns / voice_observations
// mapping 1:1 to future SQL — the same convention as lib/criar/store.ts, which
// keeps its own criar_*-prefixed twins for the Grow module. No scope column:
// main-app data is per-device, one implicit user.
//
// Also home to the main app's bindings of the shared session hook and analysis
// (the same roles lib/criar/voice/{persistence,analysis}.ts play for Grow).

import { requestTranscriptAnalysis } from "./analysis"
import type { VoicePersistence } from "./use-voice-session"
import type { VoiceObservationRecord, VoiceSessionRecord, VoiceTurnRecord } from "./types"

const KEYS = {
  sessions: "voice_sessions",
  turns: "voice_turns",
  observations: "voice_observations",
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

// --- sessions & turns (same write discipline as the criar store: turns land
// individually as they finalise; the end-stamp is idempotent) ---

export function addVoiceSession(session: VoiceSessionRecord) {
  const rows = readTable<VoiceSessionRecord>(KEYS.sessions).filter((s) => s.id !== session.id)
  writeTable(KEYS.sessions, [session, ...rows])
}

export function endVoiceSession(id: string, endedAt: string, durationSeconds: number) {
  const rows = readTable<VoiceSessionRecord>(KEYS.sessions).map((s) =>
    s.id === id && s.endedAt === null ? { ...s, endedAt, durationSeconds } : s,
  )
  writeTable(KEYS.sessions, rows)
}

export function markVoiceSessionAnalyzed(id: string) {
  const rows = readTable<VoiceSessionRecord>(KEYS.sessions).map((s) =>
    s.id === id ? { ...s, analyzedAt: new Date().toISOString() } : s,
  )
  writeTable(KEYS.sessions, rows)
}

export function listVoiceSessions(): VoiceSessionRecord[] {
  return readTable<VoiceSessionRecord>(KEYS.sessions).sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt),
  )
}

export function getVoiceSession(id: string): VoiceSessionRecord | null {
  return readTable<VoiceSessionRecord>(KEYS.sessions).find((s) => s.id === id) ?? null
}

export function saveVoiceTurn(turn: VoiceTurnRecord) {
  const rows = readTable<VoiceTurnRecord>(KEYS.turns).filter((t) => t.id !== turn.id)
  writeTable(KEYS.turns, [...rows, turn])
}

export function listVoiceTurns(sessionId: string): VoiceTurnRecord[] {
  return readTable<VoiceTurnRecord>(KEYS.turns)
    .filter((t) => t.sessionId === sessionId)
    .sort((a, b) => a.ordinal - b.ordinal)
}

// --- observations ---

export function saveVoiceObservations(observations: VoiceObservationRecord[]) {
  if (observations.length === 0) return
  const sessionIds = new Set(observations.map((o) => o.sessionId))
  const rows = readTable<VoiceObservationRecord>(KEYS.observations).filter(
    (o) => !sessionIds.has(o.sessionId),
  )
  writeTable(KEYS.observations, [...rows, ...observations])
}

export function listVoiceObservations(sessionId: string): VoiceObservationRecord[] {
  return readTable<VoiceObservationRecord>(KEYS.observations).filter(
    (o) => o.sessionId === sessionId,
  )
}

// --- bindings for the shared hook & analysis ---

export const speakVoicePersistence: VoicePersistence = {
  createSession: addVoiceSession,
  saveTurn: saveVoiceTurn,
  endSession: endVoiceSession,
}

/** Same contract as Grow's ensureSessionAnalysis — see lib/criar/voice/analysis.ts. */
export async function ensureSpeakSessionAnalysis(
  sessionId: string,
): Promise<VoiceObservationRecord[]> {
  const session = getVoiceSession(sessionId)
  if (!session) return []
  if (session.analyzedAt) return listVoiceObservations(sessionId)

  const turns = listVoiceTurns(sessionId)
  if (!turns.some((t) => t.speaker === "user")) {
    markVoiceSessionAnalyzed(sessionId)
    return []
  }

  const analyzed = await requestTranscriptAnalysis(turns, session.seedContext)
  const now = new Date().toISOString()
  const observations: VoiceObservationRecord[] = analyzed.map((o) => ({
    id: crypto.randomUUID(),
    sessionId,
    turnId: o.turnId,
    type: o.type,
    detail: o.detail,
    createdAt: now,
  }))

  saveVoiceObservations(observations)
  markVoiceSessionAnalyzed(sessionId)
  return observations
}
