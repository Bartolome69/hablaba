"use client"

// Client side of the post-session analysis. Stateless server, client-owned
// persistence — the same shape as every other LLM feature in the module.
//
// Called twice by design: fire-and-forget from the voice screen when a session
// ends, and lazily from the session detail view if the observations aren't
// there yet (covers a killed tab, a failed first attempt, or a session ended
// by unmount). `analyzedAt` on the session row is what makes "analyzed, found
// nothing" different from "not analyzed yet", so the lazy path doesn't retry
// forever on clean sessions. Re-running is harmless: observations replace per
// session, never append.

import {
  getVoiceSession,
  listVoiceObservations,
  listVoiceTurns,
  markVoiceSessionAnalyzed,
  saveVoiceObservations,
} from "../store"
import type { CriarVoiceObservation, CriarVoiceObservationType } from "./types"

interface AnalyzeResponse {
  observations: {
    turnId: string | null
    type: CriarVoiceObservationType
    detail: CriarVoiceObservation["detail"]
  }[]
}

/**
 * Returns the session's observations, running the analysis first if it hasn't
 * happened yet. Throws on network/server failure so callers can offer a retry.
 */
export async function ensureSessionAnalysis(sessionId: string): Promise<CriarVoiceObservation[]> {
  const session = getVoiceSession(sessionId)
  if (!session) return []
  if (session.analyzedAt) return listVoiceObservations(sessionId)

  const turns = listVoiceTurns(sessionId)
  if (!turns.some((t) => t.speaker === "user")) {
    // Nothing of the parent's to analyze — mark done so nobody retries.
    markVoiceSessionAnalyzed(sessionId)
    return []
  }

  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      turns: turns.map((t) => ({ id: t.id, speaker: t.speaker, text: t.text, ordinal: t.ordinal })),
      seedContext: {
        packPhrases: session.seedContext.packPhrases,
        captureLessons: session.seedContext.captureLessons,
      },
    }),
  })
  if (!res.ok) throw new Error(`Analyze API error: ${res.status}`)

  const data = (await res.json()) as AnalyzeResponse
  const now = new Date().toISOString()
  const observations: CriarVoiceObservation[] = (data.observations ?? []).map((o) => ({
    id: crypto.randomUUID(),
    sessionId,
    turnId: o.turnId,
    type: o.type,
    detail: o.detail,
    createdAt: now,
  }))

  saveVoiceObservations(observations)
  markVoiceSessionAnalyzed(sessionId)
  return observations
}
