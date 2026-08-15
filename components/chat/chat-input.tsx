"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Send, Square } from "lucide-react"
import { useRecorder } from "@/hooks/use-recorder"

const BAR_COUNT = 4

function VoiceLevelBars({ getLevels }: { getLevels: (n: number) => number[] }) {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([])
  const smoothedRef = useRef<number[]>(new Array(BAR_COUNT).fill(0))

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const levels = getLevels(BAR_COUNT)
      const smoothed = smoothedRef.current
      for (let i = 0; i < BAR_COUNT; i++) {
        // Quick attack, slow decay so the bars feel alive but don't twitch
        const target = levels[i] ?? 0
        smoothed[i] = target > smoothed[i] ? target : smoothed[i] * 0.8 + target * 0.2
        const el = barsRef.current[i]
        if (el) {
          const scale = 0.25 + Math.min(1, smoothed[i] * 1.8) * 0.75
          el.style.transform = `scaleY(${scale})`
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [getLevels])

  return (
    <div className="flex items-center gap-[3px] h-3">
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span
          key={i}
          ref={(el) => { barsRef.current[i] = el }}
          className="block w-[3px] h-3 rounded-full bg-destructive origin-center"
          style={{ transform: "scaleY(0.25)" }}
        />
      ))}
    </div>
  )
}

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

  const handleTranscript = useCallback((text: string) => {
    setValue((current) => (current ? `${current} ${text}` : text))
    setLanguageError(false)
  }, [])

  const { state: recState, error: recError, start, stop, getLevels } = useRecorder(handleTranscript)

  // Layout effect so the height is right before paint — typing, suggestions,
  // dictated transcripts and the reset after send all flow through `value`.
  // `recState` is in here too: recording swaps the textarea out for the level
  // meter, so the remounted textarea has to be re-measured against its content.
  useLayoutEffect(() => {
    resize()
  }, [value, recState, resize])

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
  const isRecording = recState === "recording"
  const isTranscribing = recState === "transcribing"

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
        {recError && (
          <p className="text-xs text-destructive mb-2 px-1">{recError}</p>
        )}
        <div className="flex items-end gap-2">
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 bg-secondary rounded-full px-4 py-2.5 min-h-11">
              <VoiceLevelBars getLevels={getLevels} />
              <span className="text-sm text-muted-foreground">Escuchando…</span>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={onFocus}
              placeholder={isTranscribing ? "Transcribiendo…" : "Escribe en español..."}
              disabled={isTranscribing}
              lang="es"
              autoCorrect="on"
              autoCapitalize="sentences"
              spellCheck
              // 22px keeps a perfect pill at one line and stays softly rounded
              // as the box grows, so there's no radius pop mid-transition.
              className={`flex-1 min-w-0 resize-none overflow-hidden bg-secondary rounded-[22px] px-4 py-2.5 text-sm leading-6 outline-none focus:ring-2 transition-[height,box-shadow] duration-150 ease-out disabled:opacity-60 ${
                languageError
                  ? "ring-2 ring-destructive/50 focus:ring-destructive/50"
                  : "focus:ring-primary/20"
              }`}
              style={{ height: MIN_INPUT_HEIGHT }}
            />
          )}

          {hasText && !isRecording ? (
            <Button
              size="icon"
              className="rounded-full flex-shrink-0 h-11 w-11"
              onClick={handleSubmit}
              disabled={isTranscribing}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "default"}
              className="rounded-full flex-shrink-0 h-11 w-11"
              onClick={isRecording ? stop : start}
              disabled={isTranscribing}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
