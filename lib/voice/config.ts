// Shared voice-mode configuration. Imported by both the server route (which
// mints the session) and the client (which enforces the cap), so the two can
// never drift apart.

/**
 * Hard cap on a single conversation, in seconds.
 *
 * This is the cost guardrail. Realtime audio bills per minute of audio in and
 * out, which is roughly an order of magnitude more than the text routes in this
 * app, so a session that gets left running in a pocket is a real expense. The
 * client stops the session at this mark whether or not anyone is talking.
 *
 * Note the ephemeral client secret's TTL does NOT cap this: the secret expires
 * as a *credential* for opening sessions, and an already-open session keeps
 * running. The client-side timer is the actual limit.
 */
export const MAX_SESSION_SECONDS = 15 * 60

/** Warn the parent this quietly, before cutting them off. */
export const SESSION_WARNING_SECONDS = 60

/**
 * How long a paused conversation is held before we end and save it.
 *
 * A pause releases the mic and transmits nothing, so the cost while held is
 * negligible — but the Realtime session is still open on OpenAI's side and we
 * don't control its server-side lifetime. Rather than let a forgotten pause
 * rot into a session that fails on resume, close it cleanly and keep the
 * transcript.
 */
export const MAX_PAUSE_SECONDS = 10 * 60

/**
 * TTL for the ephemeral client secret. Only needs to cover the round trip from
 * mint to SDP exchange; short by design so a leaked token is near-worthless.
 * The API accepts 10–7200.
 */
export const TOKEN_TTL_SECONDS = 60

/**
 * Output volume multipliers for the partner's voice.
 *
 * Needed because on Android, holding a mic open routes playback to the
 * voice-call audio stream, which is quieter than media and has its own volume
 * slider — she can end up hard to hear with the media volume already maxed.
 * A boost above 1 runs the audio through WebAudio (gain + limiter); level 1 is
 * the plain audio element, which is also the fallback if WebAudio misbehaves.
 */
export const OUTPUT_GAIN_LEVELS = [1, 2, 3] as const

export const OUTPUT_GAIN_KEY = "voice_output_gain"

/** Default to a boost: the untouched level is measurably too quiet on Android. */
export const DEFAULT_OUTPUT_GAIN = 2

export function nextOutputGain(current: number): number {
  const i = OUTPUT_GAIN_LEVELS.indexOf(current as (typeof OUTPUT_GAIN_LEVELS)[number])
  return OUTPUT_GAIN_LEVELS[(i + 1) % OUTPUT_GAIN_LEVELS.length]
}

/** How much the parent wants to be pulled up on mistakes. */
export type CorrectionLevel = "mucho" | "normal" | "poco"

export const CORRECTION_LEVELS: CorrectionLevel[] = ["mucho", "normal", "poco"]

export const CORRECTION_LEVEL_KEY = "criar_correction_level"

export const DEFAULT_CORRECTION_LEVEL: CorrectionLevel = "normal"

export function isCorrectionLevel(value: unknown): value is CorrectionLevel {
  return typeof value === "string" && (CORRECTION_LEVELS as string[]).includes(value)
}

/**
 * Whether to hold the screen on during a conversation. Platform-dependent
 * default (see `defaultKeepScreenAwake`), overridable by the parent and
 * remembered.
 */
export const KEEP_AWAKE_KEY = "criar_voice_keep_awake"
