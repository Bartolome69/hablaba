"use client"

// Open/close state for the global "¿Cómo se dice?" sheet, so anything (the
// bar, and in Phase 4 a word in a chat bubble) can open it, optionally with a
// query and the sentence it came from.

import { useSyncExternalStore } from "react"

export interface AskSheetState {
  open: boolean
  query?: string
  context?: string
  /** "word" when a single word was picked out of a sentence (a chat bubble). */
  want?: "auto" | "word"
  /** Opened from the bar's mic: start listening straight away. */
  listen?: boolean
  /** Bumps on every open so the panel remounts fresh. */
  key: number
}

let state: AskSheetState = { open: false, key: 0 }
const listeners = new Set<() => void>()
const set = (next: AskSheetState) => {
  state = next
  listeners.forEach((l) => l())
}

export function openAskSheet(
  opts: { query?: string; context?: string; want?: "auto" | "word"; listen?: boolean } = {},
) {
  set({ open: true, query: opts.query, context: opts.context, want: opts.want, listen: opts.listen, key: state.key + 1 })
}

export function closeAskSheet() {
  set({ ...state, open: false })
}

export function useAskSheet(): AskSheetState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}
