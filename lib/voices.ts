// The app's voices — ONE set, valid on both engines.
//
// There used to be two voice systems that never met: TTS (the speaker button
// on a message, a phrase, a word) read from this file, while voice mode's
// Realtime session had "marin" hardcoded server-side. So the same partner
// sounded like two different people depending on how you were talking to her,
// and the picker in Ajustes silently did nothing to voice mode.
//
// They can share a set because they always could: `gpt-4o-mini-tts` and
// `gpt-realtime` accept exactly the same voices —
//   alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
// — so every id below works identically in both. That constraint is the whole
// point of this file: NEVER add a voice that only one engine supports, or the
// split comes back.
//
// The old ids (nova, onyx, fable) predate that set and Realtime cannot produce
// them at all, which is why they're gone — see LEGACY_VOICE_IDS below, which
// carries anyone who picked one across to the nearest current voice.

export type VoiceId =
  | "marin"
  | "coral"
  | "alloy"
  | "cedar"
  | "echo"
  | "verse"

export interface Voice {
  id: VoiceId
  name: string
  descriptor: string
}

export const voices: Voice[] = [
  { id: "marin", name: "Elena",     descriptor: "Warm" },
  { id: "coral", name: "Sofía",     descriptor: "Bright" },
  { id: "alloy", name: "Valentina", descriptor: "Clear" },
  { id: "cedar", name: "Carlos",    descriptor: "Deep" },
  { id: "echo",  name: "Marcos",    descriptor: "Natural" },
  { id: "verse", name: "Diego",     descriptor: "Expressive" },
]

/**
 * The warm Argentine partner, and the one persona the app has (CLAUDE.md).
 * `marin` was already voice mode's hardcoded voice, so defaulting to it here
 * means anyone who never touched the picker hears the SAME voice they always
 * heard in voice mode — and the speaker button stops being a stranger.
 */
export const defaultVoiceId: VoiceId = "marin"

const VOICE_IDS = new Set<string>(voices.map((v) => v.id))

/**
 * Voices from before the shared set, mapped to their nearest current
 * equivalent. Kept so a stored preference survives this change instead of
 * silently snapping back to the default.
 */
const LEGACY_VOICE_IDS: Record<string, VoiceId> = {
  nova: "marin", // was Elena — Elena is marin now
  shimmer: "coral", // was Sofía
  onyx: "cedar", // was Carlos
  fable: "verse", // was Diego
  // alloy (Valentina) and echo (Marcos) carried over unchanged.
}

/** Narrow anything — a stored string, a request body — to a usable voice. */
export function resolveVoiceId(value: unknown): VoiceId {
  if (typeof value !== "string") return defaultVoiceId
  if (VOICE_IDS.has(value)) return value as VoiceId
  return LEGACY_VOICE_IDS[value] ?? defaultVoiceId
}

export function getVoice(id: VoiceId): Voice {
  return voices.find((v) => v.id === id) ?? voices[0]
}
