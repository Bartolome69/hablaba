"use client"

// Every conversation, newest first. Threads older than the resume window still
// live here — they just stop being offered as something to pick up.

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ChevronRight, Mic, MessageSquare, Trash2 } from "lucide-react"
import {
  countTurns,
  deleteConversation,
  listConversations,
  migrateLegacyConversations,
} from "@/lib/conversations/store"
import type { Conversation } from "@/lib/conversations/types"

interface Row {
  conversation: Conversation
  turns: number
  voiceTurns: number
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export default function ConversationHistoryPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = () => {
    setRows(
      listConversations().map((conversation) => ({
        conversation,
        turns: countTurns(conversation.id),
        voiceTurns: countTurns(conversation.id, "voice"),
      })),
    )
  }

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    migrateLegacyConversations()
    load()
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
          <h1 className="font-serif text-lg font-semibold text-foreground">Tus charlas</h1>
          <p className="text-xs text-muted-foreground">Todo lo que hablaste y escribiste</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="max-w-[24ch] text-sm text-balance text-muted-foreground">
            Todavía no hay charlas. Después de la primera aparecen acá.
          </p>
          <Link href="/app/charla" className="text-sm font-medium text-primary">
            Empezar una charla →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ conversation, turns, voiceTurns }) => (
            <li key={conversation.id} className="flex items-center gap-2">
              <Link
                href={`/app/charla/${conversation.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <span className="text-xl" aria-hidden>
                  {conversation.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {conversation.title}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="capitalize">{formatDay(conversation.lastTurnAt)}</span>
                    <span>· {turns} turnos</span>
                    {voiceTurns > 0 && (
                      <>
                        <Mic className="h-3 w-3" aria-label="con voz" />
                        {conversation.voiceSeconds > 0 &&
                          `${Math.max(1, Math.round(conversation.voiceSeconds / 60))}′`}
                      </>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
              <button
                onClick={() => {
                  deleteConversation(conversation.id)
                  load()
                }}
                aria-label={`Borrar la charla ${conversation.title}`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
