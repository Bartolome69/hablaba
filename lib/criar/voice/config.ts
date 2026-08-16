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
 * TTL for the ephemeral client secret. Only needs to cover the round trip from
 * mint to SDP exchange; short by design so a leaked token is near-worthless.
 * The API accepts 10–7200.
 */
export const TOKEN_TTL_SECONDS = 60

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
