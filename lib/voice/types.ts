// Provider-agnostic voice-mode types, shared by every voice surface (Grow's
// Charlar today, Speak's voice mode next).
//
// BOUNDARY: this file (and everything that imports only this file) must stay
// free of any engine-specific vocabulary — no OpenAI event names, no WebRTC
// types. `openai-realtime.ts` is the only module allowed to know how the audio
// actually gets there. Trialling ElevenLabs later means adding a second
// VoiceEngine implementation and changing one factory reference; the
// transcript, persistence and analysis layers should not need to move.
//
// Also free of module-specific vocabulary: the records below carry no childId
// — each surface binds its own scope (lib/criar/voice/types.ts adds childId
// for Grow's criar_* tables).

export type VoiceSpeaker = "user" | "assistant"

/**
 * Lifecycle of a voice session, as the UI needs to talk about it.
 *
 * `interrupted` is its own state on purpose: on iOS, backgrounding Safari or
 * locking the screen suspends audio capture and the session does not come back
 * on its own. We surface that honestly rather than pretending it survived.
 */
export type VoiceConnectionState =
  | "idle"
  | "requesting-mic"
  | "connecting"
  | "live"
  | "interrupted"
  | "ended"
  | "error"

export type VoiceErrorKind =
  | "mic-denied"
  | "mic-unavailable"
  | "unsupported"
  | "token"
  | "network"
  | "engine"

export interface VoiceError {
  kind: VoiceErrorKind
  /** Spanish, shown to the parent. */
  message: string
  cause?: unknown
}

/**
 * One conversational turn. Emitted repeatedly as it streams: the same `id`
 * arrives with growing `text` until `final` flips true.
 *
 * `ordinal` is assigned when the turn is first seen and never changes, because
 * user transcription resolves asynchronously and can land after the assistant
 * has already started replying — ordering by arrival time would interleave the
 * transcript wrongly.
 */
export interface VoiceTurn {
  id: string
  speaker: VoiceSpeaker
  text: string
  final: boolean
  startedAt: string // ISO datetime
  ordinal: number
}

/** Which engine produced a session — stored with it, so old transcripts stay interpretable. */
export interface VoiceEngineMeta {
  provider: string // "openai-realtime" | "elevenlabs" | …
  model: string
  voice: string
}

/**
 * What the conversation was seeded with: the curriculum material injected into
 * the partner's instructions, plus how much correcting the parent asked for.
 *
 * Doubles as Phase 3's `criar_voice_sessions.seed_context` jsonb — the Phase 4
 * analysis reads `packPhrases`/`captureLessons` back to check which target
 * phrases the parent actually used.
 */
export interface VoiceSeedContext {
  childName: string
  ageDescription: string
  packPhrases: string[]
  captureLessons: { request: string; spanish: string }[]
  correctionLevel: "mucho" | "normal" | "poco"
  /**
   * What the conversation was about (lib/voice-topics.ts). Optional because
   * sessions recorded before topics existed don't have one.
   */
  topicId?: string
  /**
   * Last week's weak spots (from the analysis observations), as short hints
   * the partner weaves in without announcing — see assembleFocusAreas().
   */
  focusAreas?: string[]
}

// --- persisted records (localStorage today, SQL later) ---
//
// Table-shaped, camelCase record ↔ snake_case future SQL column. Surfaces add
// their own scope column (Grow: childId) in their binding layer.

export interface VoiceSessionRecord {
  id: string
  startedAt: string // ISO datetime
  endedAt: string | null // null = still running, or the tab died before the stamp
  durationSeconds: number | null
  seedContext: VoiceSeedContext // → seed_context jsonb
  engineMeta: VoiceEngineMeta // → engine_meta jsonb
  /**
   * When the post-session analysis last completed. Missing/undefined = not yet
   * analyzed (the session detail view lazily triggers it), which is distinct
   * from "analyzed and found nothing".
   */
  analyzedAt?: string | null
}

export interface VoiceTurnRecord {
  id: string
  sessionId: string
  speaker: VoiceSpeaker
  text: string
  startedAt: string // ISO datetime
  ordinal: number // spoken order within the session (see VoiceTurn.ordinal)
}

/**
 * One tagged finding from the post-session analysis (Phase 4).
 *
 * `type` is the coarse family; `detail.tag` is the fine-grained grouping key
 * and — for grammar findings — MUST be an exercises-taxonomy topic id
 * (lib/exercises/taxonomy.json, validated in /api/analyze). That id is what
 * lets the weekly report link a pattern straight to practice material.
 *
 * WEEKLY REPORT HOOK: the future report is a 7-day group-by over (type,
 * detail.tag) on this table plus one narrative-generation call. Keep both
 * fields groupable — no free-prose values.
 */
export type VoiceObservationType =
  | "error_grammar"
  | "voseo_lapse" // reserved: only meaningful if VOICE_REGISTER flips to voseo
  | "avoidance"
  | "repetition"
  | "code_switch"
  | "target_phrase_used"

/**
 * Tags that are voice-mode vocabulary rather than exercises-taxonomy topic
 * ids. Anything NOT in this list is a topic id and can deep-link to
 * `/app/exercises?topic=<tag>` (a URL string, so the module boundary holds).
 */
export const VOICE_ONLY_TAGS = [
  "code-switch",
  "vocab-repetition",
  "target-phrase",
  "other",
] as const

export function isPracticeableTag(tag: string | undefined): tag is string {
  return !!tag && !(VOICE_ONLY_TAGS as readonly string[]).includes(tag)
}

export interface VoiceObservationRecord {
  id: string
  sessionId: string
  turnId: string | null // null = session-level pattern (e.g. repetition)
  type: VoiceObservationType
  detail: {
    original?: string // what the parent said
    corrected?: string // the natural form
    note?: string // one encouraging sentence, in Spanish
    tag?: string // grouping key: exercises topic id, or a stable slug
  }
  createdAt: string // ISO datetime
}
