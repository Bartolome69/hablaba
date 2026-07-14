import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
