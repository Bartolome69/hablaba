// Which corrections are worth showing the learner.
//
// The chat model proposes a correction; these are the rules for whether it
// survives. Both exist because the prompt asking nicely was not enough — see
// lib/voseo.ts for how that went.

import { containsVoseo } from "./voseo"

/**
 * Strip everything the learner cannot easily type on a phone: accents,
 * Spanish punctuation, capitalisation, stray spacing.
 */
function bareWords(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // combining accents
    .replace(/[¡!¿?.,;:'"«»“”‘’()\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * True when the "correction" only adds accents, punctuation or capitals — the
 * learner's words were already right.
 *
 * Bart types on a phone without an accent layout and isn't going to change, so
 * "Que decimos?" → "¿Qué decimos?" is noise: it teaches nothing he'll act on,
 * and it burns the one correction slot a message gets on orthography instead
 * of grammar or word choice.
 *
 * This is the same rule /api/analyze already applies to SPOKEN turns, where
 * reporting accents on speech-to-text output is meaningless. Typing on a phone
 * without an accent key is the same situation.
 *
 * KNOWN COST: an accent is sometimes the only thing separating two real forms
 * — "hablo" / "habló" (present vs preterite), "esta" / "está". Those stop
 * being flagged, because from the text alone they are indistinguishable from a
 * missing accent. Accepted deliberately: the same information is already lost
 * on every spoken turn, and a rule that guessed which accents "count" would
 * misfire more often than it helped.
 */
export function isOrthographyOnly(original: string, corrected: string): boolean {
  return bareWords(original) === bareWords(corrected)
}

export interface ProposedCorrection {
  original?: string
  corrected?: string
}

/**
 * The one gate the chat client uses. A correction is shown only if it actually
 * changes the learner's words, doesn't put voseo in their mouth, and isn't
 * just accents and punctuation.
 */
export function shouldShowCorrection<T extends ProposedCorrection>(
  correction: T | null | undefined,
): correction is T {
  const original = correction?.original?.trim()
  const corrected = correction?.corrected?.trim()
  if (!original || !corrected) return false
  if (original === corrected) return false
  // Grammar is tú: never teach voseo the learner didn't write themselves.
  if (containsVoseo(corrected) && !containsVoseo(original)) return false
  if (isOrthographyOnly(original, corrected)) return false
  return true
}
