// Who she is.
//
// One partner, one name, one voice — not a setting. She's the person the
// parent talks to every day, and a picker offering six of her (three of them
// men, while every line of copy in the app calls her "she") made her a
// configurable resource instead of someone you know. CLAUDE.md already said
// "one persona app-wide"; this is that, followed through.
//
// The name lives here rather than in the prompts because the prompts describe
// her manner, not her identity — she introduces herself only if asked, and the
// UI is what actually calls her Elena.

/** Her name, wherever the app refers to her. */
export const PARTNER_NAME = "Elena"

/**
 * Her voice. Valid on BOTH `gpt-4o-mini-tts` and `gpt-realtime`, which is what
 * lets the speaker button and voice mode sound like the same person — the two
 * engines share one voice set (alloy, ash, ballad, coral, echo, sage, shimmer,
 * verse, marin, cedar) and `marin` is in it.
 *
 * If this ever changes, it must change to another id in that shared list, or
 * the app splits back into two voices.
 */
export const PARTNER_VOICE = "marin"
