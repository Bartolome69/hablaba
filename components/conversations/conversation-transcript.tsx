"use client"

// One thread, both modalities, in spoken/typed order.
//
// Typed turns reuse ChatBubble so they keep their inline corrections and
// tap-to-translate. Spoken turns render the same anatomy with a "TÚ · VOZ"
// label — the label carries the modality, no divider needed — and no
// correction UI, because voice defers all of that to the post-session review.

import { Fragment, useEffect, useState } from "react"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { LookupText, WORD_HINT_KEY } from "@/components/conversations/lookup-text"
import { DuoIcon } from "@/components/icons"
import { PARTNER_NAME } from "@/lib/voices"
import { useTurnTranslations } from "@/hooks/use-turn-translations"
import type { ConversationTurn } from "@/lib/conversations/types"
import type { Message } from "@/lib/types"

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
  usedNotes,
}: {
  turns: ConversationTurn[]
  /**
   * turnId → what the parent said, for turns where analysis found a saved
   * phrase used naturally. The caller passes nothing while voice is live, so
   * the note never interrupts a spoken session.
   */
  usedNotes?: Record<string, string>
  streamingTurnId?: string | null
  playingId?: string | null
  onPlayRequest?: (id: string, text: string) => void
  onSavePhrase?: (spanish: string, english: string, source: "correction" | "bot" | "user") => void
}) {
  const { translations, openIds, pendingId, toggle } = useTurnTranslations()
  // One quiet hint, under Elena's latest message, until the first word lookup.
  const [hintUsed, setHintUsed] = useState(true)
  useEffect(() => {
    try {
      setHintUsed(localStorage.getItem(WORD_HINT_KEY) === "1")
    } catch {}
    // The first lookup hides it straight away, not on the next visit.
    const used = () => setHintUsed(true)
    window.addEventListener(WORD_HINT_KEY, used)
    return () => window.removeEventListener(WORD_HINT_KEY, used)
  }, [])
  const hintTurnId = hintUsed
    ? null
    : ([...turns].reverse().find((t) => t.speaker === "assistant" && t.id !== streamingTurnId)?.id ?? null)

  return (
    <div className="space-y-4">
      {turns.map((turn) => (
        <Fragment key={turn.id}>
          {renderTurn(turn)}
          {usedNotes?.[turn.id] && (
            <p className="anim-settle mt-1.5 flex items-start justify-end gap-1.5 px-1 text-[12.5px] leading-snug text-green" role="status">
              <DuoIcon name="check" size={13} className="mt-[2px] flex-none" />
              <span>
                Te salió natural una frase guardada: <span className="font-serif text-[14px]">“{usedNotes[turn.id]}”</span>
              </span>
            </p>
          )}
          {turn.id === hintTurnId && (
            <p className="mt-1.5 px-1 text-[12.5px] text-ink-muted">Mantén pulsada una palabra para buscarla y guardarla.</p>
          )}
        </Fragment>
      ))}
    </div>
  )

  function renderTurn(turn: ConversationTurn) {
        if (turn.modality === "text") {
          return (
            <ChatBubble
              key={turn.id}
              message={toMessage(turn, streamingTurnId === turn.id)}
              isPlaying={playingId === turn.id}
              onPlayRequest={onPlayRequest ? () => onPlayRequest(turn.id, turn.text) : undefined}
              onSavePhrase={onSavePhrase}
            />
          )
        }

        const isUser = turn.speaker === "user"
        const translatable = !isUser
        const open = openIds.has(turn.id)
        const translation = translations[turn.id]

        if (isUser) {
          return (
            <div key={turn.id} className="flex flex-col items-end gap-[5px]">
              <span className="smallcaps pr-1 text-terracotta-ink">Tú · voz</span>
              <div
                className="max-w-[84%] rounded-[20px] rounded-br-[7px] bg-green px-[15px] py-3.5"
                style={{ boxShadow: "0 3px 0 var(--hb-green-press)" }}
              >
                <p className="font-serif text-lg leading-[1.4] text-cream">{turn.text}</p>
              </div>
            </div>
          )
        }

        return (
          <div key={turn.id} className="flex flex-col items-start gap-[5px]">
            <span className="smallcaps pl-1 text-ink-muted">{PARTNER_NAME}</span>
            <div className="clay-static max-w-[88%] rounded-[20px] rounded-bl-[7px] px-[15px] py-3.5">
              {/* Tap translates; holding a word looks it up (Phase 4). */}
              <LookupText
                text={turn.text}
                onTap={translatable ? () => toggle(turn.id, turn.text) : undefined}
                className="cursor-pointer font-serif text-lg leading-[1.4] text-ink"
              />

              {open && (
                <p className="anim-settle mt-2.5 border-t border-rule-soft pt-2.5 text-[12.5px] leading-[1.45] text-ink-muted">
                  {pendingId === turn.id && !translation ? (
                    <span className="inline-flex items-end gap-[3px]" aria-label="Traduciendo…">
                      <span className="anim-bar h-2.5 w-[3px] rounded-[2px] bg-green opacity-45" />
                      <span className="anim-bar h-2.5 w-[3px] rounded-[2px] bg-green opacity-70 [animation-delay:140ms]" />
                      <span className="anim-bar h-2.5 w-[3px] rounded-[2px] bg-terracotta [animation-delay:280ms]" />
                    </span>
                  ) : (
                    translation
                  )}
                </p>
              )}

              {(onPlayRequest || onSavePhrase) && (
                <div className="mt-2.5 flex gap-2 border-t border-rule-soft pt-2.5">
                  {onSavePhrase && (
                    <SaveChip onSave={() => onSavePhrase(turn.text, translation ?? "", "bot")} />
                  )}
                  {onPlayRequest && (
                    <button
                      onClick={() => onPlayRequest(turn.id, turn.text)}
                      className="press-chip flex h-[30px] items-center gap-1.5 rounded-full bg-sunken px-[11px]"
                      aria-label="Repetir este mensaje"
                    >
                      <DuoIcon
                        name="repasar"
                        size={12}
                        className={`text-ink ${playingId === turn.id ? "animate-pulse" : ""}`}
                      />
                      <span className="text-[12px] font-semibold text-ink">Repetir</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )
  }
}

function SaveChip({ onSave }: { onSave: () => void }) {
  const [saved, setSaved] = useState(false)
  return (
    <button
      onClick={() => {
        if (saved) return
        onSave()
        setSaved(true)
      }}
      disabled={saved}
      className="press-chip flex h-[30px] items-center gap-1.5 rounded-full bg-sunken px-[11px] disabled:opacity-70"
      aria-label={saved ? "Guardada en Frases" : "Guardar en Frases"}
    >
      <DuoIcon name="guardada" size={12} className="text-terracotta" />
      <span className="text-[12px] font-semibold text-ink">{saved ? "Guardada" : "Guardar"}</span>
    </button>
  )
}
