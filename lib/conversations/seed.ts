"use client"

// What a thread is seeded with: the learner's working set of phrases and the
// words they've been reviewing (refresh Phase 4). Voice built this at mic
// time; typed threads never had one, so /api/chat never saw the phrases and
// the analysis could never notice a seeded phrase used in typing. Now the
// first typed exchange seeds the thread once and stores it, so the analysis
// knows what to look for, whichever way the learner talks.

import { getConversationSeedPhrases } from "@/lib/phrases/pack"
import { markSeeded } from "@/lib/phrases/store"
import { childMonths, describeAge, getProfile } from "@/lib/profile/store"
import { getConversationSeedWords } from "@/lib/vocab/store"
import type { VoiceSeedContext } from "@/lib/voice/types"
import { getConversation, saveSeedContext } from "./store"

/** Fresh seeds: nueva → practicando for the phrases chosen. */
export function buildSeed(topicId?: string): VoiceSeedContext {
  const profile = getProfile()
  const phrases = getConversationSeedPhrases()
  markSeeded(phrases.map((p) => p.id))
  return {
    childName: profile.child?.name ?? "",
    ageDescription: profile.child?.birthdate ? describeAge(profile.child.birthdate) : "",
    packPhrases: phrases.map((p) => p.text),
    captureLessons: phrases.filter((p) => p.source === "captured").map((p) => ({ request: p.translation, spanish: p.text })),
    correctionLevel: profile.correctionLevel,
    dialect: profile.dialect,
    topicId,
    seedWords: getConversationSeedWords(),
    ageMonths: childMonths() ?? undefined,
  }
}

/** The thread's seed, creating and storing it the first time it's needed. */
export function ensureThreadSeed(conversationId: string): VoiceSeedContext | null {
  const conversation = getConversation(conversationId)
  if (!conversation) return null
  if (conversation.seedContext?.packPhrases) return conversation.seedContext
  const seed = buildSeed(conversation.starterId ?? undefined)
  saveSeedContext(conversationId, seed)
  return seed
}

/** The slice of a seed that /api/chat takes. */
export function chatSeedBody(seed: VoiceSeedContext | null) {
  // Age is read fresh, not from the stored seed: a thread can outlive a birthday.
  const months = childMonths()
  return seed
    ? {
        seedPhrases: seed.packPhrases.slice(0, 8),
        seedWords: (seed.seedWords ?? []).slice(0, 6),
        childName: seed.childName || undefined,
        ageMonths: months ?? undefined,
      }
    : {}
}
