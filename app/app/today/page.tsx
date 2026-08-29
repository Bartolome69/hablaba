"use client"

// Today: the one-screen answer to "what should I do now".
//
// Clay + calm keeps this screen to exactly four moves — the green resume hero
// (the one green block), a quiet topic-switch row, two phrases to use today,
// and the week row. Two phrase cards is the maximum at this type size: a third
// pushes the week row under the nav, and the screen must end above it.

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, topicIcon } from "@/components/icons"
import { useTTS } from "@/hooks/use-tts"
import { countTurns, createConversation, listResumable } from "@/lib/conversations/store"
import type { Conversation } from "@/lib/conversations/types"
import { runMigrations } from "@/lib/migrations"
import { listPhrases } from "@/lib/phrases/store"
import type { Phrase } from "@/lib/phrases/types"
import { DEFAULT_VOICE_TOPIC_ID, getVoiceTopic } from "@/lib/voice-topics"

export default function TodayPage() {
  const router = useRouter()
  const { play, playingId } = useTTS("speak")
  const [resume, setResume] = useState<Conversation | null>(null)
  const [resumeTurns, setResumeTurns] = useState(0)
  const [duePhrases, setDuePhrases] = useState<Phrase[]>([])

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    runMigrations()
    const [latest] = listResumable()
    setResume(latest ?? null)
    if (latest) setResumeTurns(countTurns(latest.id))
    const all = listPhrases().filter((p) => p.text)
    // Working set first: what you're practising, then what's new.
    setDuePhrases(
      [...all.filter((p) => p.state === "practicando"), ...all.filter((p) => p.state === "nueva")].slice(0, 2),
    )
  }, [])

  const startFresh = useCallback(() => {
    const topic = getVoiceTopic(DEFAULT_VOICE_TOPIC_ID)
    const conversation = createConversation({
      starterId: topic.id,
      title: topic.label,
      emoji: topic.emoji,
    })
    router.push(`/app/charla/${conversation.id}`)
  }, [router])

  const heroInner = (
    <>
      <div className="flex items-center gap-[9px]">
        <DuoIcon name="micro" size={17} className="text-[#EAF3EB]" detail="#8FBE9C" />
        <span className="smallcaps-lg text-green-on-dark">Seguí tu charla</span>
      </div>
      <div className="mt-3.5 flex items-center gap-3">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[13px] bg-green-well">
          <DuoIcon name={topicIcon(resume?.starterId ?? DEFAULT_VOICE_TOPIC_ID)} size={22} className="text-[#EAF3EB]" />
        </div>
        <span className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
          {resume ? resume.title : "Contame cómo va tu día"}
        </span>
      </div>
      <span className="mt-1.5 block text-[13.5px] text-green-on-dark">
        {resume
          ? `${resumeTurns} turnos · escribí o seguí en voz alta`
          : "Escribí, o hablá con las manos libres. 5 a 15 minutos."}
      </span>
      <span className="clay-cream mt-[18px] flex h-[46px] items-center justify-center gap-2 rounded-full">
        <span className="text-[15px] font-semibold text-green">
          {resume ? "Continuar" : "Empezar"}
        </span>
        <DuoIcon name="flecha" size={16} />
      </span>
    </>
  )

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Hoy" subtitle="Un rato de español, cuando puedas" controls />

      {/* The one green block: continues a live thread if there is one, because
          picking up a conversation beats starting a cold one. */}
      {resume ? (
        <Link href={`/app/charla/${resume.id}`} className="clay-green-hero block rounded-[26px] p-[22px]">
          {heroInner}
        </Link>
      ) : (
        <button onClick={startFresh} className="clay-green-hero block w-full rounded-[26px] p-[22px] text-left">
          {heroInner}
        </button>
      )}

      <Link
        href="/app/charla"
        className="mt-3.5 flex items-center gap-1.5 px-1 text-[13.5px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        Elegir otro tema
        <DuoIcon name="chevron" size={14} className="text-ink-soft" />
      </Link>

      {/* Phrases due today — straight from the unified library. */}
      {duePhrases.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between px-1 pb-3">
            <h2 className="flex items-center gap-2 font-serif text-xl tracking-[-0.01em] text-ink">
              <DuoIcon name="brote" size={18} className="text-green" />
              Frases para usar hoy
            </h2>
            <Link href="/app/speak" className="text-[12.5px] font-medium text-terracotta">
              Ver todas
            </Link>
          </div>
          <ul className="stagger-children space-y-[9px]">
            {duePhrases.map((phrase) => (
              <li key={phrase.id} className="clay-static flex items-start gap-3 rounded-[20px] px-4 py-[15px]">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-serif text-[17.5px] leading-[1.32] text-ink">{phrase.text}</p>
                  <p className="text-[12.5px] leading-snug text-ink-soft">{phrase.translation}</p>
                </div>
                <button
                  onClick={() => play(phrase.id, phrase.text)}
                  aria-label={`Escuchar: ${phrase.text}`}
                  className="press-disc flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sunken-2 text-ink"
                >
                  <DuoIcon
                    name="escuchar"
                    size={17}
                    className={playingId === phrase.id ? "animate-pulse" : undefined}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link
        href="/app/semana"
        className="mt-6 flex items-center gap-2.5 border-t border-rule px-1 pt-4 text-ink transition-colors"
      >
        <DuoIcon name="calendario" size={18} />
        <span className="flex-1 text-sm font-medium">Tu semana: patrones y logros</span>
        <DuoIcon name="chevron" size={14} className="text-ink-soft" />
      </Link>
    </div>
  )
}
