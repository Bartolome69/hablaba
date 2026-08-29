"use client"

import { useState } from "react"
import { usePostHog } from "posthog-js/react"
import { DuoIcon, type IconName } from "@/components/icons"
import type { Routine } from "@/lib/routines"

interface RoutineCardProps {
  routine: Routine
  icon: IconName
  playingId: string | null
  onPlay: (id: string, text: string) => void
}

export function RoutineCard({ routine, icon, playingId, onPlay }: RoutineCardProps) {
  const [expanded, setExpanded] = useState(false)
  const posthog = usePostHog()

  return (
    <div className="clay-static overflow-hidden rounded-[20px]">
      <button
        onClick={() => {
          const next = !expanded
          if (next) posthog.capture("routine_opened", { routine_id: routine.id, routine_name: routine.name })
          setExpanded(next)
        }}
        aria-expanded={expanded}
        className="press-chip flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
          <DuoIcon name={icon} size={19} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">{routine.name}</p>
          <p className="text-[12.5px] text-ink-soft">{routine.context}</p>
        </div>
        <DuoIcon
          name="chevron"
          size={15}
          className={`flex-none text-ink-soft transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="divide-y divide-rule-soft border-t border-rule-soft">
          {routine.phrases.map((phrase, i) => {
            const id = `${routine.id}-${i}`
            const isPlaying = playingId === id
            return (
              <div key={id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-[17.5px] leading-[1.32] text-ink">{phrase.spanish}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-soft">{phrase.english}</p>
                </div>
                <button
                  onClick={() => onPlay(id, phrase.spanish)}
                  aria-label={`Escuchar: ${phrase.spanish}`}
                  className={`press-disc flex h-9 w-9 flex-none items-center justify-center rounded-full ${
                    isPlaying ? "bg-green text-cream" : "bg-sunken-2 text-ink"
                  }`}
                >
                  <DuoIcon
                    name="escuchar"
                    size={17}
                    detail={isPlaying ? "#8FBE9C" : undefined}
                    className={isPlaying ? "animate-pulse" : undefined}
                  />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
