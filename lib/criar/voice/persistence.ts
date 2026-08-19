"use client"

// Grow's binding of the shared voice-session hook to the criar_* tables:
// stamp every session with the child's id, write through lib/criar/store.

import type { CriarChild } from "../types"
import { addVoiceSession, endVoiceSession, saveVoiceTurn } from "../store"
import type { VoicePersistence } from "@/lib/voice/use-voice-session"

export function criarVoicePersistence(child: CriarChild | null): VoicePersistence | null {
  if (!child) return null
  const childId = child.id
  return {
    createSession: (session) => addVoiceSession({ ...session, childId }),
    saveTurn: (turn) => saveVoiceTurn(turn),
    endSession: (id, endedAt, durationSeconds) => endVoiceSession(id, endedAt, durationSeconds),
  }
}
