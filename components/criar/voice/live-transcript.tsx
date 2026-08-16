"use client"

// The live transcript. Both sides render as they speak; the parent's turns are
// the emphasised ones, because this view doubles as the "what did I actually
// say" record once the conversation is over.

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowDown } from "lucide-react"
import type { VoiceTurn } from "@/lib/criar/voice/types"

const NEAR_BOTTOM_PX = 48

export function LiveTranscript({ turns, hint }: { turns: VoiceTurn[]; hint?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true)

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

        {turns.map((turn) => (
          <div
            key={turn.id}
            className={turn.speaker === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed transition-opacity ${
                turn.speaker === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground font-medium"
                  : "rounded-bl-md bg-secondary text-secondary-foreground"
              } ${turn.final ? "opacity-100" : "opacity-70"}`}
            >
              {turn.text}
              {!turn.final && <span className="ml-0.5 inline-block animate-pulse">…</span>}
            </div>
          </div>
        ))}
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
