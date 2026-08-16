"use client"

// Session history — the "reflect" half of the prep-and-reflect loop. Each row
// links into the full transcript (and, from Phase 4, its review).

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Mic } from "lucide-react"
import { CriarHeader } from "@/components/criar/criar-header"
import { ensureSeeded } from "@/lib/criar/seed"
import type { CriarChild } from "@/lib/criar/types"
import type { CriarVoiceSession } from "@/lib/criar/voice/types"
import { listVoiceSessions, listVoiceTurns } from "@/lib/criar/store"

interface HistoryRow {
  session: CriarVoiceSession
  userTurns: number
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatDuration(session: CriarVoiceSession): string {
  if (session.durationSeconds == null) return "—"
  const mins = Math.round(session.durationSeconds / 60)
  return mins < 1 ? "menos de un minuto" : `${mins} min`
}

export default function VoiceHistoryPage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const [rows, setRows] = useState<HistoryRow[]>([])

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    const seeded = ensureSeeded()
    setChild(seeded)
    setRows(
      listVoiceSessions(seeded.id).map((session) => ({
        session,
        userTurns: listVoiceTurns(session.id).filter((t) => t.speaker === "user").length,
      })),
    )
  }, [])

  if (!child) return <div className="min-h-dvh bg-background" />

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <CriarHeader
        child={child}
        onChildUpdate={setChild}
        title="Charlas"
        subtitle="Tus conversaciones guardadas"
      />

      {rows.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="max-w-[24ch] text-sm text-muted-foreground text-balance">
            Todavía no hay charlas guardadas. Después de tu primera conversación aparece acá.
          </p>
          <Link href="/grow/voice" className="text-sm font-medium text-primary">
            Empezar una charla →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ session, userTurns }) => (
            <li key={session.id}>
              <Link
                href={`/grow/voice/${session.id}`}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize text-foreground">
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
