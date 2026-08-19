"use client"

// Shared client half of the transcript analysis: turns + seed in, tagged
// observations out, via the stateless /api/analyze route. Store-agnostic —
// each surface (lib/criar/voice/analysis.ts for Grow, lib/voice/store.ts for
// Speak) owns persistence and the analyzedAt bookkeeping around this call.

import type { VoiceObservationType, VoiceSeedContext, VoiceTurnRecord } from "./types"

export interface AnalyzedObservation {
  turnId: string | null
  type: VoiceObservationType
  detail: { original?: string; corrected?: string; note?: string; tag?: string }
}

export async function requestTranscriptAnalysis(
  turns: VoiceTurnRecord[],
  seedContext: Pick<VoiceSeedContext, "packPhrases" | "captureLessons">,
): Promise<AnalyzedObservation[]> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      turns: turns.map((t) => ({ id: t.id, speaker: t.speaker, text: t.text, ordinal: t.ordinal })),
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
