"use client"

// Shared client half of the transcript analysis: turns + seed in, tagged
// observations out, via the stateless /api/analyze route. Store-agnostic —
// each surface (lib/criar/voice/analysis.ts for Grow,
// lib/conversations/analysis.ts for the main app) owns persistence and the
// analyzedAt bookkeeping around this call.

import type { VoiceObservationType, VoiceSeedContext, VoiceTurnRecord } from "./types"

/** A turn as the analyzer needs it: text plus how it was produced. */
export type AnalyzableTurn = Pick<VoiceTurnRecord, "id" | "speaker" | "text" | "ordinal"> & {
  /** Spoken turns are transcriptions, so their spelling isn't the learner's. */
  modality?: "text" | "voice"
}

export interface AnalyzedObservation {
  turnId: string | null
  type: VoiceObservationType
  detail: { original?: string; corrected?: string; note?: string; tag?: string }
}

export async function requestTranscriptAnalysis(
  turns: AnalyzableTurn[],
  seedContext: Pick<VoiceSeedContext, "packPhrases" | "captureLessons">,
): Promise<AnalyzedObservation[]> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      turns: turns.map((t) => ({
        id: t.id,
        speaker: t.speaker,
        text: t.text,
        ordinal: t.ordinal,
        modality: t.modality ?? "voice",
      })),
      seedContext: {
        packPhrases: seedContext.packPhrases,
        captureLessons: seedContext.captureLessons,
      },
    }),
  })
  if (!res.ok) throw new Error(`Analyze API error: ${res.status}`)
  const data = (await res.json()) as { observations?: AnalyzedObservation[] }
  return data.observations ?? []
}
