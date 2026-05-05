"use client"

import { useState } from "react"
import { ChevronDown, Volume2, Loader2, Check } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import type { Routine } from "@/lib/routines"

interface RoutineCardProps {
  routine: Routine
  playingId: string | null
  onPlay: (id: string, text: string) => void
  heardPhrases: Set<string>
}

export function RoutineCard({ routine, playingId, onPlay, heardPhrases }: RoutineCardProps) {
  const [expanded, setExpanded] = useState(false)
  const posthog = usePostHog()

  const heardCount = routine.phrases.filter((_, i) => heardPhrases.has(`${routine.id}-${i}`)).length
  const allHeard = heardCount === routine.phrases.length && heardCount > 0

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => {
          const next = !expanded
          if (next) posthog.capture("routine_opened", { routine_id: routine.id, routine_name: routine.name })
          setExpanded(next)
        }}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 active:scale-[0.98] transition-all"
      >
        <span className="text-2xl">{routine.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{routine.name}</p>
            {allHeard && (
              <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">{routine.context}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {heardCount > 0 && !allHeard && (
            <span className="text-xs text-muted-foreground">{heardCount}/{routine.phrases.length}</span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {routine.phrases.map((phrase, i) => {
            const id = `${routine.id}-${i}`
            const isPlaying = playingId === id
            const isHeard = heardPhrases.has(id)
            return (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold text-foreground ${isHeard ? "opacity-70" : ""}`}>
                    {phrase.spanish}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{phrase.english}</p>
                </div>
                <button
                  onClick={() => onPlay(id, phrase.spanish)}
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                    isPlaying
                      ? "bg-primary text-primary-foreground"
                      : isHeard
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isPlaying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isHeard ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
