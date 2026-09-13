// A last line of defence against teaching the learner voseo.
//
// Hablaba's grammar is tú everywhere (CLAUDE.md). That rule lives in prompts,
// and prompts are probabilistic: a thread already full of the assistant's own
// voseo pulls it back into voseo however the system prompt is worded. The
// damage case is the CORRECTION field — the learner writes "me pones", which
// is right, and gets told the "better" version is "me ponés". A right answer
// marked wrong, and the opposite of the rule taught in its place.
//
// So the correction is checked before it's stored. This is a whole-word
// blocklist of the forms that actually turn up, NOT a morphological rule:
// "-ás" endings are a minefield (the future tense "podrás", "tendrás" and
// "serás" are perfectly good tú, as are "jamás", "quizás", "además"), and a
// clever heuristic that eats correct Spanish would be worse than the bug.
// If a new form slips through, add it here.

const VOSEO_FORMS = [
  // present indicative
  "sos", "tenés", "podés", "querés", "sabés", "hacés", "ponés", "venís",
  "decís", "vivís", "salís", "comés", "bebés", "leés", "creés", "debés",
  "animás", "llegás", "hablás", "pensás", "contás", "tomás", "dejás",
  "mirás", "estás vos", "sentís", "preferís", "elegís", "seguís",
  // imperatives
  "mirá", "contame", "decime", "escuchame", "ayudame", "fijate", "acordate",
  "vení", "tené", "poné", "hacé", "dejá", "tomá", "probá", "esperá", "pará",
  "escribí", "elegí", "seguí", "repetí", "pedime", "dame vos",
  // pronoun
  "vos",
]

const normalize = (s: string) =>
  s.toLowerCase().replace(/[¡!¿?.,;:'"«»()]/g, " ").replace(/\s+/g, " ").trim()

/** Whole-word match, so "vos" doesn't fire on "vosotros" or "nosotros". */
export function containsVoseo(text: string | undefined | null): boolean {
  if (!text) return false
  const haystack = ` ${normalize(text)} `
  return VOSEO_FORMS.some((form) => haystack.includes(` ${form} `))
}

/**
 * True when a "correction" would PUT voseo into the learner's mouth that their
 * own message didn't have. If they wrote voseo themselves, a correction that
 * still contains it is left alone — that's a partial fix, not a lesson in
 * voseo, and dropping it would be worse than showing it.
 */
export function correctionIntroducesVoseo(correction: {
  original?: string
  corrected?: string
}): boolean {
  return containsVoseo(correction.corrected) && !containsVoseo(correction.original)
}
