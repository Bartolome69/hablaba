// The seam between "a spoken conversation is happening" and "OpenAI Realtime
// over WebRTC is how it happens".
//
// Everything above this line (the session hook, the transcript UI, the store,
// the analysis job) programs against `VoiceEngine` only. Swapping in
// ElevenLabs Conversational AI for a better Argentine voice means writing a
// second module that satisfies this interface and changing which factory
// `use-voice-session.ts` calls.

import type { VoiceEngineMeta, VoiceError, VoiceTurn } from "./types"

export interface VoiceEngineHandlers {
  /** Fired on every partial and final turn update. Same `id` mutates in place. */
  onTurn(turn: VoiceTurn): void
  /** Engine reached a steady state worth showing (connected, dropped, …). */
  onOpen(meta: VoiceEngineMeta): void
  onClose(): void
  onError(error: VoiceError): void
  /** True while the parent is being heard speaking — drives the mic indicator. */
  onUserSpeaking(speaking: boolean): void
}

export interface VoiceEngineStartOptions {
  /**
   * Sink for the partner's voice. Created and played inside the user's tap
   * handler by the caller, because mobile Safari only unlocks audio playback
   * from a real gesture.
   */
  audioElement: HTMLAudioElement
}

export interface VoiceEngine {
  start(options: VoiceEngineStartOptions): Promise<void>
  /** Idempotent. Safe to call from unmount, from the stop button, and on error. */
  stop(): void
}

export type VoiceEngineFactory = (handlers: VoiceEngineHandlers) => VoiceEngine
