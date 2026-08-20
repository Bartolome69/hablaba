"use client"

// Storage for unified conversations: keys `conversations`,
// `conversation_turns`, `conversation_observations`, table-shaped for a future
// SQL move like the rest of the app.
//
// Replaces the two split stores this app used to have — `hablaba_sessions` +
// `hablaba_chat_*` for text and `voice_*` for speech. Both are migrated in
// (see migrateLegacyConversations) so banked history survives the unification;
// nothing is deleted, so a bad migration is recoverable.

import type { Message } from "@/lib/types"
import type { StoredSession } from "@/lib/types"
import type { VoiceEngineMeta, VoiceSeedContext } from "@/lib/voice/types"
import type {
  Conversation,
  ConversationObservation,
  ConversationTurn,
  TurnModality,
} from "./types"

const KEYS = {
  conversations: "conversations",
  turns: "conversation_turns",
  observations: "conversation_observations",
  migrated: "conversations_migrated_v1",
} as const

/** Legacy keys, read once by the migration and then left alone. */
const LEGACY = {
  textSessions: "hablaba_sessions",
  textMessages: (id: string) => `hablaba_chat_${id}`,
  voiceSessions: "voice_sessions",
  voiceTurns: "voice_turns",
  voiceObservations: "voice_observations",
} as const

/** Resume cards go stale — past this, a half-finished thread is clutter, not an invitation. */
export const RESUME_EXPIRY_DAYS = 14

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

// --- conversations ---

const byRecent = (a: Conversation, b: Conversation) => b.lastTurnAt.localeCompare(a.lastTurnAt)

export function listConversations(): Conversation[] {
  return readTable<Conversation>(KEYS.conversations).sort(byRecent)
}

export function getConversation(id: string): Conversation | null {
  return readTable<Conversation>(KEYS.conversations).find((c) => c.id === id) ?? null
}

export function createConversation(input: {
  starterId: string | null
  title: string
  emoji: string
}): Conversation {
  const now = new Date().toISOString()
  const conversation: Conversation = {
    id: crypto.randomUUID(),
    starterId: input.starterId,
    title: input.title,
    emoji: input.emoji,
    startedAt: now,
    lastTurnAt: now,
    voiceSeconds: 0,
  }
  writeTable(KEYS.conversations, [conversation, ...readTable<Conversation>(KEYS.conversations)])
  return conversation
}

function patchConversation(id: string, patch: Partial<Conversation>) {
  const rows = readTable<Conversation>(KEYS.conversations).map((c) =>
    c.id === id ? { ...c, ...patch } : c,
  )
  writeTable(KEYS.conversations, rows)
}

export function touchConversation(id: string) {
  patchConversation(id, { lastTurnAt: new Date().toISOString() })
}

/** Called when a spoken stretch ends — accumulates, since a thread can have several. */
export function addVoiceSeconds(id: string, seconds: number) {
  const current = getConversation(id)
  if (!current) return
  patchConversation(id, { voiceSeconds: (current.voiceSeconds ?? 0) + Math.max(0, seconds) })
}

export function setVoiceMeta(
  id: string,
  meta: { engineMeta: VoiceEngineMeta; seedContext: VoiceSeedContext },
) {
  patchConversation(id, { engineMeta: meta.engineMeta, seedContext: meta.seedContext })
}

/**
 * A new spoken stretch invalidates the previous analysis: there are turns it
 * never saw. Clearing analyzedAt makes the review re-run over the whole thread.
 */
export function clearAnalysis(id: string) {
  patchConversation(id, { analyzedAt: null })
}

export function markAnalyzed(id: string) {
  patchConversation(id, { analyzedAt: new Date().toISOString() })
}

export function deleteConversation(id: string) {
  writeTable(
    KEYS.conversations,
    readTable<Conversation>(KEYS.conversations).filter((c) => c.id !== id),
  )
  writeTable(
    KEYS.turns,
    readTable<ConversationTurn>(KEYS.turns).filter((t) => t.conversationId !== id),
  )
  writeTable(
    KEYS.observations,
    readTable<ConversationObservation>(KEYS.observations).filter((o) => o.sessionId !== id),
  )
}

/** Threads worth offering to pick up: recent enough to still be live in someone's head. */
export function listResumable(now: Date = new Date()): Conversation[] {
  const cutoff = now.getTime() - RESUME_EXPIRY_DAYS * 86400_000
  return listConversations().filter((c) => new Date(c.lastTurnAt).getTime() >= cutoff)
}

// --- turns ---

export function listTurns(conversationId: string): ConversationTurn[] {
  return readTable<ConversationTurn>(KEYS.turns)
    .filter((t) => t.conversationId === conversationId)
    .sort((a, b) => a.ordinal - b.ordinal)
}

export function nextOrdinal(conversationId: string): number {
  const turns = listTurns(conversationId)
  return turns.length ? turns[turns.length - 1].ordinal + 1 : 0
}

/** Upsert by id, so a streaming text reply can be written repeatedly as it grows. */
export function saveTurn(turn: ConversationTurn) {
  const rows = readTable<ConversationTurn>(KEYS.turns).filter((t) => t.id !== turn.id)
  writeTable(KEYS.turns, [...rows, turn])
  touchConversation(turn.conversationId)
}

