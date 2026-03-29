"use client"

import { useState } from "react"
import { ChevronDown, Volume2, Loader2 } from "lucide-react"
import type { Routine } from "@/lib/routines"

interface RoutineCardProps {
  routine: Routine
  playingId: string | null
  onPlay: (id: string, text: string) => void
}

export function RoutineCard({ routine, playingId, onPlay }: RoutineCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/50 active:scale-[0.98] transition-all"
      >
        <span className="text-2xl">{routine.emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{routine.name}</p>
          <p className="text-xs text-muted-foreground">{routine.phrases.length} phrases</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-border divide-y divide-border">
          {routine.phrases.map((phrase, i) => {
            const id = `${routine.id}-${i}`
            const isPlaying = playingId === id
            return (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{phrase.spanish}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{phrase.english}</p>
                </div>
                <button
                  onClick={() => onPlay(id, phrase.spanish)}
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isPlaying
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isPlaying ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
