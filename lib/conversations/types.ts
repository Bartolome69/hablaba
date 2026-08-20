// One conversation, two modalities.
//
// A conversation is the durable thing; text and voice are ways of taking a turn
// inside it. That's why modality sits on the TURN, not the conversation: a
// thread can start as typing at the kitchen table, escalate to speech on a
// walk, and come back to typing — one thread, one history, one review.
//
// Table-shaped like every other store here (camelCase record ↔ snake_case
// future SQL column). Main-app only: Grow keeps its own criar_* tables and its
// own boundary rules.

import type { Correction } from "@/lib/types"
import type { VoiceEngineMeta, VoiceObservationRecord, VoiceSeedContext } from "@/lib/voice/types"

export type TurnSpeaker = "user" | "assistant"

export type TurnModality = "text" | "voice"

export interface Conversation {
  id: string
  /** Starter this began from — a voice-topic id or a legacy text topic id. */
  starterId: string | null
  /** Display name, e.g. "Charla suelta". */
  title: string
  emoji: string
  startedAt: string // ISO datetime
  lastTurnAt: string // ISO datetime — drives resume ordering and expiry
  /** Total live voice seconds across every spoken stretch of this thread. */
  voiceSeconds: number
  /** When the post-session analysis last completed; absent = never analyzed. */
  analyzedAt?: string | null
  /** From the most recent spoken stretch — engine provenance, and what it was seeded with. */
  engineMeta?: VoiceEngineMeta | null
  seedContext?: VoiceSeedContext | null
}

export interface ConversationTurn {
  id: string
  conversationId: string
  speaker: TurnSpeaker
  modality: TurnModality
  text: string
  /**
   * Inline correction, attached to a user turn.
   *
   * TEXT ONLY. Voice turns defer every correction to the post-session review:
   * mid-conversation correction cards are unreadable when the phone is in a
   * pocket, and the spoken recast has already done the teaching in the moment.
   */
  correction?: Correction
  translation?: string
  createdAt: string // ISO datetime
  ordinal: number // position within the conversation
}

/**
 * An analysis finding. Structurally identical to the voice observation record —
 * same types, same taxonomy-tagged `detail`, so `SessionReview` and the weekly
 * report work unchanged. Its `sessionId` field holds the CONVERSATION id here;
 * kept under that name rather than forking the shape for one renamed column.
 */
export type ConversationObservation = VoiceObservationRecord
