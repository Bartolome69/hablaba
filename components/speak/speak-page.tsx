"use client"

import { AppHeader } from "@/components/home/app-header"
import { RoutineCard } from "@/components/speak/routine-card"
import { routines } from "@/lib/routines"
import { useTTS } from "@/hooks/use-tts"

export function SpeakPage() {
  const { play, playingId } = useTTS("speak")

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-8">
      <AppHeader />

      <div className="mb-6">
        <h2 className="text-sm font-medium text-muted-foreground mb-1">Daily routines</h2>
        <p className="text-xs text-muted-foreground">Same phrases, every time. Tap to hear pronunciation.</p>
      </div>

      <div className="space-y-3">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            playingId={playingId}
            onPlay={play}
          />
        ))}
      </div>
    </div>
  )
}
