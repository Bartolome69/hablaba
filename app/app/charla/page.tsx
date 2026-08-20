"use client"

// The conversations hub: pick up a thread, or start a new one.
//
// Starters are the old Practice topic cards plus the voice topics, now one list
// — since a conversation isn't a text thing or a voice thing any more, the
// choice of what to talk about is separate from how you'll say it.

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, History, Mic, Shuffle } from "lucide-react"
import { AppHeader } from "@/components/home/app-header"
import { createConversation, countTurns, listResumable } from "@/lib/conversations/store"
import { runMigrations } from "@/lib/migrations"
import { getProfile } from "@/lib/profile/store"
import type { Conversation } from "@/lib/conversations/types"
import { voiceTopics } from "@/lib/voice-topics"
import { conversationTopics, dailyTopics, PARENT_CHILD_TOPIC_ID } from "@/lib/data"

// Two families of starter, deliberately kept distinct. The spoken topics carry
// a grammar intent (Recuerdos pulls past tenses out of you, Opiniones the
// subjunctive) and read as invitations; the migrated Practice cards are plain
// subjects. Both make a conversation — the modality is chosen later, in the
// thread itself.
// Child-scoped topics ("Mi día") join the list when the profile has a child.
const baseStarters = voiceTopics.filter((t) => !t.requiresChild)

const subjectCards = [
  { heading: "Intereses", topics: conversationTopics },
  { heading: "Vida diaria", topics: dailyTopics },
]

function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000)
  if (days <= 0) return "hoy"
  if (days === 1) return "ayer"
  return `hace ${days} días`
}

export default function CharlaHubPage() {
  const router = useRouter()
  const [resumable, setResumable] = useState<Conversation[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [starters, setStarters] = useState(baseStarters)

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    runMigrations()
    const rows = listResumable()
    setResumable(rows.slice(0, 3))
    setCounts(Object.fromEntries(rows.map((c) => [c.id, countTurns(c.id)])))
    if (getProfile().child) setStarters(voiceTopics)
  }, [])

  const startConversation = useCallback(
    (starterId: string, title: string, emoji: string) => {
      const conversation = createConversation({ starterId, title, emoji })
      router.push(`/app/charla/${conversation.id}`)
    },
    [router],
  )

  const surprise = useCallback(() => {
    const topic = starters[Math.floor(Math.random() * starters.length)]
    startConversation(topic.id, topic.label, topic.emoji)
  }, [startConversation])

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Charlar" subtitle="Conversá en español — escribiendo o en voz alta" />

      {resumable.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-serif text-base text-foreground">Seguir donde quedaste</h2>
          <div className="space-y-2">
            {resumable.map((c) => (
              <Link
                key={c.id}
                href={`/app/charla/${c.id}`}
                className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <span className="text-xl" aria-hidden>
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {counts[c.id] ?? 0} turnos · {relativeDay(c.lastTurnAt)}
                    {c.voiceSeconds > 0 && " · con voz"}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-1 font-serif text-base text-foreground">Empezar una charla</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Elegí un tema. Podés escribir, o tocar el micrófono cuando quieras y seguir hablando.
        </p>

        <button
          onClick={surprise}
          className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
            <Shuffle className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Sorprendeme</p>
            <p className="text-xs opacity-75">Que elija ella el tema</p>
          </div>
        </button>

        <button
          onClick={() =>
            startConversation(PARENT_CHILD_TOPIC_ID, "Con tu peque", "🧸")
          }
          className="mb-6 flex w-full items-center gap-3 rounded-2xl bg-secondary p-4 text-secondary-foreground transition-all hover:bg-secondary/80 active:scale-[0.98]"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/25">
            <span className="text-lg" aria-hidden>
              🧸
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Con tu peque</p>
            <p className="text-xs text-muted-foreground">
              Ella hace de tu hijo, para ensayar los momentos del día
            </p>
          </div>
        </button>

        <div className="mb-6 grid grid-cols-2 gap-3">
          {starters.map((topic) => (
            <button
              key={topic.id}
              onClick={() => startConversation(topic.id, topic.label, topic.emoji)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-secondary/50 active:scale-[0.98]"
            >
              <span className="text-2xl" aria-hidden>
                {topic.emoji}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{topic.label}</p>
                <p className="text-xs text-muted-foreground">{topic.blurb}</p>
              </div>
            </button>
          ))}
        </div>

        {subjectCards.map(({ heading, topics }) => (
          <div key={heading} className="mb-6">
            <h3 className="mb-3 font-serif text-base text-foreground">{heading}</h3>
            <div className="grid grid-cols-2 gap-3">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startConversation(topic.id, topic.title, topic.emoji)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-secondary/50 active:scale-[0.98]"
                >
                  <span className="text-2xl" aria-hidden>
                    {topic.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{topic.title}</p>
                    <p className="font-serif text-xs italic text-muted-foreground">
                      {topic.spanish}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <Link
        href="/app/charla/historial"
        className="mt-6 flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
      >
        <History className="h-4 w-4" />
        <span className="flex-1 text-sm font-medium">Todas tus charlas</span>
        <ChevronRight className="h-4 w-4" />
      </Link>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Mic className="h-3 w-3" />
        Las charlas habladas se revisan al terminar
      </p>
    </div>
  )
}
