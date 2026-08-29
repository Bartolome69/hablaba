"use client"

// The conversations hub: pick up a thread, or start a new one.
//
// Starters are the old Practice topic cards plus the voice topics, now one list
// — since a conversation isn't a text thing or a voice thing any more, the
// choice of what to talk about is separate from how you'll say it.

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, topicIcon } from "@/components/icons"
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

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Charlar" subtitle="Conversá en español, escribiendo o en voz alta" />

      {resumable.length > 0 && (
        <section className="mb-[26px]">
          <h2 className="px-1 font-serif text-[19px] text-ink">Seguir donde quedaste</h2>
          <div className="stagger-children mt-2.5 space-y-2">
            {resumable.map((c) => (
              <Link
                key={c.id}
                href={`/app/charla/${c.id}`}
                className="press-chip flex items-center gap-3 rounded-[18px] bg-sunken px-3.5 py-[13px]"
              >
                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
                  <DuoIcon name={topicIcon(c.starterId ?? undefined)} size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{c.title}</p>
                  <p className="text-[12.5px] text-ink-soft">
                    {counts[c.id] ?? 0} turnos · {relativeDay(c.lastTurnAt)}
                    {c.voiceSeconds > 0 && " · con voz"}
                  </p>
                </div>
                <DuoIcon name="chevron" size={15} className="flex-none text-ink-soft" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="px-1 font-serif text-[19px] text-ink">Empezar una charla</h2>
        <p className="mt-1.5 px-1 text-[13px] leading-normal text-ink-soft">
          Elegí un tema. Podés escribir, o tocar el micrófono cuando quieras.
        </p>

        <button
          onClick={() => startConversation(PARENT_CHILD_TOPIC_ID, "Con tu peque", "🧸")}
          className="clay-green mt-3.5 flex w-full items-center gap-[13px] rounded-[22px] p-4 text-left"
        >
          <div className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-green-well">
            <DuoIcon name="familia" size={24} className="text-[#EAF3EB]" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[15.5px] font-semibold text-cream">Con tu peque</p>
            <p className="text-[12.5px] leading-snug text-green-on-dark">
              Ella hace de tu hijo, para ensayar el día
            </p>
          </div>
        </button>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {starters.map((topic) => (
            <button
              key={topic.id}
              onClick={() => startConversation(topic.id, topic.label, topic.emoji)}
              className="clay-card flex min-h-[104px] flex-col items-start gap-2.5 rounded-[20px] p-3.5 text-left"
            >
              <DuoIcon name={topicIcon(topic.id)} size={26} className="text-ink" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[14.5px] font-semibold text-ink">{topic.label}</p>
                <p className="text-xs leading-[1.35] text-ink-soft">{topic.blurb}</p>
              </div>
            </button>
          ))}
        </div>

        {subjectCards.map(({ heading, topics }) => (
          <div key={heading} className="mt-[26px]">
            <h3 className="px-1 font-serif text-[19px] text-ink">{heading}</h3>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => startConversation(topic.id, topic.title, topic.emoji)}
                  className="clay-card flex min-h-[104px] flex-col items-start gap-2.5 rounded-[20px] p-3.5 text-left"
                >
                  <DuoIcon name={topicIcon(topic.id)} size={26} className="text-ink" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[14.5px] font-semibold text-ink">{topic.title}</p>
                    <p className="font-serif text-[12.5px] italic leading-[1.35] text-ink-soft">
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
        className="mt-6 flex items-center gap-2.5 border-t border-rule px-1 pt-4 text-ink transition-colors"
      >
        <DuoIcon name="tiempo" size={18} />
        <span className="flex-1 text-sm font-medium">Todas tus charlas</span>
        <DuoIcon name="chevron" size={14} className="text-ink-soft" />
      </Link>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
        <DuoIcon name="micro" size={13} className="text-ink-soft" detail="#8A9188" />
        Las charlas habladas se revisan al terminar
      </p>
    </div>
  )
}
