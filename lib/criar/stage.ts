import type { CriarMoment, CriarStage } from "./types"

export function deriveStage(birthdate: string, now: Date = new Date()): CriarStage {
  const months = monthsSince(birthdate, now)
  if (months < 12) return "newborn"
  if (months < 36) return "toddler"
  if (months < 60) return "preschool"
  return "school-age"
}

export function monthsSince(birthdate: string, now: Date = new Date()): number {
  const birth = new Date(`${birthdate}T00:00:00`)
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  return Math.max(0, months)
}

/** "7 semanas", "5 meses", "2 años" — for headers and LLM context. */
export function describeAge(birthdate: string, now: Date = new Date()): string {
  const birth = new Date(`${birthdate}T00:00:00`)
  const days = Math.floor((now.getTime() - birth.getTime()) / 86_400_000)
  if (days < 7) return days === 1 ? "1 día" : `${Math.max(0, days)} días`
  const months = monthsSince(birthdate, now)
  if (months < 3) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? "1 semana" : `${weeks} semanas`
  }
  if (months < 24) return months === 1 ? "1 mes" : `${months} meses`
  const years = Math.floor(months / 12)
  return years === 1 ? "1 año" : `${years} años`
}

export const stageLabels: Record<CriarStage, string> = {
  newborn: "Recién nacido",
  toddler: "Deambulador",
  preschool: "Preescolar",
  "school-age": "Escolar",
}

// Routine moments per stage. Only newborn has content for now — the switch
// exists so later stages can plug in their own moments without schema changes.
export const stageMoments: Record<CriarStage, CriarMoment[]> = {
  newborn: [
    { id: "waking", label: "Waking up", emoji: "☀️" },
    { id: "feed", label: "Feeds", emoji: "🍼" },
    { id: "nappy", label: "Nappy change", emoji: "🧷" },
    { id: "pram-walk", label: "Pram walk", emoji: "🚼" },
    { id: "bath", label: "Bath", emoji: "🛁" },
    { id: "bedtime", label: "Bedtime", emoji: "🌙" },
    { id: "soothing", label: "Soothing", emoji: "🤍" },
  ],
  toddler: [],
  preschool: [],
  "school-age": [],
}
