"use client"

import { useMemo, useState } from "react"
import { Volume2, Loader2, Check } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { AppHeader } from "@/components/home/app-header"
import { RoutineCard } from "@/components/speak/routine-card"
import { categories, routines } from "@/lib/routines"
import { useTTS } from "@/hooks/use-tts"
import { useHeardPhrases } from "@/hooks/use-heard-phrases"

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
  const { heard, markHeard } = useHeardPhrases()
  const posthog = usePostHog()
  const [selected, setSelected] = useState<string>(categories[0].id)

  const visible = routines.filter((r) => r.category === selected)
  const activeCategory = categories.find((c) => c.id === selected) ?? categories[0]

  const heardCount = allPhrases.filter((p) => heard.has(p.id)).length
  const total = allPhrases.length
  const pct = total ? Math.round((heardCount / total) * 100) : 0

  // Rotates once a day, same for the whole day.
  const phraseOfDay = useMemo(() => allPhrases[dayOfYear(new Date()) % allPhrases.length], [])
  const potdPlaying = playingId === phraseOfDay.id

  const handlePlay = (id: string, text: string) => {
    markHeard(id)
    play(id, text)
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Phrases" subtitle="Tap any phrase to hear it aloud" />

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

      {/* Progress */}
      <div className="mb-5 rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Your progress</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {heardCount === total && total > 0 ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Check className="h-3.5 w-3.5" /> All heard
              </span>
            ) : (
              `${heardCount} / ${total} heard`
            )}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

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
            heardPhrases={heard}
          />
        ))}
      </div>
    </div>
  )
}
