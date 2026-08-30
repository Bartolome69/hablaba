"use client"

// The daily pack is a QUERY over the phrase library, not a stored object.
//
// Two kinds of pack. "Recientes" is the learner's own rows — captures, saves,
// generated phrases — newest activity first, whatever moment they belong to.
// A MOMENT pack holds only rows tagged with that moment (captured gaps first,
// then saved, then generated; most recent first within each band), topped up
// from the authored starter set when the library runs short. Starters are
// read-only and never written to the library; generation only replaces them
// with personalised phrases on request.

import { assembleFocusAreas } from "@/lib/conversations/focus"
import { getProfile } from "@/lib/profile/store"
import { getStarterPhrases } from "./starter"
import { addPhrase, listPhrases, normalizePhraseText, updatePhrase } from "./store"
import { PHRASE_MOMENTS, type Phrase, type PhraseMoment } from "./types"

const PACK_SIZE = 12

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

/**
 * The learner's own recent rows — captured, saved and generated phrases in
 * lastTouchedAt order, any moment, no starters. The "Recientes" pack.
 */
export function queryRecentPhrases(size = PACK_SIZE): Phrase[] {
  return listPhrases()
    .filter((p) => p.text)
    .slice(0, size)
}

/**
 * The library's own rows for a moment — no starters, no generation. Strict
 * moment match: momentless rows (older captures, saved phrases) belong to
 * Recientes, not to every pack — that leak made the pills look broken.
 */
function libraryPackForMoment(moment: PhraseMoment, size: number): Phrase[] {
  return listPhrases()
    .filter((p) => p.text && p.state !== "usada" && p.moment === moment)
    .sort(packOrder)
    .slice(0, size)
}

/**
 * The pack the UI shows: library rows first, topped up to size with authored
 * starter phrases. Starters are materialised at read time and never stored,
 * so they can't leak into conversation seeding or the review deck; any the
 * library already holds (verbatim or re-generated) are skipped.
 */
export function queryPackForMoment(moment: PhraseMoment, size = PACK_SIZE): Phrase[] {
  const library = libraryPackForMoment(moment, size)
  if (library.length >= size) return library
  const taken = new Set(
    listPhrases()
      .map((p) => normalizePhraseText(p.text))
      .filter(Boolean),
  )
  const starters = getStarterPhrases(moment).filter(
    (s) => !taken.has(normalizePhraseText(s.text)),
  )
  return [...library, ...starters.slice(0, size - library.length)]
}

/**
 * Fill the moment's pack to size with PERSONALISED phrases, generating only
 * the library's shortfall (starters don't count — they're the floor, and
 * fresh generated rows displace them). Returns the full pack. Throws on
 * network failure so the caller can offer a retry; the pure query above
 * still works offline.
 */
export async function fillPackForMoment(moment: PhraseMoment, size = PACK_SIZE): Promise<Phrase[]> {
  const current = libraryPackForMoment(moment, size)
  const shortfall = size - current.length
  if (shortfall <= 0) return queryPackForMoment(moment, size)

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

/** A moment id from the API, validated against the closed vocabulary. */
function asMoment(value: unknown): PhraseMoment | undefined {
  return PHRASE_MOMENTS.includes(value as PhraseMoment) ? (value as PhraseMoment) : undefined
}

/**
 * Capture a real-life gap: generate the Spanish immediately and store it.
 * The API also classifies the capture into a daily moment, so what the
 * learner asked for shows up under the matching pill, not just Recientes.
 */
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
  const data = (await res.json()) as {
    phrases: { text: string; translation: string; moment?: string }[]
  }
  const generated = data.phrases?.[0]
  if (!generated) return null
  return addPhrase({
    text: generated.text,
    translation: generated.translation,
    moment: asMoment(generated.moment),
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
      const data = (await res.json()) as {
        phrases: { text: string; translation: string; moment?: string }[]
      }
      const generated = data.phrases?.[0]
      if (!generated) continue
      updatePhrase(p.id, {
        text: generated.text,
        translation: generated.translation,
        moment: p.moment ?? asMoment(generated.moment),
      })
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
