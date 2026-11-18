"use client"

// Hoy, rebuilt on the five jobs (refresh Phase 2). Top to bottom:
//   jobs 1–3  the "¿Cómo se dice?" bar, which rides on the bottom nav (global)
//   job 4     the one green block: resume the latest thread, or start one,
//             with "Elegir otro tema" as a real secondary button
//   job 5     Repasar: what's due in Palabras, else the grammar topic to work on
//   the loop  "Esta semana": this week's top pattern, into Tu semana
//   flavour   "Para hoy con …": two phrases for this time of day
// No streak, no score. The first four sit above the bar on a 390 × 844 phone.

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, topicIcon, type IconName } from "@/components/icons"
import { useTTS } from "@/hooks/use-tts"
import { countTurns, createConversation, listResumable } from "@/lib/conversations/store"
import type { Conversation } from "@/lib/conversations/types"
import { runMigrations } from "@/lib/migrations"
import { queryPackForMoment } from "@/lib/phrases/pack"
import type { Phrase, PhraseMoment } from "@/lib/phrases/types"
import { getProfile } from "@/lib/profile/store"
import { weakestTopic, weeklyPattern, type FocusTopic } from "@/lib/review/focus"
import { DEFAULT_VOICE_TOPIC_ID, getVoiceTopic } from "@/lib/voice-topics"
import { countDue } from "@/lib/vocab/store"

/** The daily moment this hour belongs to: what "para hoy" means right now. */
function momentForHour(now: Date): PhraseMoment {
  const h = now.getHours()
  if (h < 10) return "despertar"
  if (h < 14) return "comida"
  if (h < 17) return now.getDate() % 2 ? "juego" : "paseo"
  if (h < 19) return "baño"
  return "dormir"
}

interface TodayState {
  resume: Conversation | null
  resumeTurns: number
  wordsDue: number
  pattern: (FocusTopic & { count: number }) | null
  weakest: FocusTopic | null
  phrases: Phrase[]
  childName: string | null
}

