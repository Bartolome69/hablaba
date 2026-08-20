"use client"

// Today: the one-screen answer to "what should I do now".
//
// Deliberately short. The big Charlar card is the point of the app, so it goes
// first and takes real space; everything under it is a smaller nudge. Anything
// that belongs to conversations proper (starters, full resume list, history)
// lives in the Charlar hub, not here.

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, ChevronRight, Mic, Sprout, Volume2 } from "lucide-react"
import { AppHeader } from "@/components/home/app-header"
import { ReviewCard } from "@/components/home/review-card"
import { useSavedPhrases } from "@/hooks/use-saved-phrases"
import { useTTS } from "@/hooks/use-tts"
import {
  countTurns,
  createConversation,
  listResumable,
  migrateLegacyConversations,
} from "@/lib/conversations/store"
import type { Conversation } from "@/lib/conversations/types"
import { dailyPrompt } from "@/lib/data"
import { readTodayHighlights, type TodayHighlights } from "@/lib/today-highlights"
import { DEFAULT_VOICE_TOPIC_ID, getVoiceTopic } from "@/lib/voice-topics"

export default function TodayPage() {
  const router = useRouter()
  const { phrases } = useSavedPhrases()
  const { play, playingId } = useTTS("speak")
  const [resume, setResume] = useState<Conversation | null>(null)
  const [resumeTurns, setResumeTurns] = useState(0)
  const [highlights, setHighlights] = useState<TodayHighlights | null>(null)

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    migrateLegacyConversations()
    const [latest] = listResumable()
    setResume(latest ?? null)
    if (latest) setResumeTurns(countTurns(latest.id))
    setHighlights(readTodayHighlights())
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

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Hoy" subtitle="Un rato de español, cuando puedas" />

      {/* The main event. Continues a live thread if there is one, because
          picking up a conversation beats starting a cold one. */}
      {resume ? (
        <Link
          href={`/app/charla/${resume.id}`}
          className="mb-4 block rounded-2xl bg-primary p-5 text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
        >
          <div className="mb-3 flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide opacity-80">
              Seguí tu charla
            </span>
          </div>
          <p className="font-serif text-xl leading-snug">
            {resume.emoji} {resume.title}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {resumeTurns} turnos · escribí o seguí en voz alta
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
            Continuar
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      ) : (
        <button
          onClick={startFresh}
          className="mb-4 block w-full rounded-2xl bg-primary p-5 text-left text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
        >
          <div className="mb-3 flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide opacity-80">Charlar</span>
          </div>
          <p className="font-serif text-xl leading-snug">Contame cómo va tu día</p>
          <p className="mt-1 text-sm opacity-80">
            Escribí, o hablá con las manos libres — 5 a 15 minutos
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold">
            Empezar
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      )}

      <Link
        href="/app/charla"
        className="mb-8 flex items-center gap-2 px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Elegir otro tema
        <ChevronRight className="h-4 w-4" />
      </Link>

      {/* Published by whichever module has something for today — currently
          Grow's daily pack. Read through a shared contract, never by importing
          module code (see lib/today-highlights.ts). */}
      {highlights && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 font-serif text-base text-foreground">
              <Sprout className="h-4 w-4 text-primary" />
              Frases de hoy
            </h2>
            <Link href={highlights.href} className="text-xs font-medium text-primary">
              Ver todas →
            </Link>
          </div>
          <p className="mb-2 text-xs capitalize text-muted-foreground">{highlights.title}</p>
          <ul className="space-y-2">
            {highlights.phrases.map((phrase, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[15px] leading-snug text-foreground">
                    {phrase.spanish}
                  </p>
                  <p className="text-xs text-muted-foreground">{phrase.english}</p>
                </div>
                <button
                  onClick={() => play(`highlight-${i}`, phrase.spanish)}
                  aria-label={`Escuchar: ${phrase.spanish}`}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground active:scale-95"
                >
                  <Volume2
                    className={`h-4 w-4 ${playingId === `highlight-${i}` ? "animate-pulse text-primary" : ""}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Daily prompt — a thought to chew on, or a conversation to start. */}
      <section className="mb-8">
        <h2 className="mb-3 font-serif text-base text-foreground">Para pensar</h2>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="font-serif text-lg leading-snug text-foreground">{dailyPrompt.spanish}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{dailyPrompt.english}</p>
        </div>
      </section>

      {phrases.length > 0 && <ReviewCard count={phrases.length} />}
    </div>
  )
}
