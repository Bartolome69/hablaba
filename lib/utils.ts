import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Sentence case: first letter up, the rest exactly as given. Never title case. */
export function sentenceCase(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase('es') + text.slice(1) : text
}

/** Fisher–Yates shuffle into a new array. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pull the (possibly still-streaming) value of the JSON "reply" field out of a
// partial payload. The chat models are told to emit "reply" first, so this
// resolves almost immediately and grows as more tokens arrive.
export function extractReply(raw: string): string | null {
  const m = raw.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)"?/)
  if (!m) return null
  try {
    return JSON.parse(`"${m[1]}"`)
  } catch {
    return m[1]
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
  }
}
