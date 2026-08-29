"use client"

// One typed turn, Clay + calm. Serif text in a raised cream bubble (Hablaba)
// or a pressed-in green one (you). The English lives as a fold inside the
// bubble behind a tap, split by a hairline — never a second block competing
// with the Spanish. Corrections are the screen's one terracotta moment: the
// mis-said text gets a terracotta underline and a calm "Mejor: …" card sits
// under the bubble. Never red, never an error icon.

import { useState } from "react"
import { DuoIcon } from "@/components/icons"
import type { Message } from "@/lib/types"
import { useStreamedText } from "@/hooks/use-streamed-text"

function stripFullStop(text: string): string {
  return text.trim().replace(/\.$/, "")
}

// The mis-said span gets the terracotta underline; the rest of the sentence
// stays clean. Falls back to underlining everything when the analysis
// returned the whole message as "original".
function underlineSpan(text: string, original: string) {
  const needle = original.trim().replace(/\.$/, "")
  const at = needle ? text.indexOf(needle) : -1
  if (at < 0) {
    return (
      <span className="underline decoration-terracotta decoration-2 underline-offset-[3px]">{text}</span>
    )
  }
  return (
    <>
      {text.slice(0, at)}
      <span className="underline decoration-terracotta decoration-2 underline-offset-[3px]">
        {text.slice(at, at + needle.length)}
      </span>
      {text.slice(at + needle.length)}
    </>
  )
}

interface ChatBubbleProps {
  message: Message
  isPlaying?: boolean
  onPlayRequest?: () => void
  onSavePhrase?: (spanish: string, english: string, source: "correction" | "bot" | "user") => void
}

export function ChatBubble({ message, isPlaying = false, onPlayRequest, onSavePhrase }: ChatBubbleProps) {
  const [showTranslation, setShowTranslation] = useState(false)
  const [saved, setSaved] = useState(false)
  const [botSaved, setBotSaved] = useState(false)
  const isUser = message.type === "user"
  const isBot = message.type === "bot"

  // Smooth typed-out reveal for streaming bot replies.
  const { text: streamedText, caret } = useStreamedText(message.text, isBot && !!message.streaming)

  const correction = message.correction
  const hasImprovement =
    !!correction &&
    correction.original.trim().toLowerCase() !== correction.corrected.trim().toLowerCase()

  const handleSaveCorrection = () => {
    if (!correction) return
    onSavePhrase?.(
      correction.corrected,
      correction.corrected_translation ?? correction.explanation ?? "",
      "correction",
    )
    setSaved(true)
  }

  const handleSaveBot = () => {
    onSavePhrase?.(message.text, message.translation ?? "", "bot")
    setBotSaved(true)
  }

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-[5px]">
        <span className="smallcaps pr-1 text-terracotta">Tú</span>
        <div
          className="max-w-[84%] rounded-[20px] rounded-br-[7px] bg-green px-[15px] py-3.5"
          style={{ boxShadow: "0 3px 0 var(--hb-green-press)" }}
        >
          <p className="font-serif text-lg leading-[1.4] text-cream">
            {hasImprovement ? underlineSpan(message.text, correction.original) : message.text}
          </p>
        </div>

        {correction && (
          <div className="max-w-[84%] rounded-2xl bg-terracotta-tint px-[13px] py-[11px]">
            <div className="flex items-start gap-[9px]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mt-px flex-none" aria-hidden>
                <circle cx="12" cy="12" r="9" fill="#C4633E" />
                <path
                  d="m8.2 12.4 2.6 2.6 5-5.2"
                  stroke="#FFF6F1"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-[13px] font-semibold text-terracotta-ink">
                  {hasImprovement ? "Mejor" : "Así se dice"}: «{stripFullStop(correction.corrected)}».
                </p>
                {correction.explanation && (
                  <p className="text-xs leading-[1.4] text-[#96604A]">{correction.explanation}</p>
                )}
                {onSavePhrase && (
                  <button
                    onClick={handleSaveCorrection}
                    disabled={saved}
                    className="press-chip mt-1 self-start text-[11.5px] font-semibold text-terracotta-ink underline-offset-2 hover:underline disabled:no-underline disabled:opacity-70"
                  >
                    {saved ? "Guardada en Frases" : "Guardar en Frases"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-[5px]">
      <span className="smallcaps pl-1 text-ink-faint">Hablaba</span>
      <div className="clay-static max-w-[88%] rounded-[20px] rounded-bl-[7px] px-[15px] py-3.5">
        <p
          onClick={message.translation ? () => setShowTranslation((s) => !s) : undefined}
          role={message.translation ? "button" : undefined}
          aria-expanded={message.translation ? showTranslation : undefined}
          className={`font-serif text-lg leading-[1.4] text-ink ${message.translation ? "cursor-pointer select-none" : ""}`}
        >
          {streamedText}
          {caret && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[0.12em] rounded-[1px] bg-current animate-pulse"
            />
          )}
        </p>

        {showTranslation && message.translation && (
          <p className="anim-settle mt-2.5 border-t border-rule-soft pt-2.5 text-[12.5px] leading-[1.45] text-ink-soft">
            {message.translation}
          </p>
        )}

        {!message.streaming && (onPlayRequest || onSavePhrase) && (
          <div className="mt-2.5 flex gap-2 border-t border-rule-soft pt-2.5">
            {onPlayRequest && (
              <button
                onClick={onPlayRequest}
                className="press-chip flex h-[30px] items-center gap-1.5 rounded-full bg-sunken px-[11px]"
                aria-label="Escuchar este mensaje"
              >
                <DuoIcon name="escuchar" size={12} className={`text-ink ${isPlaying ? "animate-pulse" : ""}`} />
                <span className="text-[11.5px] font-semibold text-ink">Escuchar</span>
              </button>
            )}
            {onSavePhrase && (
              <button
                onClick={handleSaveBot}
                disabled={botSaved}
                className="press-chip flex h-[30px] items-center gap-1.5 rounded-full bg-sunken px-[11px] disabled:opacity-70"
                aria-label={botSaved ? "Guardada en Frases" : "Guardar en Frases"}
              >
                <DuoIcon name="guardada" size={12} className="text-terracotta" />
                <span className="text-[11.5px] font-semibold text-ink">{botSaved ? "Guardada" : "Guardar"}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
