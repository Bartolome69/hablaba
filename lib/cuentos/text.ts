// Text helpers for Cuentos: tidy OCR output, hash it, split Spanish into words.
// Pure functions, no browser APIs, so unit tests cover them directly.

/**
 * Tidy what OCR returns so the parent has less to fix:
 * - a word broken over a line with a hyphen is joined ("sleep-\ny" → "sleepy")
 * - lines that are only a page number are dropped
 * - spaces collapse; at most one blank line between stanzas
 * Line breaks are kept: in picture books they are usually the verse.
 */
export function normalizeSourceText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/(\p{L})-\n\s*(\p{Ll})/gu, "$1$2")
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .filter((line) => !/^(?:\d{1,3}|[-–—]\s*\d{1,3}\s*[-–—])$/.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * A short, stable hash of a text, insensitive to whitespace only. Used to tell
 * whether a translation was made from the English as it is now (FNV-1a, 32
 * bits: this is a cache key, not security).
 */
export function hashText(text: string): string {
  const s = text.replace(/\s+/g, " ").trim()
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, "0")
}

export interface TextToken {
  text: string
  /** A word you can tap; false for spaces, punctuation, ¿¡ and line breaks. */
  word: boolean
}

// A word: letters, with inner apostrophes or hyphens. Same rule as the chat
// look-up (components/conversations/lookup-text.tsx).
const WORD = /(\p{L}[\p{L}'’-]*)/u

/** Split Spanish into tappable words and everything in between. */
export function splitWords(text: string): TextToken[] {
  return text
    .split(WORD)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, word: WORD.test(part) && /^\p{L}/u.test(part) }))
}

/** The form a word is cached and looked up under: lower case, accents kept. */
export function wordKey(word: string): string {
  return word.normalize("NFC").toLocaleLowerCase("es").replace(/[’']+$/u, "")
}