export default function TodayPage() {
  const router = useRouter()
  const { play, playingId } = useTTS("speak")
  const [s, setS] = useState<TodayState | null>(null)

  // localStorage is client-only: load after mount to avoid a hydration mismatch.
  useEffect(() => {
    runMigrations()
    const [latest] = listResumable()
    setS({
      resume: latest ?? null,
      resumeTurns: latest ? countTurns(latest.id) : 0,
      wordsDue: countDue(),
      pattern: weeklyPattern(),
      weakest: weakestTopic(),
      phrases: queryPackForMoment(momentForHour(new Date())).slice(0, 2),
      childName: getProfile().child?.name ?? null,
    })
  }, [])

  const startFresh = useCallback(() => {
    const topic = getVoiceTopic(DEFAULT_VOICE_TOPIC_ID)
    const conversation = createConversation({ starterId: topic.id, title: topic.label, emoji: topic.emoji })
    router.push(`/app/charla/${conversation.id}`)
  }, [router])

  const resume = s?.resume ?? null

  const heroInner = (
    <>
      <div className="flex items-center gap-[9px]">
        <DuoIcon name="micro" size={17} className="text-[#EAF3EB]" detail="#8FBE9C" />
        <span className="smallcaps-lg text-green-on-dark">{resume ? "Sigue tu charla" : "Empieza una charla"}</span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[13px] bg-green-well">
          <DuoIcon name={topicIcon(resume?.starterId ?? DEFAULT_VOICE_TOPIC_ID)} size={22} className="text-[#EAF3EB]" />
        </div>
        <span className="font-serif text-[25px] leading-tight tracking-[-0.015em] text-cream">
          {resume ? resume.title : "Cuéntame cómo va tu día"}
        </span>
      </div>
      <span className="clay-cream mt-4 flex h-[46px] items-center justify-center gap-2 rounded-full">
        <span className="text-[15px] font-semibold text-green">
          {resume ? `Continuar · ${s?.resumeTurns ?? 0} turnos` : "Empezar · 5 a 15 min"}
        </span>
        <DuoIcon name="flecha" size={16} />
      </span>
    </>
  )

  // Job 5: words due first (the review that won't wait), else the grammar to
  // work on, else a calm "al día" that still leads into Práctica.
  const repasar: { href: string; title: string; detail: string; icon: IconName } | null = !s
    ? null
    : s.wordsDue > 0
      ? {
          href: "/app/palabras",
          title: "Repasar",
          detail: `${s.wordsDue} ${s.wordsDue === 1 ? "tarjeta" : "tarjetas"}${s.pattern ? ` · ${s.pattern.label.toLowerCase()}` : ""}`,
          icon: "repasar",
        }
      : s.pattern || s.weakest
        ? {
            href: `/app/exercises?topic=${(s.pattern ?? s.weakest)!.id}`,
            title: "Practicar",
            detail: (s.pattern ?? s.weakest)!.label,
            icon: "practica",
          }
        : { href: "/app/exercises", title: "Estás al día", detail: "Elige un tema de gramática cuando quieras", icon: "practica" }

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Hoy" subtitle="Un rato de español, cuando puedas" controls />

      {/* Job 4. The one green block: picking up a thread beats starting cold. */}
      {!s ? (
        // Same footprint while localStorage loads, so the screen doesn't jump
        // and a returning parent never sees "Empieza" flash before "Sigue".
        <div className="clay-green-hero h-[164px] rounded-[26px]" aria-hidden />
      ) : resume ? (
        <Link href={`/app/charla/${resume.id}`} className="clay-green-hero block rounded-[26px] p-5">
          {heroInner}
        </Link>
      ) : (
        <button onClick={startFresh} className="clay-green-hero block w-full rounded-[26px] p-5 text-left">
          {heroInner}
        </button>
      )}
      <Link
        href="/app/charla"
        className="clay-card mt-2.5 flex h-11 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold text-ink"
      >
        Elegir otro tema
        <DuoIcon name="chevron" size={14} className="text-ink-muted" />
      </Link>

      {/* Job 5. */}
      {repasar && (
        <Link href={repasar.href} className="clay-card mt-4 flex items-center gap-3 rounded-[20px] p-3.5">
          <div className="flex h-[40px] w-[40px] flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
            <DuoIcon name={repasar.icon} size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">{repasar.title}</p>
            <p className="truncate text-[13px] text-ink-muted">{repasar.detail}</p>
          </div>
          <DuoIcon name="chevron" size={15} className="flex-none text-ink-muted" />
        </Link>
      )}

      {/* The loop, made visible: what keeps coming up, one tap from the report. */}
      {s && (
        <Link href="/app/semana" className="mt-3 flex min-h-11 items-center gap-2.5 px-1 text-ink">
          <DuoIcon name="calendario" size={18} />
          <span className="min-w-0 flex-1 truncate text-[14px]">
            {s.pattern ? (
              <>
                <span className="font-medium">Esta semana:</span>{" "}
                <span className="text-ink-muted">{s.pattern.label.toLowerCase()}</span>
              </>
            ) : (
              <span className="font-medium">Tu semana: patrones y logros</span>
            )}
          </span>
          <DuoIcon name="chevron" size={14} className="text-ink-muted" />
        </Link>
      )}

      {/* Flavour, not frame: two lines for this time of day. */}
      {s && s.phrases.length > 0 && (
        <section className="mt-5 border-t border-rule pt-4">
          <div className="flex items-center justify-between px-1 pb-2.5">
            <h2 className="font-serif text-[19px] tracking-[-0.01em] text-ink">
              {s.childName ? `Para hoy con ${s.childName}` : "Para hoy"}
            </h2>
            <Link href="/app/speak" className="flex min-h-11 items-center text-[12.5px] font-medium text-terracotta-ink">
              Ver todas
            </Link>
          </div>
          <ul className="stagger-children space-y-[9px]">
            {s.phrases.map((phrase) => (
              <li key={phrase.id} className="clay-static flex items-start gap-3 rounded-[20px] px-4 py-[13px]">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-serif text-[17px] leading-[1.32] text-ink">{phrase.text}</p>
                  <p className="text-[12.5px] leading-snug text-ink-muted">{phrase.translation}</p>
                </div>
                <button
                  onClick={() => play(phrase.id, phrase.text)}
                  aria-label={`Escuchar: ${phrase.text}`}
                  className="press-disc -my-1 -mr-1 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-sunken-2 text-ink"
                >
                  <DuoIcon name="escuchar" size={17} className={playingId === phrase.id ? "animate-pulse" : undefined} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
