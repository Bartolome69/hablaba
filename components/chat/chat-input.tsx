"use client"

// The text composer. Deliberately has NO dictation mic: the only microphone
// near this box is the live-conversation button beside it, so a mic can only
// ever mean one thing. In-app speech-to-text was removed (Aug 2026) — two
// identical mic icons with different meanings sat side by side, and keyboard
// dictation (e.g. Wispr Flow) covers typing by voice better anyway.
//
// Clay + calm: a recessed input well (pressed into the clay, not floating on
// it) under a row of quick-ask chips — Repetir / Ayudame / Más lento — that
// send a ready-made Spanish request, so the ask itself never needs typing.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { DuoIcon, type IconName } from "@/components/icons"

// Common English words that rarely appear in Spanish
const ENGLISH_STOP_WORDS = new Set([
  "the","is","are","was","were","have","has","had","this","that","with",
  "from","they","what","when","where","which","who","will","would","could",
  "should","does","did","am","an","be","by","for","if","it","of","on",
  "or","so","to","we","me","my","he","she","her","his","its","our","can",
  "but","and","not","you","your","i","do","at","in",
])

function looksLikeEnglish(text: string): boolean {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean)
  if (words.length < 2) return false
  const englishCount = words.filter((w) => ENGLISH_STOP_WORDS.has(w)).length
  return englishCount / words.length > 0.35
}

const QUICK_ASKS: { label: string; icon: IconName; text: string }[] = [
  { label: "Repetir", icon: "escuchar", text: "¿Lo podés repetir?" },
  { label: "Ayudame", icon: "rayo", text: "Ayudame, ¿cómo lo digo mejor?" },
  { label: "Más lento", icon: "lento", text: "Más despacio, por favor." },
]

// The composer is one `leading-6` line plus `py-3`, so a single line is 48px —
// the recessed well from the handoff. Cap growth at five lines and let the
// textarea scroll internally beyond that.
const LINE_HEIGHT = 24
const VERTICAL_PADDING = 24
const MIN_INPUT_HEIGHT = LINE_HEIGHT + VERTICAL_PADDING
const MAX_INPUT_HEIGHT = LINE_HEIGHT * 5 + VERTICAL_PADDING

interface ChatInputProps {
  onSend: (message: string) => void
  onFocus?: () => void
  onHeightChange?: () => void
  /** Show the Repetir / Ayudame / Más lento quick-ask chips. */
  quickAsks?: boolean
}

export function ChatInput({ onSend, onFocus, onHeightChange, quickAsks = true }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [languageError, setLanguageError] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const heightRef = useRef(MIN_INPUT_HEIGHT)

  // Grow the composer to fit its content. Measuring needs `height: auto`, which
  // would otherwise restart the CSS height transition from the measured value
  // and make the box snap — so the measurement is done with transitions off and
  // the previous height restored before the real one is applied.
  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return

    const previous = el.style.height
    el.style.transition = "none"
    el.style.height = "auto"
    const content = el.scrollHeight
    el.style.height = previous
    void el.offsetHeight // flush, so the transition below starts from `previous`
    el.style.transition = ""

    const next = Math.max(MIN_INPUT_HEIGHT, Math.min(content, MAX_INPUT_HEIGHT))
    el.style.height = `${next}px`
    el.style.overflowY = content > MAX_INPUT_HEIGHT ? "auto" : "hidden"

    if (next !== heightRef.current) {
      heightRef.current = next
      onHeightChange?.()
    }
  }, [onHeightChange])

  // Layout effect so the height is right before paint — typing and the reset
  // after send both flow through `value`.
  useLayoutEffect(() => {
    resize()
  }, [value, resize])

  const isTouchRef = useRef(false)
  useEffect(() => {
    isTouchRef.current = window.matchMedia?.("(pointer: coarse)").matches ?? false
  }, [])

  const handleSubmit = () => {
    if (!value.trim()) return
    if (looksLikeEnglish(value.trim())) {
      setLanguageError(true)
      return
    }
    setLanguageError(false)
    onSend(value.trim())
    setValue("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    if (languageError) setLanguageError(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey) return
    // On touch keyboards Return has to insert a newline — the send button is
    // right there. Enter still sends on a physical keyboard.
    if (isTouchRef.current) return
    if ((e.nativeEvent as KeyboardEvent).isComposing) return
    e.preventDefault()
    handleSubmit()
  }

  const hasText = value.trim().length > 0

  return (
    <div>
      {quickAsks && (
        <div className="flex flex-wrap gap-2 pb-3">
          {QUICK_ASKS.map((ask) => (
            <button
              key={ask.label}
              onClick={() => onSend(ask.text)}
              className="press-chip flex h-[34px] flex-none items-center gap-1.5 rounded-full bg-sunken px-[13px]"
            >
              <DuoIcon name={ask.icon} size={13} className="text-ink" />
              <span className="text-[12.5px] font-medium text-ink">{ask.label}</span>
            </button>
          ))}
        </div>
      )}

      {languageError && (
        <p className="mb-2 px-1 text-xs font-medium text-terracotta-ink">
          ¡Por favor escribe en español! (Please write in Spanish)
        </p>
      )}

      <div className="flex items-end gap-2.5">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          placeholder="Escribí, o hablá…"
          lang="es"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck
          // 24px keeps a perfect pill at one line and stays softly rounded
          // as the box grows, so there's no radius pop mid-transition.
          className={`clay-recessed min-w-0 flex-1 resize-none overflow-hidden rounded-[24px] px-[18px] py-3 text-[15px] leading-6 text-ink outline-none placeholder:text-ink-faint transition-[height,box-shadow] duration-150 ease-out ${
            languageError ? "ring-2 ring-terracotta/50" : "focus:ring-1 focus:ring-green/40"
          }`}
          style={{ height: MIN_INPUT_HEIGHT }}
        />

        {hasText && (
          <button
            onClick={handleSubmit}
            aria-label="Enviar"
            className="clay-green flex h-12 w-12 flex-none items-center justify-center rounded-full"
          >
            <DuoIcon name="flecha" size={20} detail="#F7F3EC" />
          </button>
        )}
      </div>
    </div>
  )
}
