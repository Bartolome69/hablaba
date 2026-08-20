"use client"

// Cross-store migrations, run once each behind their own flag. Every one is
// non-destructive: legacy keys are read and NEVER cleared, so anything wrong
// can be redone by clearing the flag.
//
// runMigrations() is the single entry point — call it before reading any store
// on a page that renders user data.

import { migrateLegacyConversations, importConversation } from "./conversations/store"
import type { Conversation, ConversationObservation, ConversationTurn } from "./conversations/types"
import { addPhrase } from "./phrases/store"
import type { PhraseMoment } from "./phrases/types"
import { getProfile, saveProfile } from "./profile/store"

const GROW_FLAG = "migration_grow_collapsed"

export function runMigrations() {
  migrateLegacyConversations()
  migrateGrowCollapse()
}

// --- Grow collapse ---
//
// The Grow module (internal codename Criar) is retired; its data folds into
// the unified stores. Minimal local copies of the legacy shapes below — the
// criar type definitions died with the module, and a migration must not
// depend on live code that can drift.

interface LegacyChild {
  id: string
  name: string
  birthdate: string
  dialect?: string
}

interface LegacyCaptureLesson {
  captureId: string
  request: string
  spanish: string
}

interface LegacyPack {
  id: string
  date: string // YYYY-MM-DD
  moment: string
  createdAt: string
  phrases: { id: string; spanish: string; english: string; learned: boolean }[]
  captureLessons: LegacyCaptureLesson[]
}

interface LegacyCapture {
  id: string
  text: string
  status: "new" | "taught" | "learning" | "learned"
  createdAt: string
}

interface LegacySparringSession {
  childId: string
  date: string // YYYY-MM-DD
  messages: {
    id: string
    type: "user" | "bot"
    text: string
    timestamp: string
    translation?: string
    correction?: ConversationTurn["correction"]
  }[]
}

interface LegacyVoiceSession {
  id: string
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  analyzedAt?: string | null
  seedContext?: Conversation["seedContext"]
  engineMeta?: Conversation["engineMeta"]
}

interface LegacyVoiceTurn {
  id: string
  sessionId: string
  speaker: "user" | "assistant"
  text: string
  startedAt: string
  ordinal: number
}

interface LegacySavedPhrase {
  id: string
  spanish: string
  english: string
  savedAt: string
  timesPracticed?: number
}

function readLegacy<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

/** Grow pack moments → phrase moments. Close cousins, not identical vocabularies. */
const MOMENT_MAP: Record<string, PhraseMoment> = {
  waking: "despertar",
  feed: "comida",
  nappy: "baño",
  "pram-walk": "paseo",
  play: "juego",
  bath: "baño",
  bedtime: "dormir",
  soothing: "calmar",
}

