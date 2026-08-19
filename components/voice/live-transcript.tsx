"use client"

// The live transcript. Both sides render as they speak; the parent's turns are
// the emphasised ones, because this view doubles as the "what did I actually
// say" record once the conversation is over.
//
// Tapping a finished partner turn reveals its English underneath (fetched once,
// cached) — the mic stays live, so checking a sentence doesn't mean pausing
// the conversation.

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowDown, Loader2 } from "lucide-react"
import { useTurnTranslations } from "@/hooks/use-turn-translations"
import type { VoiceTurn } from "@/lib/voice/types"

const NEAR_BOTTOM_PX = 48

export function LiveTranscript({ turns, hint }: { turns: VoiceTurn[]; hint?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)
  const { translations, openIds, pendingId, toggle } = useTurnTranslations()

  const scrollToLatest = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    setPinned(true)
  }, [])

  // Follow the conversation only while the parent hasn't scrolled up to reread
  // something — yanking them back down mid-read is the classic chat-UI sin.
  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setPinned(distance < NEAR_BOTTOM_PX)
  }, [])

  useEffect(() => {
    if (pinned) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [turns, pinned])

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto px-4 py-4 space-y-3"
      >
        {turns.length === 0 && hint && (
          <p className="pt-8 text-center text-sm text-muted-foreground text-balance">{hint}</p>
        )}

        {turns.map((turn) => {
          const translatable = turn.speaker === "assistant" && turn.final
          const open = openIds.has(turn.id)
          return (
            <div
              key={turn.id}
              className={turn.speaker === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div
                onClick={translatable ? () => toggle(turn.id, turn.text) : undefined}
                role={translatable ? "button" : undefined}
                aria-expanded={translatable ? open : undefined}
                aria-label={translatable ? "Ver traducción" : undefined}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed transition-opacity ${
                  turn.speaker === "user"
                    ? "rounded-br-md bg-primary text-primary-foreground font-medium"
                    : "rounded-bl-md bg-secondary text-secondary-foreground cursor-pointer select-none"
                } ${turn.final ? "opacity-100" : "opacity-70"}`}
              >
                {turn.text}
                {!turn.final && <span className="ml-0.5 inline-block animate-pulse">…</span>}
                {translatable && open && (
                  <p className="mt-1.5 border-t border-foreground/10 pt-1.5 text-[13px] leading-snug text-muted-foreground">
                    {pendingId === turn.id && !translations[turn.id] ? (
                      <Loader2 className="inline h-3 w-3 animate-spin" />
                    ) : (
                      translations[turn.id]
                    )}
                  </p>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {!pinned && (
        <button
          onClick={scrollToLatest}
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-foreground/90 px-3.5 py-2 text-xs font-medium text-background shadow-lg backdrop-blur active:scale-[0.97] transition-transform"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Lo último
        </button>
      )}
    </div>
  )
}