export function countTurns(conversationId: string, modality?: TurnModality): number {
  const turns = listTurns(conversationId)
  return modality ? turns.filter((t) => t.modality === modality).length : turns.length
}

// --- observations ---

export function saveObservations(observations: ConversationObservation[]) {
  if (observations.length === 0) return
  const ids = new Set(observations.map((o) => o.sessionId))
  // Replace per conversation: re-analysing must not duplicate findings.
  const rows = readTable<ConversationObservation>(KEYS.observations).filter(
    (o) => !ids.has(o.sessionId),
  )
  writeTable(KEYS.observations, [...rows, ...observations])
}

export function listObservations(conversationId: string): ConversationObservation[] {
  return readTable<ConversationObservation>(KEYS.observations).filter(
    (o) => o.sessionId === conversationId,
  )
}

/** Weekly-report hook: group these by (type, detail.tag) over the window. */
export function listRecentObservations(days: number): ConversationObservation[] {
  const cutoff = Date.now() - days * 86400_000
  const ids = new Set(
    listConversations()
      .filter((c) => new Date(c.startedAt).getTime() >= cutoff)
      .map((c) => c.id),
  )
  return readTable<ConversationObservation>(KEYS.observations).filter((o) => ids.has(o.sessionId))
}

// --- migration ---

interface LegacyVoiceSession {
  id: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  seedContext?: VoiceSeedContext
  engineMeta?: VoiceEngineMeta
  analyzedAt?: string | null
}

interface LegacyVoiceTurn {
  id: string
  sessionId: string
  speaker: "user" | "assistant"
  text: string
  startedAt: string
  ordinal: number
}

/**
 * Fold the two old stores into conversations. Idempotent and guarded by a flag,
 * and non-destructive — the legacy keys are read, never cleared, so if this
 * turns out wrong the original data is still sitting there.
 */
export function migrateLegacyConversations() {
  try {
    if (localStorage.getItem(KEYS.migrated) === "1") return
  } catch {
    return // no storage, nothing to migrate
  }

  const conversations: Conversation[] = []
  const turns: ConversationTurn[] = []
  const observations: ConversationObservation[] = []

  // Voice sessions → conversations whose every turn is spoken.
  for (const s of readTable<LegacyVoiceSession>(LEGACY.voiceSessions)) {
    const legacyTurns = readTable<LegacyVoiceTurn>(LEGACY.voiceTurns)
      .filter((t) => t.sessionId === s.id)
      .sort((a, b) => a.ordinal - b.ordinal)
    conversations.push({
      id: s.id,
      starterId: s.seedContext?.topicId ?? null,
      title: "Charla",
      emoji: "🎙️",
      startedAt: s.startedAt,
      lastTurnAt: legacyTurns[legacyTurns.length - 1]?.startedAt ?? s.endedAt ?? s.startedAt,
      voiceSeconds: s.durationSeconds ?? 0,
      analyzedAt: s.analyzedAt ?? null,
      engineMeta: s.engineMeta ?? null,
      seedContext: s.seedContext ?? null,
    })
    for (const t of legacyTurns) {
      turns.push({
        id: t.id,
        conversationId: s.id,
        speaker: t.speaker,
        modality: "voice",
        text: t.text,
        createdAt: t.startedAt,
        ordinal: t.ordinal,
      })
    }
  }
  observations.push(...readTable<ConversationObservation>(LEGACY.voiceObservations))

  // Text sessions → conversations whose every turn is typed. Messages lived in
  // a per-session cache key rather than one table.
  for (const s of readTable<StoredSession>(LEGACY.textSessions)) {
    let messages: (Omit<Message, "timestamp"> & { timestamp: string })[] = []
    try {
      const raw = localStorage.getItem(LEGACY.textMessages(s.id))
      if (raw) messages = JSON.parse(raw)
    } catch {}
    conversations.push({
      id: s.id,
      starterId: s.topicId ?? null,
      title: s.topicTitle || "Charla",
      emoji: s.topicEmoji || "💬",
      startedAt: messages[0]?.timestamp ?? s.lastMessageAt,
      lastTurnAt: s.lastMessageAt,
      voiceSeconds: 0,
    })
    messages.forEach((m, i) => {
      turns.push({
        id: m.id,
        conversationId: s.id,
        speaker: m.type === "user" ? "user" : "assistant",
        modality: "text",
        text: m.text,
        correction: m.correction,
        translation: m.translation,
        createdAt: m.timestamp,
        ordinal: i,
      })
    })
  }

  if (conversations.length) {
    // Merge rather than overwrite, in case anything already exists.
    const existing = readTable<Conversation>(KEYS.conversations)
    const existingIds = new Set(existing.map((c) => c.id))
    writeTable(KEYS.conversations, [
      ...conversations.filter((c) => !existingIds.has(c.id)),
      ...existing,
    ])
    const existingTurns = readTable<ConversationTurn>(KEYS.turns)
    const existingTurnIds = new Set(existingTurns.map((t) => t.id))
    writeTable(KEYS.turns, [
      ...existingTurns,
      ...turns.filter((t) => !existingTurnIds.has(t.id)),
    ])
    saveObservations(observations)
  }

  try {
    localStorage.setItem(KEYS.migrated, "1")
  } catch {}
}
