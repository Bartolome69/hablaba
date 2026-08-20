"use client"

// The daily pack is a QUERY over the phrase library, not a stored object.
//
// Selection order for a moment: captured gaps first (they came from real
// life), then phrases already being practised, then new ones — most recent
// first within each band. Only when the library runs short does generation
// fill the gap, weighted toward recent observations.

import { assembleFocusAreas } from "@/lib/conversations/focus"
import { getProfile } from "@/lib/profile/store"
import { addPhrase, listPhrases, updatePhrase } from "./store"
import type { Phrase, PhraseMoment } from "./types"

const PACK_SIZE = 8

const SOURCE_PRIORITY: Record<Phrase["source"], number> = {
  captured: 0,
  saved: 1,
  generated: 2,
}

function packOrder(a: Phrase, b: Phrase): number {
  const bySource = SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
  if (bySource !== 0) return bySource
  return b.createdAt.localeCompare(a.createdAt)
}

/** The library's current pack for a moment — no generation, pure read. */
export function queryPackForMoment(moment: PhraseMoment, size = PACK_SIZE): Phrase[] {
  return listPhrases()
    .filter((p) => p.text && p.state !== "usada" && (p.moment === moment || !p.moment))
    .sort(packOrder)
    .slice(0, size)
}

/**
 * Fill the moment's pack to size, generating only the shortfall. Returns the
 * full pack (existing + newly generated). Throws on network failure so the
 * caller can offer a retry; the pure query above still works offline.
 */
export async function fillPackForMoment(moment: PhraseMoment, size = PACK_SIZE): Promise<Phrase[]> {
  const current = queryPackForMoment(moment, size)
  const shortfall = size - current.length
  if (shortfall <= 0) return current

  const profile = getProfile()
  const res = await fetch("/api/phrases/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      moment,
      count: shortfall,
      existing: listPhrases()
        .filter((p) => p.text)
        .map((p) => p.text)
        .slice(0, 60),
      focusAreas: assembleFocusAreas(),
      dialect: profile.dialect,
      childName: profile.child?.name,
    }),
  })
  if (!res.ok) throw new Error(`Phrase generation error: ${res.status}`)
  const data = (await res.json()) as { phrases: { text: string; translation: string }[] }
  for (const p of data.phrases ?? []) {
    addPhrase({ text: p.text, translation: p.translation, moment, source: "generated" })
  }
  return queryPackForMoment(moment, size)
}

/** Capture a real-life gap: generate the Spanish immediately and store it. */
export async function capturePhrase(captureText: string): Promise<Phrase | null> {
  const profile = getProfile()
  const res = await fetch("/api/phrases/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      capture: captureText,
      dialect: profile.dialect,
      childName: profile.child?.name,
    }),
  })
  if (!res.ok) throw new Error(`Capture generation error: ${res.status}`)
  const data = (await res.json()) as { phrases: { text: string; translation: string }[] }
  const generated = data.phrases?.[0]
  if (!generated) return null
  return addPhrase({
    text: generated.text,
    translation: generated.translation,
    source: "captured",
  })
}

/**
 * Complete captures migrated from Grow that never got their Spanish (stored
 * with empty text, the raw capture as translation). Fire-and-forget from the
 * library view; failures just leave them pending for the next visit.
 */
export async function completePendingCaptures(): Promise<number> {
  const pending = listPhrases().filter((p) => !p.text && p.translation)
  let completed = 0
  for (const p of pending.slice(0, 5)) {
    try {
      const profile = getProfile()
      const res = await fetch("/api/phrases/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capture: p.translation,
          dialect: profile.dialect,
          childName: profile.child?.name,
        }),
      })
      if (!res.ok) continue
      const data = (await res.json()) as { phrases: { text: string; translation: string }[] }
      const generated = data.phrases?.[0]
      if (!generated) continue
      updatePhrase(p.id, { text: generated.text, translation: generated.translation })
      completed++
    } catch {
      // Leave pending; the next library visit retries.
    }
  }
  return completed
}

/**
 * What a conversation gets seeded with: the working set (captured gaps first),
 * capped so the instructions stay lean. The caller marks these seeded, moving
 * nueva → practicando — the first arc of the phrase state machine.
 */
export function getConversationSeedPhrases(cap = 8): Phrase[] {
  return listPhrases()
    .filter((p) => p.text && p.state !== "usada")
    .sort(packOrder)
    .slice(0, cap)
}
