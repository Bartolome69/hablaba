"use client"

// Grow's side of the post-session analysis: orchestrates the shared
// /api/analyze call (lib/voice/analysis.ts) around the criar_* store.
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
import { requestTranscriptAnalysis } from "@/lib/voice/analysis"
import type { CriarVoiceObservation } from "./types"

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

  const analyzed = await requestTranscriptAnalysis(turns, session.seedContext)
  const now = new Date().toISOString()
  const observations: CriarVoiceObservation[] = analyzed.map((o) => ({
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
