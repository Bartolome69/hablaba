"use client"

// The grammar quiz, its calm results summary and the "Llévalo a tu día"
// bridge. Moved out of exercises-app.tsx (refresh Phase 3) so the Repasar
// session can embed the same quiz instead of growing a second one.

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { gradeAnswer, acceptedAnswers } from "@/lib/exercises/grade"
import { playCorrect, playFinish } from "@/lib/exercises/sound"
import { practicePackForTopics, practicePhrasesForTopics } from "@/lib/exercises/practice-phrases"
import { recordAttempt } from "@/lib/exercises/store"
import { getTopic } from "@/lib/exercises/taxonomy"
import type { ExerciseItem } from "@/lib/exercises/types"
import { addPhrase } from "@/lib/phrases/store"
import { useImmersive } from "@/lib/ui/immersive"
import { packLabel } from "@/lib/vocab/catalog"

/** The prompt's blank, rendered as a terracotta ___ . */
function PromptWithBlank({ prompt }: { prompt: string }) {
  const parts = prompt.split(/_{2,}/)
  return (
    <p className="font-serif text-[29px] leading-[1.24] tracking-[-0.02em] text-ink text-pretty">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="text-terracotta">___</span>}
        </span>
      ))}
    </p>
  )
}

export interface QuizResult {
  correct: number
  total: number
  missed: ExerciseItem[]
}

