"use client"

import { useState } from "react"
import { usePostHog } from "posthog-js/react"
import { AppHeader } from "@/components/home/app-header"
import { RoutineCard } from "@/components/speak/routine-card"
import { categories, routines } from "@/lib/routines"
import { useTTS } from "@/hooks/use-tts"
import { useHeardPhrases } from "@/hooks/use-heard-phrases"

export function SpeakPage() {
  const { play, playingId } = useTTS("speak")
  const { heard, markHeard } = useHeardPhrases()
  const posthog = usePostHog()
  const [selected, setSelected] = useState<string>(categories[0].id)

  const visible = routines.filter((r) => r.category === selected)
  const activeCategory = categories.find((c) => c.id === selected) ?? categories[0]

  const handlePlay = (id: string, text: string) => {
    markHeard(id)
    play(id, text)
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Speak" subtitle="Tap any phrase to hear it aloud" />

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((category) => {
          const isActive = category.id === selected
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
