// Provider-agnostic voice-mode types.
//
// BOUNDARY: this file (and everything that imports only this file) must stay
// free of any engine-specific vocabulary — no OpenAI event names, no WebRTC
// types. `openai-realtime.ts` is the only module allowed to know how the audio
// actually gets there. Trialling ElevenLabs later means adding a second
// VoiceEngine implementation and changing one factory reference; the
// transcript, persistence and analysis layers should not need to move.

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
