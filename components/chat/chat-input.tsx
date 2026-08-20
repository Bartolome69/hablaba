"use client"

// The text composer. Deliberately has NO dictation mic: the only microphone
// near this box is the live-conversation button beside it, so a mic can only
// ever mean one thing. In-app speech-to-text was removed (Aug 2026) — two
// identical mic icons with different meanings sat side by side, and keyboard
// dictation (e.g. Wispr Flow) covers typing by voice better anyway.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

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

// The composer is one `leading-6` line plus `py-2.5`, so a single line is 44px
// — the same height as the send button next to it. Cap growth at five lines
// and let the textarea scroll internally beyond that.
const LINE_HEIGHT = 24
const VERTICAL_PADDING = 20
const MIN_INPUT_HEIGHT = LINE_HEIGHT + VERTICAL_PADDING
const MAX_INPUT_HEIGHT = LINE_HEIGHT * 5 + VERTICAL_PADDING

interface ChatInputProps {
  onSend: (message: string) => void
  onFocus?: () => void
  onHeightChange?: () => void
  suggestions?: string[]
}

export function ChatInput({ onSend, onFocus, onHeightChange, suggestions = [] }: ChatInputProps) {
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

  // Layout effect so the height is right before paint — typing, suggestions
  // and the reset after send all flow through `value`.
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
    <div className="bg-background border-t border-border">
      {suggestions.length > 0 && (
        <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary/80 active:bg-secondary/70 transition-colors"
                onClick={() => setValue(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        {languageError && (
          <p className="text-xs text-destructive mb-2 px-1">
            ¡Por favor escribe en español! (Please write in Spanish)
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            placeholder="Escribe en español..."
            lang="es"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck
            // 22px keeps a perfect pill at one line and stays softly rounded
            // as the box grows, so there's no radius pop mid-transition.
            className={`flex-1 min-w-0 resize-none overflow-hidden bg-secondary rounded-[22px] px-4 py-2.5 text-sm leading-6 outline-none focus:ring-2 transition-[height,box-shadow] duration-150 ease-out ${
              languageError
                ? "ring-2 ring-destructive/50 focus:ring-destructive/50"
                : "focus:ring-primary/20"
            }`}
            style={{ height: MIN_INPUT_HEIGHT }}
          />

          {hasText && (
            <Button
              size="icon"
              className="rounded-full flex-shrink-0 h-11 w-11"
              onClick={handleSubmit}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
