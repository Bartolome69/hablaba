"use client"

// One thread, both modalities, in spoken/typed order.
//
// Typed turns reuse ChatBubble so they keep their inline corrections, saved
// phrases and tap-to-translate. Spoken turns render leaner — no correction UI,
// because voice defers all of that to the post-session review — with a small
// marker so you can see at a glance which stretch of a thread you talked
// through rather than typed.

import { Mic } from "lucide-react"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { useTurnTranslations } from "@/hooks/use-turn-translations"
import type { ConversationTurn } from "@/lib/conversations/types"
import type { Message } from "@/lib/types"
import { Loader2 } from "lucide-react"

function toMessage(turn: ConversationTurn, streaming = false): Message {
  return {
    id: turn.id,
    type: turn.speaker === "user" ? "user" : "bot",
    text: turn.text,
    timestamp: new Date(turn.createdAt),
    correction: turn.correction,
    translation: turn.translation,
    streaming,
  }
}

export function ConversationTranscript({
  turns,
  streamingTurnId,
  playingId,
  onPlayRequest,
  onSavePhrase,
}: {
  turns: ConversationTurn[]
  streamingTurnId?: string | null
  playingId?: string | null
  onPlayRequest?: (id: string, text: string) => void
  onSavePhrase?: (spanish: string, english: string, source: "correction" | "bot" | "user") => void
}) {
  const { translations, openIds, pendingId, toggle } = useTurnTranslations()

  return (
    <div className="space-y-4">
      {turns.map((turn, i) => {
        if (turn.modality === "text") {
          return (
            <ChatBubble
              key={turn.id}
              message={toMessage(turn, streamingTurnId === turn.id)}
              isPlaying={playingId === turn.id}
              onPlayRequest={() => onPlayRequest?.(turn.id, turn.text)}
              onSavePhrase={onSavePhrase}
            />
          )
        }

        // First spoken turn of a stretch gets the marker, so a long thread
        // reads as "we typed, then we talked" rather than an unexplained
        // change of bubble style.
        const startsVoiceStretch = i === 0 || turns[i - 1]?.modality !== "voice"
        const translatable = turn.speaker === "assistant"
        const open = openIds.has(turn.id)

        return (
          <div key={turn.id}>
            {startsVoiceStretch && (
              <div className="mb-3 flex items-center gap-2">
                <span className="h-px flex-1 bg-border" />
                <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <Mic className="h-3 w-3" />
                  En voz alta
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
            <div className={turn.speaker === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                onClick={translatable ? () => toggle(turn.id, turn.text) : undefined}
                role={translatable ? "button" : undefined}
                aria-expanded={translatable ? open : undefined}
                aria-label={translatable ? "Ver traducción" : undefined}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                  turn.speaker === "user"
                    ? "rounded-br-md bg-primary font-medium text-primary-foreground"
                    : "cursor-pointer select-none rounded-bl-md bg-secondary text-secondary-foreground"
                }`}
              >
                {turn.text}
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
          </div>
        )
      })}
    </div>
  )
}
