// When a word comes back.
//
// A Leitner ladder: get a word right and it climbs a box, and each box waits
// longer before showing it again. Get it wrong and it drops one box (one, not
// back to zero — "encourage, never pressure" is a product rule, and a single
// blank shouldn't wipe three weeks of knowing it). Reach the top box and the
// word rests for over a month before surfacing to check it stuck.
//
// Chosen over an SM-2 style algorithm because SM-2 wants a graded recall
// quality (0–5) and this deck asks one honest binary — "lo sabía" or "otra
// vez". Inventing a quality score from a yes/no would be modelling precision
// that isn't there.

/**
 * Days each box waits. Index = box; box 0 is due immediately, so a new word
 * and a just-missed word both come back in the next session.
 *
 * Roughly ×2.2 per step, landing the top box at five weeks: long enough to be
 * a real test of retention, short enough that a parent doesn't come back to a
 * word they've entirely lost.
 */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 16, 35] as const

export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1

/**
 * The box at which a word counts as learnt and goes quiet. Reaching it takes
 * five "lo sabía" in a row from new — this is the "x amount of times" after
 * which a word stops competing with words that still need the work.
 */
export const LEARNED_BOX = MAX_BOX

const DAY_MS = 86_400_000

export interface Schedule {
  box: number
  dueAt: string // ISO datetime
}

function clampBox(box: number): number {
  if (!Number.isFinite(box)) return 0
  return Math.min(Math.max(Math.round(box), 0), MAX_BOX)
}

/** Where a word starts: box 0, due now. */
export function initialSchedule(at = new Date()): Schedule {
  return { box: 0, dueAt: at.toISOString() }
}

/**
 * The next box and due date after one review.
 *
 * A miss drops one box AND becomes due immediately, rather than waiting out
 * the new box's interval. Those are two separate mercies and it needs both:
 * dropping only one box means a blank doesn't wipe weeks of knowing the word,
 * and being due now means the word you just failed comes back next session
 * instead of disappearing for three days — which is what "drop a box" alone
 * would do, and is the opposite of what a miss should mean.
 */
export function nextSchedule(current: Schedule, known: boolean, at = new Date()): Schedule {
  const box = clampBox(known ? current.box + 1 : current.box - 1)
  const waitDays = known ? BOX_INTERVAL_DAYS[box] : 0
  return {
    box,
    dueAt: new Date(at.getTime() + waitDays * DAY_MS).toISOString(),
  }
}

export function isDue(schedule: Schedule, at = new Date()): boolean {
  return schedule.dueAt <= at.toISOString()
}

/** Top box and not yet due — the word is resting. */
export function isResting(schedule: Schedule, at = new Date()): boolean {
  return schedule.box >= LEARNED_BOX && !isDue(schedule, at)
}

/**
 * How far along a word is, for the quiet label on a list row. Three bands, not
 * six: the box number is machinery, and showing it would turn the list into a
 * scoreboard.
 */
export type LearningBand = "nueva" | "practicando" | "sabida"

export function bandFor(schedule: Schedule): LearningBand {
  if (schedule.box === 0) return "nueva"
  if (schedule.box >= 4) return "sabida"
  return "practicando"
}

export const BAND_LABELS: Record<LearningBand, string> = {
  nueva: "Nueva",
  practicando: "Practicando",
  sabida: "Sabida",
}

/**
 * "Lista" / "Vuelve mañana" / "Vuelve en 5 días" — relative, because a parent
 * cares that it's resting, not which Tuesday it lands on.
 */
export function describeDue(schedule: Schedule, at = new Date()): string {
  if (isDue(schedule, at)) return "Lista para repasar"
  const days = Math.ceil((new Date(schedule.dueAt).getTime() - at.getTime()) / DAY_MS)
  if (days <= 1) return "Vuelve mañana"
  if (days < 30) return `Vuelve en ${days} días`
  const months = Math.round(days / 30)
  return months <= 1 ? "Vuelve en un mes" : `Vuelve en ${months} meses`
}
