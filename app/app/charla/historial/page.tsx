"use client"

// Every conversation, newest first. Threads older than the resume window still
// live here — they just stop being offered as something to pick up.

import { useEffect, useState } from "react"
import Link from "next/link"
import { DuoIcon, topicIcon } from "@/components/icons"
import { countTurns, deleteConversation, listConversations } from "@/lib/conversations/store"
import { runMigrations } from "@/lib/migrations"
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
    runMigrations()
    load()
    setLoaded(true)
  }, [])

  if (!loaded) return <div className="min-h-dvh bg-background" />

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <div className="mb-6 flex items-center gap-3.5">
        <Link
          href="/app/charla"
          aria-label="Volver a Charlar"
          className="clay-card flex h-9 w-9 items-center justify-center rounded-[13px] text-ink"
        >
          <DuoIcon name="volver" size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-[22px] leading-tight tracking-[-0.015em] text-ink">Tus charlas</h1>
          <p className="text-xs text-ink-soft">Todo lo que hablaste y escribiste</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken-2 text-ink">
            <DuoIcon name="charlar" size={22} />
          </div>
          <p className="max-w-[24ch] text-sm text-balance text-ink-muted">
            Todavía no hay charlas. Después de la primera aparecen acá.
          </p>
          <Link href="/app/charla" className="flex items-center gap-1.5 text-sm font-semibold text-green">
            Empezar una charla
            <DuoIcon name="flecha" size={14} />
          </Link>
        </div>
      ) : (
        <ul className="stagger-children space-y-2">
          {rows.map(({ conversation, turns, voiceTurns }) => (
            <li key={conversation.id} className="flex items-center gap-2">
              <Link
                href={`/app/charla/${conversation.id}`}
                className="press-chip flex min-w-0 flex-1 items-center gap-3 rounded-[18px] bg-sunken px-3.5 py-[13px]"
              >
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
                  <DuoIcon name={topicIcon(conversation.starterId ?? undefined)} size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {conversation.title}
                  </p>
                  <p className="flex items-center gap-1 text-[12.5px] text-ink-soft">
                    <span className="capitalize">{formatDay(conversation.lastTurnAt)}</span>
                    <span>· {turns} turnos</span>
                    {voiceTurns > 0 && (
                      <>
                        <DuoIcon name="micro" size={12} className="text-ink-soft" detail="#8A9188" />
                        {conversation.voiceSeconds > 0 &&
                          `${Math.max(1, Math.round(conversation.voiceSeconds / 60))}′`}
                      </>
                    )}
                  </p>
                </div>
                <DuoIcon name="chevron" size={15} className="flex-none text-ink-soft" />
              </Link>
              <button
                onClick={() => {
                  deleteConversation(conversation.id)
                  load()
                }}
                aria-label={`Borrar la charla ${conversation.title}`}
                className="press-disc flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-terracotta-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 6.6h14M9.4 6.6V4.8a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v1.8M7 6.6l.8 12a1.6 1.6 0 0 0 1.6 1.5h5.2a1.6 1.6 0 0 0 1.6-1.5l.8-12"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
