// A tiny published view that modules can put on the main app's Today screen.
//
// BOUNDARY: this exists so Today can show Grow's daily pack WITHOUT the main app
// importing Grow code — which the module rules forbid, and which would break
// Grow's extraction path. The dependency runs the allowed direction only: the
// main app owns this contract, Grow imports it and publishes into it, and Today
// reads whatever it finds. Neither side references the other's components.
//
// The `growDetails` slot pattern doesn't work here: that one relies on Grow
// rendering the shared Settings sheet and passing its own component in, and
// nobody from Grow renders Today.
//
// Anything published is a snapshot for one day. A stale record renders nothing
// rather than yesterday's phrases, so a module that stops publishing simply
// disappears from Today instead of going wrong.

const KEY = "today_highlights"

export interface TodayHighlights {
  date: string // YYYY-MM-DD, local — compared against today before rendering
  /** Which module published this. Only "grow" so far. */
  source: "grow"
  /** Short label, e.g. "Teo · bedtime". */
  title: string
  /** Where tapping through goes. A URL string, never a component reference. */
  href: string
  phrases: { spanish: string; english: string }[]
}

function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function publishTodayHighlights(input: Omit<TodayHighlights, "date">) {
  try {
    const payload: TodayHighlights = { ...input, date: todayKey(), phrases: input.phrases.slice(0, 3) }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {}
}

/** Today's highlights, or null if nothing was published today. */
export function readTodayHighlights(): TodayHighlights | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as TodayHighlights
    if (parsed.date !== todayKey()) return null
    if (!Array.isArray(parsed.phrases) || parsed.phrases.length === 0) return null
    return parsed
  } catch {
    return null
  }
}
