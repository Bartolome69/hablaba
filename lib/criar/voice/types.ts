// Grow's binding of the shared voice types (lib/voice/types.ts) to the criar_*
// tables: every record is the shared shape plus the module's scope column,
// childId. Existing imports of the Criar* names keep working through here.

export * from "@/lib/voice/types"

import type {
  VoiceObservationRecord,
  VoiceObservationType,
  VoiceSessionRecord,
  VoiceTurnRecord,
} from "@/lib/voice/types"

/** → criar_voice_sessions (child_id is the module's scope column). */
export type CriarVoiceSession = VoiceSessionRecord & { childId: string }

/** → criar_voice_turns. */
export type CriarVoiceTurn = VoiceTurnRecord

/** → criar_voice_observations. */
export type CriarVoiceObservation = VoiceObservationRecord

export type CriarVoiceObservationType = VoiceObservationType
