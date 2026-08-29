"use client"

import { useEffect, useMemo, useState } from "react"
import { usePostHog } from "posthog-js/react"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, type IconName } from "@/components/icons"
import { CaptureCard } from "@/components/phrases/capture-card"
import { MomentPack } from "@/components/phrases/moment-pack"
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
    routineName: r.name,
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
  const posthog = usePostHog()
  const [selected, setSelected] = useState<string>(categories[0].id)
  const [packKey, setPackKey] = useState(0)

  // Complete any captures migrated in without their Spanish yet.
  useEffect(() => {
    runMigrations()
    void completePendingCaptures().then((n) => {
      if (n > 0) setPackKey((k) => k + 1)
    })
  }, [])

  const visible = routines.filter((r) => r.category === selected)
  const activeCategory = categories.find((c) => c.id === selected) ?? categories[0]

  // Rotates once a day, same for the whole day.
  const phraseOfDay = useMemo(() => allPhrases[dayOfYear(new Date()) % allPhrases.length], [])
  const potdPlaying = playingId === phraseOfDay.id

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Frases" subtitle="Tocá cualquier frase para escucharla" />

      {/* Phrase of the day — the screen's single green block. */}
      <div className="clay-green-hero flex items-start gap-3.5 rounded-[26px] p-5">
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

      <CaptureCard onCaptured={() => setPackKey((k) => k + 1)} />

      <MomentPack key={packKey} />

      {/* Routine browsing, by situation. */}
      <div className="mt-8">
        <h2 className="px-1 font-serif text-[19px] text-ink">Frases por situación</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => {
              const isActive = category.id === selected
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelected(category.id)
                    posthog.capture("category_selected", { category: category.id })
                  }}
                  aria-pressed={isActive}
                  className={`flex h-[38px] flex-none items-center gap-[7px] rounded-full px-3.5 transition-transform duration-[120ms] active:translate-y-[2px] ${
                    isActive ? "bg-green text-cream" : "bg-sunken-2 text-ink"
                  }`}
                  style={{
                    boxShadow: isActive ? "0 3px 0 var(--hb-green-press)" : "0 2px 0 var(--hb-lip-sunken)",
                  }}
                >
                  <DuoIcon name={CATEGORY_ICONS[category.id] ?? "brote"} size={15} />
                  <span className="text-[13px] font-medium">{category.label}</span>
                </button>
              )
            })}
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {visible.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            icon={CATEGORY_ICONS[activeCategory.id] ?? "brote"}
            playingId={playingId}
            onPlay={play}
          />
        ))}
      </div>
    </div>
  )
}
