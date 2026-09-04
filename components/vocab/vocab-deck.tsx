"use client"

// A study session over the learner's own word list.
//
// The prompt is ENGLISH and the answer is Spanish, on purpose: recognising
// "la rodilla" proves much less than producing it, and producing it forces the
// article, which is the part that's actually hard. Recognition is available as
// the other direction for a gentler pass.
//
// "Lo sabía / Otra vez" is the learner's own call, not a grade — nothing here
// marks them wrong. Missed words simply come back sooner, because the deck is
// ordered by least-practised (see buildDeck in lib/vocab/store.ts).

import { useMemo, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { useTTS } from "@/hooks/use-tts"
import { recordReview } from "@/lib/vocab/store"
import { withArticle, type VocabWord } from "@/lib/vocab/types"

type Direction = "en-es" | "es-en"

interface VocabDeckProps {
  words: VocabWord[]
  onExit: () => void
  onFinished: () => void
}

export function VocabDeck({ words, onExit, onFinished }: VocabDeckProps) {
  // Frozen for the session so cards don't reshuffle as the counts change
  // underneath — same reason the phrase deck freezes its order.
  const deck = useMemo(() => words, [])
  const { play, playingId } = useTTS("speak")
  const [direction, setDirection] = useState<Direction>("en-es")
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [knownCount, setKnownCount] = useState(0)

  const current = deck[index]
  const done = index >= deck.length

  const answer = (known: boolean) => {
    if (!current) return
    recordReview(current.id, known)
    if (known) setKnownCount((c) => c + 1)
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center px-2 py-14 text-center">
        <div className="clay-green-disc mb-5 flex h-16 w-16 items-center justify-center rounded-full">
          <DuoIcon name="logrado" size={28} className="text-cream" detail="#8FBE9C" />
        </div>
        <h2 className="font-serif text-[26px] leading-tight tracking-[-0.015em] text-ink">
          ¡Listo!
        </h2>
        <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-ink-soft">
          {deck.length} {deck.length === 1 ? "palabra" : "palabras"} · sabías {knownCount}. Las que
          no, vuelven primero la próxima vez.
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

  const front = direction === "en-es" ? current.english : withArticle(current)
  const back = direction === "en-es" ? withArticle(current) : current.english

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="smallcaps text-ink-soft">
          {index + 1} / {deck.length}
        </span>
        <button onClick={onExit} className="text-[13px] font-medium text-ink-muted">
          Salir
        </button>
      </div>

      {/* Green and cream only — no amber, no red, nothing that reads as a score. */}
      <div className="mb-5 h-[5px] w-full overflow-hidden rounded-full bg-segment-empty">
        <div
          className="h-full rounded-full bg-green transition-[width] duration-300"
          style={{ width: `${(index / deck.length) * 100}%` }}
        />
      </div>

      <button
        onClick={() => setRevealed((r) => !r)}
        className="clay-card flex min-h-[240px] w-full flex-col items-center justify-center gap-3 rounded-[26px] px-6 py-8 text-center"
      >
        <span className="smallcaps text-ink-faint">
          {revealed ? "" : direction === "en-es" ? "En español…" : "In English…"}
        </span>
        <span className="font-serif text-[30px] leading-[1.15] tracking-[-0.02em] text-ink">
          {revealed ? back : front}
        </span>
        {revealed ? (
          <>
            <span className="text-[13.5px] text-ink-soft">{front}</span>
            {current.example && (
              <span className="anim-settle mt-3 max-w-[280px] border-t border-rule pt-3 font-serif text-[15px] leading-[1.4] text-ink-muted">
                {current.example}
              </span>
            )}
          </>
        ) : (
          <span className="text-[12.5px] text-ink-faint">Tocá para ver</span>
        )}
      </button>

      {revealed ? (
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
      ) : (
        <div className="mt-4 flex justify-center">
          <div className="clay-well flex items-center gap-1 rounded-full bg-sunken-2 p-1">
            {(
              [
                ["en-es", "Inglés → Español"],
                ["es-en", "Español → Inglés"],
              ] as [Direction, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setDirection(id)}
                aria-pressed={direction === id}
                className={`press-chip h-9 rounded-full px-3.5 text-[12.5px] font-medium ${
                  direction === id ? "bg-green text-cream" : "text-ink-muted"
                }`}
                style={direction === id ? { boxShadow: "0 2px 0 var(--hb-green-press)" } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
