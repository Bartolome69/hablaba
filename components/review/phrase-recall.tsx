"use client"

// One saved phrase, recalled: the English first, "¿Cómo lo dirías?", then the
// Spanish with audio. Self-graded, like the flashcards: an honest "me salió"
// or "otra vez", and either way it counts as practice.

import { useState } from "react"
import { DuoIcon } from "@/components/icons"
import { useTTS } from "@/hooks/use-tts"
import type { Phrase } from "@/lib/phrases/types"

export function PhraseRecall({ phrase, onDone }: { phrase: Phrase; onDone: (gotIt: boolean) => void }) {
  const [revealed, setRevealed] = useState(false)
  const { play, playingId } = useTTS("speak")

  return (
    <div className="flex flex-1 flex-col">
      <p className="smallcaps text-ink-muted">Una frase tuya</p>
      <p className="mt-3 text-[15px] text-ink-muted">¿Cómo lo dirías?</p>
      <p className="mt-1.5 text-[22px] font-medium leading-snug text-ink">{phrase.translation}</p>

      {revealed ? (
        <div className="anim-settle mt-6 flex items-start gap-3 rounded-[20px] bg-sunken px-4 py-4">
          <p className="min-w-0 flex-1 font-serif text-[24px] leading-[1.25] tracking-[-0.01em] text-ink">{phrase.text}</p>
          <button
            onClick={() => play(phrase.id, phrase.text)}
            aria-label={`Escuchar: ${phrase.text}`}
            className="press-disc flex h-11 w-11 flex-none items-center justify-center rounded-full bg-surface"
          >
            <DuoIcon name="escuchar" size={19} className={playingId === phrase.id ? "animate-pulse" : ""} />
          </button>
        </div>
      ) : (
        <p className="mt-6 text-[13.5px] leading-relaxed text-ink-muted">
          Dilo en voz alta, o piénsalo. Después mira la frase.
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2.5 pt-8">
        {revealed ? (
          <>
            <button
              onClick={() => onDone(true)}
              className="clay-green h-14 rounded-full text-base font-semibold text-cream"
            >
              Me salió
            </button>
            <button
              onClick={() => onDone(false)}
              className="clay-card h-12 rounded-full text-[15px] font-semibold text-ink"
            >
              Otra vez será
            </button>
          </>
        ) : (
          <button onClick={() => setRevealed(true)} className="clay-green h-14 rounded-full text-base font-semibold text-cream">
            Ver la frase
          </button>
        )}
      </div>
    </div>
  )
}
