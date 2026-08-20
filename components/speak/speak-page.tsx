"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Volume2, Loader2, Mic, ChevronRight } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { AppHeader } from "@/components/home/app-header"
import { CaptureCard } from "@/components/phrases/capture-card"
import { MomentPack } from "@/components/phrases/moment-pack"
import { RoutineCard } from "@/components/speak/routine-card"
import { categories, routines } from "@/lib/routines"
import { useTTS } from "@/hooks/use-tts"
import { runMigrations } from "@/lib/migrations"
import { completePendingCaptures } from "@/lib/phrases/pack"

// Flat index of every phrase, used for the progress meter and phrase of the day.
const allPhrases = routines.flatMap((r) =>
  r.phrases.map((p, i) => ({
    id: `${r.id}-${i}`,
    spanish: p.spanish,
    english: p.english,
    emoji: r.emoji,
    routineName: r.name,
  })),
)

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

  const handlePlay = (id: string, text: string) => {
    play(id, text)
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Phrases" subtitle="Tap any phrase to hear it aloud" />

      {/* Live voice conversation — hands-free practice with the AI partner */}
      <Link
        href="/app/charla"
        className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50 active:scale-[0.99]"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Charlar</p>
          <p className="text-xs text-muted-foreground">
            Live voice conversation — hands-free, 5–15 min
          </p>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
      </Link>

      {/* Phrase of the day */}
      <div className="mb-4 rounded-2xl bg-primary p-4 text-primary-foreground">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-base">{phraseOfDay.emoji}</span>
          <span className="text-xs font-medium uppercase tracking-wide opacity-80">Phrase of the day</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-lg leading-snug">{phraseOfDay.spanish}</p>
            <p className="text-sm opacity-80">{phraseOfDay.english}</p>
          </div>
          <button
            onClick={() => handlePlay(phraseOfDay.id, phraseOfDay.spanish)}
            aria-label="Play phrase of the day"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary-foreground/15 transition-transform active:scale-95"
          >
            {potdPlaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <CaptureCard onCaptured={() => setPackKey((k) => k + 1)} />

      <MomentPack key={packKey} />

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category) => {
          const isActive = category.id === selected
          const count = routines.filter((r) => r.category === category.id).length
          return (
            <button
              key={category.id}
              onClick={() => {
                setSelected(category.id)
                posthog.capture("category_selected", { category: category.id })
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <span className="mr-1.5">{category.emoji}</span>
              {category.label}
              <span className={`ml-1.5 tabular-nums ${isActive ? "opacity-70" : "opacity-60"}`}>{count}</span>
            </button>
          )
        })}
      </div>

      <h2 className="font-serif text-base text-foreground mb-3">{activeCategory.label}</h2>

      <div className="space-y-3">
        {visible.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            playingId={playingId}
            onPlay={handlePlay}
          />
        ))}
      </div>
    </div>
  )
}
