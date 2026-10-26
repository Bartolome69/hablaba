"use client"

// A flashcard session over a deck of words (a pack, or Repaso de hoy).
//
// Direction follows the word, not a toggle: a new or shaky card shows the
// Spanish first (recognise it), and once it's been known twice it flips to
// English first (produce it, which forces the article, the part that's
// actually hard). Cards get harder as the learner does, with nothing to set.
//
// "Lo sabía / Otra vez" is the learner's own call, not a grade. Only a card's
// FIRST answer in a session moves it on the ladder; a missed card goes back to
// the end of the deck (up to twice) so the session ends on getting it.

import { useState } from "react"
import { DuoIcon } from "@/components/icons"
import { useTTS } from "@/hooks/use-tts"
import { isVirtual, recordRelearned, recordReview } from "@/lib/vocab/store"
import { withArticle, type VocabWord } from "@/lib/vocab/types"

/** How many times a missed card comes back within one session. */
const MAX_REQUEUES = 2

type Direction = "es-en" | "en-es"

function directionFor(word: VocabWord): Direction {
  return !isVirtual(word) && word.box >= 2 ? "en-es" : "es-en"
}

interface VocabDeckProps {
  words: VocabWord[]
  onExit: () => void
  onFinished: () => void
}

export function VocabDeck({ words, onExit, onFinished }: VocabDeckProps) {
  const { play, playingId } = useTTS("speak")
  // Frozen at the start so cards don't reshuffle as counts change underneath;
  // it only grows, when a missed card is sent to the back.
  const [queue, setQueue] = useState(words)
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [firstTryKnown, setFirstTryKnown] = useState(0)
  const [attempts, setAttempts] = useState<Record<string, number>>({})

  const current = queue[index]
  const done = index >= queue.length

  const answer = (known: boolean) => {
    if (!current) return
    const tries = attempts[current.id] ?? 0
    if (tries === 0) {
      recordReview(current.id, known)
      if (known) setFirstTryKnown((c) => c + 1)
    } else if (known) {
      recordRelearned(current.id)
    }
    setAttempts((a) => ({ ...a, [current.id]: tries + 1 }))
    if (!known && tries < MAX_REQUEUES) setQueue((q) => [...q, current])
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center px-2 py-14 text-center">
        <div className="clay-green-disc mb-5 flex h-16 w-16 items-center justify-center rounded-full">
          <DuoIcon name="logrado" size={28} className="text-cream" detail="#8FBE9C" />
        </div>
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-ink">¡Listo!</h2>
        <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">
          {words.length} {words.length === 1 ? "tarjeta" : "tarjetas"} · {firstTryKnown} a la primera.
          Las que sabés vuelven más adelante; las otras, pronto.
        </p>
        <button
          onClick={onFinished}
          className="clay-green mt-7 flex h-[46px] items-center justify-center rounded-full px-8 text-[15px] font-semibold text-cream"
        >
          Volver
        </button>
      </div>
    )
  }

  const direction = directionFor(current)
  const front = direction === "en-es" ? current.english : withArticle(current)
  const back = direction === "en-es" ? withArticle(current) : current.english
  const isRetry = (attempts[current.id] ?? 0) > 0

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="smallcaps text-ink-soft">
          {index + 1} / {queue.length}
        </span>
        <button onClick={onExit} className="text-[13px] font-medium text-ink-muted">
          Salir
        </button>
      </div>

      {/* Green and cream only — no amber, no red, nothing that reads as a score. */}
      <div className="mb-5 h-[5px] w-full overflow-hidden rounded-full bg-segment-empty">
        <div
          className="h-full rounded-full bg-green transition-[width] duration-300"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

      {/* A real flip: two faces back to back, rotated on Y. Keyed per card so
          the next one mounts face-up; animating it back would flash its answer.
          Faces use clay-static, not clay-card: the card's :active press sets
          transform and would undo the back face's rotation mid-tap. Reduced
          motion collapses the transition to an instant swap (globals.css). */}
      <button
        key={index}
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? `${back}. ${front}` : `${front}. Tocá para dar vuelta`}
        className="block w-full [perspective:1200px]"
      >
        <div
          className={`relative h-[280px] w-full transition-transform duration-[480ms] [transform-style:preserve-3d] ${
            revealed ? "[transform:rotateY(180deg)]" : ""
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(.22,1,.36,1)" }}
        >
          <div className="clay-static absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[26px] px-6 py-8 text-center [backface-visibility:hidden]">
            <span className="smallcaps text-ink-faint">
              {isRetry ? "Otra vez" : direction === "en-es" ? "En español…" : "¿Qué significa?"}
            </span>
            <span className="font-serif text-[30px] leading-[1.15] tracking-[-0.02em] text-ink text-balance">
              {front}
            </span>
            <span className="text-[12.5px] text-ink-faint">Tocá para dar vuelta</span>
          </div>
          <div className="clay-static absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-[26px] px-6 py-8 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="font-serif text-[30px] leading-[1.15] tracking-[-0.02em] text-ink text-balance">
              {back}
            </span>
            <span className="text-[13.5px] text-ink-soft">{front}</span>
            {current.example && (
              <span className="mt-2 max-w-[280px] border-t border-rule pt-3 font-serif text-[15px] leading-[1.4] text-ink-muted">
                {current.example}
              </span>
            )}
          </div>
        </div>
      </button>

      {revealed && (
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => play(current.id, withArticle(current))}
              aria-label={`Escuchar: ${withArticle(current)}`}
              className="press-disc flex h-11 w-11 items-center justify-center rounded-full bg-sunken-2 text-ink"
            >
              <DuoIcon
                name="escuchar"
                size={19}
                className={playingId === current.id ? "animate-pulse" : undefined}
              />
            </button>
            {current.example && (
              <button
                onClick={() => play(`${current.id}-ej`, current.example!)}
                className="press-chip flex h-11 items-center gap-2 rounded-full bg-sunken-2 px-4 text-[13px] font-medium text-ink"
              >
                <DuoIcon name="escuchar" size={16} />
                La frase
              </button>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => answer(false)}
              className="clay-static h-[52px] flex-1 rounded-full text-[15px] font-semibold text-ink"
            >
              Otra vez
            </button>
            <button
              onClick={() => answer(true)}
              className="clay-green h-[52px] flex-1 rounded-full text-[15px] font-semibold text-cream"
            >
              Lo sabía
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
