"use client"

// Main-app voice session history — the Speak-side sibling of
// /grow/voice/historial, reading the voice_* tables.

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Mic } from "lucide-react"
import type { VoiceSessionRecord } from "@/lib/voice/types"
import { listVoiceSessions, listVoiceTurns } from "@/lib/voice/store"
import { voiceTopics } from "@/lib/voice-topics"

interface HistoryRow {
  session: VoiceSessionRecord
  userTurns: number
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function topicEmoji(session: VoiceSessionRecord): string {
  const topic = voiceTopics.find((t) => t.id === session.seedContext?.topicId)
  return topic ? `${topic.emoji} ` : ""
}

function formatDuration(session: VoiceSessionRecord): string {
  if (session.durationSeconds == null) return "—"
  const mins = Math.round(session.durationSeconds / 60)
  return mins < 1 ? "menos de un minuto" : `${mins} min`
}

export default function CharlaHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [loaded, setLoaded] = useState(false)

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    setRows(
      listVoiceSessions().map((session) => ({
        session,
        userTurns: listVoiceTurns(session.id).filter((t) => t.speaker === "user").length,
      })),
    )
    setLoaded(true)
  }, [])

  if (!loaded) return <div className="min-h-dvh bg-background" />

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/app/charla"
          aria-label="Volver a Charlar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-lg font-semibold text-foreground">Charlas</h1>
          <p className="text-xs text-muted-foreground">Tus conversaciones guardadas</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="max-w-[24ch] text-sm text-muted-foreground text-balance">
            Todavía no hay charlas guardadas. Después de tu primera conversación aparece acá.
          </p>
          <Link href="/app/charla" className="text-sm font-medium text-primary">
            Empezar una charla →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ session, userTurns }) => (
            <li key={session.id}>
              <Link
                href={`/app/charla/${session.id}`}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-foreground">
                    {topicEmoji(session)}
                    {formatDay(session.startedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(session)} ·{" "}
                    {userTurns === 1 ? "hablaste 1 vez" : `hablaste ${userTurns} veces`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