export function migrateGrowCollapse() {
  try {
    if (localStorage.getItem(GROW_FLAG) === "1") return
  } catch {
    return
  }

  // 1. Child + dialect → profile (only if the profile hasn't been set up already).
  const child = readLegacy<LegacyChild>("criar_children")[0]
  if (child && !getProfile().child) {
    saveProfile({
      child: { name: child.name, birthdate: child.birthdate },
      dialect: child.dialect === "neutral" ? "neutral" : "rioplatense",
    })
  }
  try {
    const level = localStorage.getItem("criar_correction_level")
    if (level === "mucho" || level === "poco" || level === "normal") {
      saveProfile({ correctionLevel: level })
    }
  } catch {}

  // 2. Grow voice sessions → conversations (all-voice threads), observations along.
  for (const s of readLegacy<LegacyVoiceSession>("criar_voice_sessions")) {
    const turns = readLegacy<LegacyVoiceTurn>("criar_voice_turns")
      .filter((t) => t.sessionId === s.id)
      .sort((a, b) => a.ordinal - b.ordinal)
    const conversation: Conversation = {
      id: s.id,
      starterId: s.seedContext?.topicId ?? null,
      title: "Charla",
      emoji: "🎙️",
      startedAt: s.startedAt,
      lastTurnAt: turns[turns.length - 1]?.startedAt ?? s.endedAt ?? s.startedAt,
      voiceSeconds: s.durationSeconds ?? 0,
      analyzedAt: s.analyzedAt ?? null,
      engineMeta: s.engineMeta ?? null,
      seedContext: s.seedContext ?? null,
    }
    const conversationTurns: ConversationTurn[] = turns.map((t) => ({
      id: t.id,
      conversationId: s.id,
      speaker: t.speaker,
      modality: "voice",
      text: t.text,
      createdAt: t.startedAt,
      ordinal: t.ordinal,
    }))
    const observations = readLegacy<ConversationObservation>("criar_voice_observations").filter(
      (o) => o.sessionId === s.id,
    )
    importConversation(conversation, conversationTurns, observations)
  }

  // 3. Sparring sessions → conversations. TEXT modality: these turns were
  // typed (dictation landed as text too), and marking them voice would both
  // misrepresent them and suppress orthographic findings in re-analysis.
  for (const s of readLegacy<LegacySparringSession>("criar_sparring_sessions")) {
    if (!s.messages?.length) continue
    const id = `sparring-${s.date}`
    const conversation: Conversation = {
      id,
      starterId: null,
      title: "Catch up",
      emoji: "🗣️",
      startedAt: s.messages[0]?.timestamp ?? `${s.date}T12:00:00.000Z`,
      lastTurnAt: s.messages[s.messages.length - 1]?.timestamp ?? `${s.date}T12:00:00.000Z`,
      voiceSeconds: 0,
    }
    const conversationTurns: ConversationTurn[] = s.messages.map((m, i) => ({
      id: m.id,
      conversationId: id,
      speaker: m.type === "user" ? "user" : "assistant",
      modality: "text",
      text: m.text,
      translation: m.translation,
      correction: m.correction,
      createdAt: m.timestamp,
      ordinal: i,
    }))
    importConversation(conversation, conversationTurns, [])
  }

  // 4. Pack phrases → phrases. learned = the parent marked it done → usada.
  const captures = readLegacy<LegacyCapture>("criar_captures")
  const capturesWithLessons = new Set<string>()
  for (const pack of readLegacy<LegacyPack>("criar_packs")) {
    const moment = MOMENT_MAP[pack.moment]
    for (const ph of pack.phrases ?? []) {
      addPhrase({
        text: ph.spanish,
        translation: ph.english,
        moment,
        source: "generated",
        state: ph.learned ? "usada" : "nueva",
        timesUsed: ph.learned ? 1 : 0,
        createdAt: pack.createdAt,
      })
    }
    // Capture lessons carry the Spanish the capture was waiting for.
    for (const lesson of pack.captureLessons ?? []) {
      capturesWithLessons.add(lesson.captureId)
      addPhrase({
        text: lesson.spanish,
        translation: lesson.request,
        source: "captured",
        state: "nueva",
        createdAt: pack.createdAt,
      })
    }
  }

  // 5. Raw captures that never got a lesson: no Spanish yet. Stored with empty
  // text; the library's gap-fill generation completes them (see phrases/pack.ts).
  for (const c of captures) {
    if (c.status !== "new" || capturesWithLessons.has(c.id)) continue
    addPhrase({
      text: "",
      translation: c.text,
      source: "captured",
      state: "nueva",
      createdAt: c.createdAt,
    })
  }

  // 6. Saved phrases (main app) → phrases, source saved.
  for (const p of readLegacy<LegacySavedPhrase>("hablaba_saved_phrases")) {
    addPhrase({
      text: p.spanish,
      translation: p.english,
      source: "saved",
      state: (p.timesPracticed ?? 0) > 0 ? "practicando" : "nueva",
      timesPracticed: p.timesPracticed ?? 0,
      createdAt: p.savedAt,
    })
  }

  try {
    localStorage.setItem(GROW_FLAG, "1")
  } catch {}
}