export function Quiz({
  title,
  items,
  onExit,
  onComplete,
}: {
  title: string
  items: ExerciseItem[]
  onExit: () => void
  /** Embedded use (Repasar): hand the result back instead of showing the results screen. */
  onComplete?: (result: QuizResult) => void
}) {
  useImmersive()
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState("")
  const [typed, setTyped] = useState("")
  const [checked, setChecked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [missed, setMissed] = useState<ExerciseItem[]>([])
  const [done, setDone] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)

  const item = items[idx]
  const isChoice = item.type === "choice"
  const answer = isChoice ? selected : typed
  const hint = getTopic(item.topicId)?.blurb

  const check = () => {
    if (checked || !answer.trim()) return
    const correct = gradeAnswer(item, answer)
    setWasCorrect(correct)
    setChecked(true)
    if (correct) {
      setCorrectCount((c) => c + 1)
      playCorrect()
    } else {
      setMissed((m) => [...m, item])
    }
    recordAttempt({
      itemId: item.id,
      topicId: item.topicId,
      format: item.type,
      correct,
      answerGiven: answer,
    })
  }

  const next = () => {
    if (idx + 1 >= items.length) {
      if (onComplete) {
        onComplete({ correct: correctCount, total: items.length, missed })
        return
      }
      setDone(true)
      playFinish()
      return
    }
    setIdx(idx + 1)
    setSelected("")
    setTyped("")
    setChecked(false)
    setHintOpen(false)
  }

  // Enter drives the whole quiz from the keyboard: check the answer, then (once
  // checked) advance — so on desktop it's type, Enter, Enter, type, Enter, Enter.
  // A window listener is used (not the input's own onKeyDown) because the input
  // disables after checking and a disabled field stops receiving key events.
  const advanceRef = useRef<() => void>(() => {})
  advanceRef.current = () => {
    if (done) onExit()
    else if (!checked) {
      if (answer.trim()) check()
    } else next()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return
      e.preventDefault()
      advanceRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const atLast = idx + 1 >= items.length
  const topicIds = useMemo(() => [...new Set(items.map((i) => i.topicId))], [items])
  // The bridge's save action is the screen's one green block when it exists;
  // otherwise "Volver a los temas" keeps the green.
  const hasBridgePhrases = useMemo(() => practicePhrasesForTopics(topicIds).length > 0, [topicIds])

  // Full-screen focused view (covers the bottom nav, like the chat screen). The
  // action button lives in a flex-shrink-0 footer so it stays pinned above the
  // bottom bar and — thanks to `interactiveWidget: resizes-content` (see the
  // root viewport config) shrinking this fixed container — above the keyboard.
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-lg flex-col bg-background">
      {/* compact header + progress track */}
      <div
        className="flex-shrink-0 px-[22px] pb-2"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-center gap-3.5">
          <button
            onClick={onExit}
            aria-label="Salir de la práctica"
            className="clay-card flex h-9 w-9 items-center justify-center rounded-[13px] text-ink"
          >
            <DuoIcon name="volver" size={19} />
          </button>
          <p className="text-[15px] font-semibold text-ink">{title}</p>
        </div>
        {!done && (
          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-lip">
              <div
                className="h-full rounded-full bg-green transition-all duration-300"
                style={{ width: `${Math.max(4, (idx / items.length) * 100)}%` }}
              />
            </div>
            <p className="smallcaps mt-2.5 text-[12px] tracking-[.14em] text-ink-muted">
              Pregunta {idx + 1} de {items.length}
            </p>
          </div>
        )}
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-[22px] py-6 text-center">
          <DuoIcon name="logrado" size={40} className="text-green" />
          <ResultsSummary items={items} missed={missed} correctCount={correctCount} />
          <PracticeBridge topicIds={topicIds} />
          {hasBridgePhrases ? (
            <button
              onClick={onExit}
              className="flex h-11 items-center px-4 text-[14.5px] font-medium text-ink-muted underline underline-offset-4"
            >
              Volver a los temas
            </button>
          ) : (
            <button
              onClick={onExit}
              className="clay-green mt-2 h-14 rounded-full px-8 text-base font-semibold text-cream"
            >
              Volver a los temas
            </button>
          )}
        </div>
      ) : (
        <>
          {/* the prompt is anchored top — no floating in a half-empty screen */}
          <div className="flex-1 overflow-y-auto px-[22px]">
            <div className="mb-7 mt-4">
              <PromptWithBlank prompt={item.prompt} />
              {item.promptEnglish && (
                <p className="mt-2.5 font-serif text-[13.5px] italic text-ink-muted">{item.promptEnglish}</p>
              )}
            </div>

            {item.type === "choice" ? (
              <div className="space-y-[11px]">
                {item.options.map((opt) => {
                  const isSel = selected === opt
                  const isRight = checked && acceptedAnswers(item).includes(opt)
                  const isWrongPick = checked && isSel && !wasCorrect
                  return (
                    <button
                      key={opt}
                      disabled={checked}
                      onClick={() => setSelected(opt)}
                      className={`flex min-h-[62px] w-full items-center justify-between rounded-[20px] px-5 text-left transition-all duration-[120ms] ${
                        isRight || (isSel && !checked)
                          ? "bg-[#EAF1EA]"
                          : isWrongPick
                            ? "bg-terracotta-tint"
                            : "clay-card"
                      }`}
                      style={
                        isRight || (isSel && !checked)
                          ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 3px 0 #CFDECF" }
                          : isWrongPick
                            ? { boxShadow: "inset 0 0 0 1.5px var(--hb-terracotta)" }
                            : undefined
                      }
                    >
                      <span className={`font-serif text-[22px] ${isRight || (isSel && !checked) ? "text-green" : isWrongPick ? "text-terracotta-ink" : "text-ink"}`}>
                        {opt}
                      </span>
                      {(isRight || (isSel && !checked)) && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green">
                          <DuoIcon name="check" size={14} className="text-cream" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <input
                type="text"
                value={typed}
                disabled={checked}
                onChange={(e) => setTyped(e.target.value)}
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Escribe tu respuesta…"
                className="clay-recessed h-14 w-full rounded-[18px] px-5 font-serif text-lg text-ink outline-none placeholder:font-sans placeholder:text-[15px] placeholder:text-ink-muted focus:ring-1 focus:ring-green disabled:opacity-100"
              />
            )}

            {/* the hint, folded away until asked for */}
            {hint && !checked && (
              <div className="mt-[26px]">
                {hintOpen ? (
                  <div className="anim-settle flex gap-3 rounded-[20px] bg-sunken p-4">
                    <DuoIcon name="pista" size={20} className="mt-px flex-none" />
                    <div className="flex flex-col gap-[3px]">
                      <span className="text-[13.5px] font-semibold text-ink">Pista</span>
                      <span className="text-[13px] leading-normal text-ink-muted">{hint}</span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setHintOpen(true)}
                    className="press-chip flex items-center gap-2 px-1 text-[13.5px] font-medium text-ink-muted"
                  >
                    <DuoIcon name="pista" size={16} />
                    Ver pista
                  </button>
                )}
              </div>
            )}

            {checked && (
              <div
                className={`anim-settle mb-2 mt-5 rounded-[20px] p-4 ${wasCorrect ? "bg-green-tint" : "bg-terracotta-tint"}`}
              >
                <div className="flex items-start gap-[9px]">
                  {wasCorrect ? (
                    <DuoIcon name="logrado" size={18} className="mt-px flex-none text-green" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-px flex-none" aria-hidden>
                      <circle cx="12" cy="12" r="9" fill="#C4633E" />
                      <path
                        d="m8.2 12.4 2.6 2.6 5-5.2"
                        stroke="#FFF6F1"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex flex-col gap-1">
                    <p className={`text-sm font-semibold ${wasCorrect ? "text-ink" : "text-terracotta-ink"}`}>
                      {wasCorrect ? "¡Eso es!" : <>Mejor: “{acceptedAnswers(item)[0]}”.</>}
                    </p>
                    <p className={`text-[13px] leading-normal ${wasCorrect ? "text-ink-muted" : "text-terracotta-ink"}`}>
                      {item.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comprobar pinned above the keyboard — never floating mid-screen */}
          <div
            className="flex-shrink-0 border-t border-rule bg-background px-[22px] pt-4"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            {checked ? (
              <button
                onClick={next}
                className="clay-green h-14 w-full rounded-full text-base font-semibold text-cream"
              >
                {atLast ? "Ver resultados" : "Siguiente"}
              </button>
            ) : (
              <button
                onClick={check}
                disabled={!answer.trim()}
                className="clay-green h-14 w-full rounded-full text-base font-semibold text-cream disabled:opacity-40"
              >
                Comprobar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// A calm results summary: what went well first, then what to try next. The
// raw count stays, small and secondary. No big score numeral.
export function ResultsSummary({
  items,
  missed,
  correctCount,
}: {
  items: ExerciseItem[]
  missed: ExerciseItem[]
  correctCount: number
}) {
  const total = items.length
  const ratio = total ? correctCount / total : 0
  const heading = missed.length === 0 ? "Te salió todo" : ratio >= 0.7 ? "Vas muy bien" : ratio >= 0.4 ? "Vas bien" : "Buen comienzo"

  const topicName = (id: string) => getTopic(id)?.spanish ?? getTopic(id)?.title ?? id
  const topicIds = [...new Set(items.map((i) => i.topicId))]
  const missedTopics = [...new Set(missed.map((i) => i.topicId))]
  const solidTopics = topicIds.filter((id) => !missedTopics.includes(id))

  let well: string
  let next: string
  if (topicIds.length > 1) {
    well = solidTopics.length
      ? `Lo más firme: ${solidTopics.slice(0, 2).map(topicName).join(" y ")}.`
      : `${correctCount === 1 ? "Una te salió" : `${correctCount} te salieron`} a la primera.`
    // The topic with the most misses is the one to come back to.
    const counts = missedTopics.map((id) => [id, missed.filter((m) => m.topicId === id).length] as const)
    const weakest = counts.sort((a, b) => b[1] - a[1])[0]?.[0]
    next = weakest ? `Para la próxima: ${topicName(weakest)}.` : "Vuelve en unos días para que se asiente."
  } else {
    well =
      missed.length === 0
        ? "Todas a la primera."
        : correctCount > 0
          ? `${correctCount === 1 ? "Una te salió" : `${correctCount} te salieron`} a la primera.`
          : "Ya viste cómo funciona; la segunda vuelta es más fácil."
    next =
      missed.length === 0
        ? "Vuelve en unos días para que se asiente."
        : `Para la próxima: mira la pista antes de ${missed.length === 1 ? "la que se te escapó" : `las ${missed.length} que se te escaparon`}.`
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <p className="font-serif text-[28px] tracking-[-0.015em] text-ink">{heading}</p>
      <p className="max-w-[300px] text-[14.5px] leading-relaxed text-ink">{well}</p>
      <p className="max-w-[300px] text-[14.5px] leading-relaxed text-ink-muted">{next}</p>
      <p className="mt-1 text-[12.5px] text-ink-muted">
        {correctCount} de {total} a la primera
      </p>
    </div>
  )
}

// The results-screen bridge out of the quiz: topics with a practice set let
// the learner save conversation-ready phrases into the library (the seeded
// charla does the prompting from there, see lib/exercises/practice-phrases.ts)
// and, where the topic has a Palabras pack, send them to its flashcards.
export function PracticeBridge({ topicIds }: { topicIds: string[] }) {
  const [phrasesAdded, setPhrasesAdded] = useState<number | null>(null)
  const phrases = useMemo(() => practicePhrasesForTopics(topicIds), [topicIds])
  const pack = useMemo(() => practicePackForTopics(topicIds), [topicIds])
  if (phrases.length === 0 && !pack) return null

  // addPhrase dedupes by normalized text, so repeating a quiz only adds what
  // isn't already there.
  const savePhrases = () =>
    setPhrasesAdded(
      phrases.filter(
        (p) => addPhrase({ text: p.text, translation: p.translation, source: "generated" }) !== null,
      ).length,
    )

  return (
    <div className="clay-static mt-3 w-full rounded-[22px] p-5 text-left">
      <p className="smallcaps text-ink-muted">Llévalo a tu día</p>

      {phrases.length > 0 &&
        (phrasesAdded === null ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Guarda {phrases.length} frases en tu biblioteca. Elena las va a ir usando en tus
              próximas charlas hasta que te salgan solas.
            </p>
            <button
              onClick={savePhrases}
              className="clay-green mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-cream"
            >
              <DuoIcon name="frases" size={15} />
              Guardar las frases
            </button>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            {phrasesAdded > 0
              ? `${phrasesAdded === 1 ? "1 frase nueva" : `${phrasesAdded} frases nuevas`} en tu biblioteca. Aparecen en Frases y en tu próxima charla.`
              : "Ya tenías todas las frases. Aparecen en tu próxima charla."}
          </p>
        ))}

      {pack && (
        <div className={phrases.length > 0 ? "mt-4 border-t border-rule pt-4" : ""}>
          <p className="text-sm leading-relaxed text-ink-muted">
            Las palabras están en el pack {packLabel(pack)}, listas para repasar con tarjetas.
          </p>
          <Link
            href={`/app/palabras/${pack}`}
            className="press-chip mt-3 flex w-full items-center justify-center gap-2 rounded-[16px] bg-sunken py-3 text-sm font-medium text-ink"
          >
            <DuoIcon name="repasar" size={15} />
            Ver las tarjetas
          </Link>
        </div>
      )}
    </div>
  )
}
