"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, type IconName } from "@/components/icons"
import { CaptureCard } from "@/components/phrases/capture-card"
import { MomentPack } from "@/components/phrases/moment-pack"
import { CuentosRow } from "@/components/cuentos/cuentos-row"
import { RoutineCard } from "@/components/speak/routine-card"
import { categories, routines } from "@/lib/routines"
import { useTTS } from "@/hooks/use-tts"
import { runMigrations } from "@/lib/migrations"
import { completePendingCaptures } from "@/lib/phrases/pack"

// Flat index of every phrase, used for the phrase of the day.
const allPhrases = routines.flatMap((r) =>
  r.phrases.map((p, i) => ({
    id: `${r.id}-${i}`,
    spanish: p.spanish,
    english: p.english,
    routineName: r.title,
  })),
)

const CATEGORY_ICONS: Record<string, IconName> = {
  baby: "peque",
  smalltalk: "pensamiento",
  cafe: "taza",
  travel: "avion",
}

function dayOfYear(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

export function SpeakPage() {
  const { play, playingId } = useTTS("speak")
  const [packKey, setPackKey] = useState(0)

  // Complete any captures migrated in without their Spanish yet.
  useEffect(() => {
    runMigrations()
    void completePendingCaptures().then((n) => {
      if (n > 0) setPackKey((k) => k + 1)
    })
  }, [])


  // Rotates once a day, same for the whole day.
  const phraseOfDay = useMemo(() => allPhrases[dayOfYear(new Date()) % allPhrases.length], [])
  const potdPlaying = playingId === phraseOfDay.id

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Frases" subtitle="Toca cualquier frase para escucharla" />

      {/* "¿Cómo se dice…?" leads: it's the job people open Frases for. */}
      <CaptureCard onCaptured={() => setPackKey((k) => k + 1)} />

      {/* Phrase of the day — the screen's single green block. */}
      <div className="clay-green-hero mt-3.5 flex items-start gap-3.5 rounded-[26px] p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <DuoIcon name="nueva" size={15} />
            <span className="smallcaps-lg text-green-on-dark">Frase del día</span>
          </div>
          <p className="font-serif text-[25px] leading-[1.2] tracking-[-0.015em] text-cream">
            {phraseOfDay.spanish}
          </p>
          <p className="text-[13px] text-green-on-dark">{phraseOfDay.english}</p>
        </div>
        <button
          onClick={() => play(phraseOfDay.id, phraseOfDay.spanish)}
          aria-label="Escuchar la frase del día"
          className="press-disc flex h-11 w-11 flex-none items-center justify-center rounded-full bg-green-well"
        >
          <DuoIcon
            name="escuchar"
            size={20}
            className={`text-cream ${potdPlaying ? "animate-pulse" : ""}`}
          />
        </button>
      </div>

      <MomentPack key={packKey} />

      {/* Cuentos: the family's picture books, read aloud in Spanish. After the
          moments (bedtime is one of them), before the parent's own section.
          Not green: the phrase of the day keeps this screen's green block. */}
      <CuentosRow />

      {/* Para ti: the parent's own situations (refresh Phase 5). The baby
          routines live inside the moments above now, so bath appears once;
          what's left here is the adult Spanish: small talk, cafés, getting
          around. Short headed groups, no chips. */}
      <section className="mt-9">
        <h2 className="px-1 font-serif text-[19px] text-ink">Para ti</h2>
        <p className="mt-1 px-1 text-[12.5px] text-ink-muted">
          Tu propio español: la charla con otros padres, el café, moverte por la ciudad.
        </p>
        {categories
          .filter((c) => c.id !== "baby")
          .map((category) => (
            <div key={category.id} className="mt-5">
              <h3 className="smallcaps px-1 text-ink-muted">{category.title}</h3>
              <div className="mt-2.5 space-y-2.5">
                {routines
                  .filter((r) => r.category === category.id)
                  .map((routine) => (
                    <RoutineCard
                      key={routine.id}
                      routine={routine}
                      icon={CATEGORY_ICONS[category.id] ?? "brote"}
                      playingId={playingId}
                      onPlay={play}
                    />
                  ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  )
}
