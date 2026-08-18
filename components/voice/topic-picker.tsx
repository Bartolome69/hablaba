"use client"

// Horizontally scrollable topic chips for a voice conversation.
//
// Shared (components/voice/, not components/criar/) so Speak can reuse it when
// voice mode lands there. Purely presentational — the caller owns the choice
// and its persistence.

import type { VoiceTopic } from "@/lib/voice-topics"

export function TopicPicker({
  topics,
  selectedId,
  onSelect,
  disabled = false,
}: {
  topics: VoiceTopic[]
  selectedId: string
  onSelect: (id: string) => void
  disabled?: boolean
}) {
  const selected = topics.find((t) => t.id === selectedId)

  return (
    <div>
      {/* Negative margin + matching padding so chips can bleed to the screen
          edge while staying aligned with the surrounding content. */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5 pb-1">
          {topics.map((topic) => {
            const active = topic.id === selectedId
            return (
              <button
                key={topic.id}
                onClick={() => onSelect(topic.id)}
                disabled={disabled}
                aria-pressed={active}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors active:scale-[0.97] disabled:opacity-50 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span aria-hidden>{topic.emoji}</span>
                {topic.label}
              </button>
            )
          })}
        </div>
      </div>
      {selected && (
        <p className="mt-1.5 text-xs text-muted-foreground">{selected.blurb}</p>
      )}
    </div>
  )
}
