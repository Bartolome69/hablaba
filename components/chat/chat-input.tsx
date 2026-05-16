"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

interface ChatInputProps {
  onSend: (message: string) => void
  onFocus?: () => void
  suggestions?: string[]
}

export function ChatInput({ onSend, onFocus, suggestions = [] }: ChatInputProps) {
  const [value, setValue] = useState("")
  const [languageError, setLanguageError] = useState(false)

  const handleTranscript = useCallback((text: string) => {
    setValue((current) => (current ? `${current} ${text}` : text))
    setLanguageError(false)
  }, [])

  const { state: recState, error: recError, start, stop, getLevels } = useRecorder(handleTranscript)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (languageError) setLanguageError(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
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
        <div className="flex items-center gap-2">
          {isRecording ? (
            <div className="flex-1 flex items-center gap-3 bg-secondary rounded-full px-4 py-2.5">
              <VoiceLevelBars getLevels={getLevels} />
              <span className="text-sm text-muted-foreground">Escuchando…</span>
            </div>
          ) : (
            <input
              type="text"
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
              className={`flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 transition-shadow disabled:opacity-60 ${
                languageError
                  ? "ring-2 ring-destructive/50 focus:ring-destructive/50"
                  : "focus:ring-primary/20"
              }`}
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
