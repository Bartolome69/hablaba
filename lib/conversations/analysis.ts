"use client"

// Post-conversation analysis for unified threads. Same contract as the voice
// version it replaces: run once, cache via `analyzedAt`, replace-not-append on
// re-run, throw so callers can offer a retry.
//
// The whole thread is analysed, typed and spoken turns together — that's the
// point of unifying them. Modality travels with each turn so the route can hold
// spoken turns to a different standard (their spelling belongs to the
// transcriber, not the learner).

import { requestTranscriptAnalysis } from "@/lib/voice/analysis"
import { markUsedByText } from "@/lib/phrases/store"
import { getConversation, listObservations, listTurns, markAnalyzed, saveObservations } from "./store"
import type { ConversationObservation } from "./types"

export async function ensureConversationAnalysis(
  conversationId: string,
): Promise<ConversationObservation[]> {
  const conversation = getConversation(conversationId)
  if (!conversation) return []
  if (conversation.analyzedAt) return listObservations(conversationId)

  const turns = listTurns(conversationId)
  if (!turns.some((t) => t.speaker === "user")) {
    markAnalyzed(conversationId)
    return []
  }

  const analyzed = await requestTranscriptAnalysis(
    turns.map((t) => ({
      id: t.id,
      speaker: t.speaker,
      text: t.text,
      ordinal: t.ordinal,
      modality: t.modality,
    })),
    {
      packPhrases: conversation.seedContext?.packPhrases ?? [],
      captureLessons: conversation.seedContext?.captureLessons ?? [],
    },
  )

  const now = new Date().toISOString()
  const observations: ConversationObservation[] = analyzed.map((o) => ({
    id: crypto.randomUUID(),
    sessionId: conversationId,
    turnId: o.turnId,
    type: o.type,
    detail: o.detail,
    createdAt: now,
  }))

  saveObservations(observations)

  // Close the phrase state machine: a confirmed real-world use moves the
  // matching library phrase practicando → usada. Loose text match by design —
  // the analysis quotes what was SAID, which rarely equals the phrase verbatim.
  for (const o of observations) {
    if (o.type === "target_phrase_used" && o.detail.original) {
      markUsedByText(o.detail.original)
    }
  }
  markAnalyzed(conversationId)
  return observations
}
