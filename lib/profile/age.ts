// The child's age, derived from the birthdate in Ajustes, never stored
// (refresh Phase 5). Pure functions only, so server routes can use them too:
// the client reads the profile and passes months in.
//
// Gate, don't delete: an unknown age (no birthdate) shows everything, which is
// exactly how the app behaved before age-awareness existed.

export type AgeBand = "0-6m" | "6-12m" | "12-18m" | "18-36m" | "3y+" | "unknown"

export function monthsOld(birthdate: string | null | undefined, now: Date = new Date()): number | null {
  if (!birthdate) return null
  const [y, m, d] = birthdate.split("-").map(Number)
  if (!y || !m || !d) return null
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m) - (now.getDate() < d ? 1 : 0)
  return Math.max(0, months)
}

export function ageBand(months: number | null): AgeBand {
  if (months === null) return "unknown"
  if (months < 6) return "0-6m"
  if (months < 12) return "6-12m"
  if (months < 18) return "12-18m"
  if (months < 36) return "18-36m"
  return "3y+"
}

export interface AgeGated {
  minMonths?: number
  maxMonths?: number
}

/** Does this item suit the child? Unknown age: yes, always. */
export function fitsAge(item: AgeGated, months: number | null): boolean {
  if (months === null) return true
  if (item.minMonths !== undefined && months < item.minMonths) return false
  if (item.maxMonths !== undefined && months > item.maxMonths) return false
  return true
}

/** Items written for a specific age lead when the child is that age. */
export function isAgeSpecific(item: AgeGated, months: number | null): boolean {
  return months !== null && (item.minMonths !== undefined || item.maxMonths !== undefined) && fitsAge(item, months)
}

/**
 * One line for Elena's prompts, so she talks about the life the parent is
 * actually living: naps and feeds for a baby, not the playground.
 */
export function ageGuidance(months: number | null | undefined): string {
  if (months === null || months === undefined) return ""
  if (months < 6)
    return `The baby is ${months} months old: feeds, sleep (or the lack of it), nappies, cuddles, first smiles, tummy time, how the parent is coping. The baby doesn't sit, crawl, walk or talk yet; never assume they do.`
  if (months < 12)
    return `The baby is ${months} months old: naps and night feeds, weaning and first foods (purées, la papilla, la cuchara), teething, babbling, sitting up, maybe crawling. They don't walk or talk yet; don't bring up the playground, toys that need hands they can't use yet, or nursery.`
  if (months < 18)
    return `The child is ${months} months old: first steps, first words, finger food, naps, teething, exploring everything. Short sentences to them, lots of naming things.`
  if (months < 36)
    return `The child is ${months} months old, a toddler: walking and running, talking more every week, tantrums, the plaza, the jardín, pretend play, potty training.`
  return `The child is ${Math.floor(months / 12)} years old: full conversations, questions, school or jardín, friends, stories.`
}
