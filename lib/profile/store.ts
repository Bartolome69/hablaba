"use client"

// Profile: set-once configuration — dialect, correction style, child. One
// record under the `profile` key. Absorbed criar_children when the Grow module
// collapsed; stage stays DERIVED from the birthdate rather than stored.

import type { CorrectionLevel } from "@/lib/voice/config"

export type { CorrectionLevel }

export type SpanishDialect = "rioplatense" | "neutral"

export interface ProfileChild {
  name: string
  birthdate: string // YYYY-MM-DD
}

export interface Profile {
  dialect: SpanishDialect
  correctionLevel: CorrectionLevel
  child?: ProfileChild | null
}

const KEY = "profile"

export const DEFAULT_PROFILE: Profile = {
  dialect: "rioplatense",
  correctionLevel: "normal",
  child: null,
}

export function getProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_PROFILE
    const parsed = JSON.parse(raw) as Partial<Profile>
    return {
      dialect: parsed.dialect === "neutral" ? "neutral" : "rioplatense",
      correctionLevel:
        parsed.correctionLevel === "mucho" || parsed.correctionLevel === "poco"
          ? parsed.correctionLevel
          : "normal",
      child:
        parsed.child && typeof parsed.child.name === "string" && parsed.child.name
          ? { name: parsed.child.name, birthdate: parsed.child.birthdate ?? "" }
          : null,
    }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(patch: Partial<Profile>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getProfile(), ...patch }))
  } catch {}
}

// --- derived (ported from the Grow module's stage logic) ---

export type ChildStage = "newborn" | "toddler" | "preschool" | "school-age"

export function deriveStage(birthdate: string, now: Date = new Date()): ChildStage {
  const months = monthsBetween(new Date(birthdate), now)
  if (months < 12) return "newborn"
  if (months < 36) return "toddler"
  if (months < 60) return "preschool"
  return "school-age"
}

/** Human age for prompts, e.g. "3 months" / "2 years". */
export function describeAge(birthdate: string, now: Date = new Date()): string {
  const months = monthsBetween(new Date(birthdate), now)
  if (months < 1) return "a few weeks"
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`
  const years = Math.floor(months / 12)
  return `${years} year${years === 1 ? "" : "s"}`
}

function monthsBetween(from: Date, to: Date): number {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  return Math.max(0, to.getDate() < from.getDate() ? months - 1 : months)
}
