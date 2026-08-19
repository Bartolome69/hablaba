"use client"

// One conversation, in full — readable, with the parent's own turns emphasised,
// because rereading what YOU managed to say is the point of keeping it. The
// session review (3–5 observations from the analysis) renders above the
// transcript; SessionReview lazily runs the analysis if it hasn't happened.

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { SessionReview } from "@/components/criar/voice/session-review"
import { useTurnTranslations } from "@/hooks/use-turn-translations"
import type { CriarVoiceSession, CriarVoiceTurn } from "@/lib/criar/voice/types"
import { getVoiceSession, listVoiceTurns } from "@/lib/criar/store"
import { voiceTopics } from "@/lib/voice-topics"

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatMeta(session: CriarVoiceSession): string {
  const parts: string[] = []
  const topic = voiceTopics.find((t) => t.id === session.seedContext?.topicId)
  if (topic) parts.push(`${topic.emoji} ${topic.label}`)
  if (session.durationSeconds != null) {
    const mins = Math.round(session.durationSeconds / 60)
    parts.push(mins < 1 ? "menos de un minuto" : `${mins} min`)
  }
  parts.push(
    new Date(session.startedAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  )
  return parts.join(" · ")
}

export default function VoiceSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [session, setSession] = useState<CriarVoiceSession | null>(null)
  const [turns, setTurns] = useState<CriarVoiceTurn[]>([])
  const [loaded, setLoaded] = useState(false)
  const { translations, openIds, pendingId, toggle } = useTurnTranslations()

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    setSession(getVoiceSession(id))
    setTurns(listVoiceTurns(id))
    setLoaded(true)
  }, [id])

  if (!loaded) return <div className="min-h-dvh bg-background" />

  if (!session) {
    return (
      <div className="min-h-dvh bg-background px-4 py-6">
        <p className="text-sm text-muted-foreground">No encontramos esa charla.</p>
        <Link href="/grow/voice/historial" className="mt-2 inline-block text-sm font-medium text-primary">
          ← Volver a tus charlas
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/grow/voice/historial"
          aria-label="Volver a tus charlas"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-lg font-semibold capitalize text-foreground">
            {formatDay(session.startedAt)}
          </h1>
          <p className="text-xs text-muted-foreground">{formatMeta(session)}</p>
        </div>
      </div>

      {turns.some((t) => t.speaker === "user") && <SessionReview sessionId={session.id} />}

      {turns.length === 0 ? (
        <p className="text-sm text-muted-foreground text-pretty">
          Esta charla quedó vacía — probablemente se cortó antes de que nadie hablara.
        </p>
      ) : (
        <div className="space-y-3">
          {turns.map((turn) => {
            const translatable = turn.speaker === "assistant"
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
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
                    turn.speaker === "user"
                      ? "rounded-br-md bg-primary text-primary-foreground font-medium"
                      : "rounded-bl-md bg-secondary text-secondary-foreground cursor-pointer select-none"
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
            )
          })}
        </div>
      )}
    </div>
  )
}
