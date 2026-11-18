"use client"

// Elena's words, each one look-up-able (refresh Phase 4). A tap anywhere on
// the message still toggles its translation, as before; HOLDING a word opens
// the "¿Cómo se dice?" sheet with that word and its sentence, so a word met in
// conversation is two taps from being a flashcard. Long-press rather than tap
// because tap was already taken by translation (decision 5).

import { useRef } from "react"
import { openAskSheet } from "@/lib/ask/sheet"

export const WORD_HINT_KEY = "hint_word_lookup_used"

const HOLD_MS = 450
const MOVE_TOLERANCE = 8
// A word: letters, with inner apostrophes or hyphens. Everything else (spaces,
// punctuation, ¿¡) renders as plain text between the word spans.
const TOKEN = /(\p{L}[\p{L}'’-]*)/u

export function LookupText({
  text,
  onTap,
  className,
}: {
  text: string
  /** A plain tap: the existing behaviour (translation). */
  onTap?: () => void
  className?: string
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    origin.current = null
  }

  const lookUp = (word: string) => {
    fired.current = true
    try {
      navigator.vibrate?.(12)
    } catch {}
    try {
      localStorage.setItem(WORD_HINT_KEY, "1")
    } catch {}
    window.dispatchEvent(new Event(WORD_HINT_KEY))
    openAskSheet({ query: word, context: text, want: "word" })
  }

  const wordAt = (target: EventTarget | null) =>
    target instanceof HTMLElement ? (target.dataset.w ?? null) : null

  const parts = text.split(TOKEN)

  return (
    <p
      className={`select-none [-webkit-touch-callout:none] ${className ?? ""}`}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        fired.current = false
        const word = wordAt(e.target)
        if (!word) return
        origin.current = { x: e.clientX, y: e.clientY }
        timer.current = setTimeout(() => lookUp(word), HOLD_MS)
      }}
      onPointerMove={(e) => {
        if (!origin.current) return
        if (Math.abs(e.clientX - origin.current.x) > MOVE_TOLERANCE || Math.abs(e.clientY - origin.current.y) > MOVE_TOLERANCE) clear()
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={clear}
      onContextMenu={(e) => {
        const word = wordAt(e.target)
        if (!word) return
        e.preventDefault()
        clear()
        lookUp(word)
      }}
      onClick={() => {
        // The click that ends a long-press is not a tap.
        if (fired.current) {
          fired.current = false
          return
        }
        onTap?.()
      }}
      role={onTap ? "button" : undefined}
    >
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} data-w={part} className="rounded-[3px] transition-colors active:bg-green-tint">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </p>
  )
}
