"use client"

// Binds the shared voice-session hook to a conversation thread.
//
// The key difference from the old standalone binding: a spoken stretch does NOT
// create a new record. It appends voice turns to an EXISTING conversation, so
// the thread keeps one history whether you were typing or talking.
//
// Ordinals are offset from wherever the thread had got to. The engine numbers
// its turns from zero per stretch, so without the offset a second spoken
// stretch would interleave itself back into the middle of the transcript.

import type { VoicePersistence } from "@/lib/voice/use-voice-session"
import {
  addVoiceSeconds,
  clearAnalysis,
  nextOrdinal,
  saveTurn,
  setVoiceMeta,
} from "./store"

export function conversationVoicePersistence(conversationId: string): VoicePersistence {
  let ordinalBase = 0

  return {
    createSession: (session) => {
      ordinalBase = nextOrdinal(conversationId)
      setVoiceMeta(conversationId, {
        engineMeta: session.engineMeta,
        seedContext: session.seedContext,
      })
      // These turns didn't exist when the thread was last analysed, so the
      // review has to run again over the whole thing.
      clearAnalysis(conversationId)
    },

    saveTurn: (turn) =>
      saveTurn({
        id: turn.id,
        conversationId,
        speaker: turn.speaker,
        modality: "voice",
        text: turn.text,
        createdAt: turn.startedAt,
        ordinal: ordinalBase + turn.ordinal,
      }),

    endSession: (_id, _endedAt, durationSeconds) =>
      addVoiceSeconds(conversationId, durationSeconds),
  }
}
