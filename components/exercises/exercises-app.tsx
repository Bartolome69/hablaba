"use client"

// Práctica, Clay + calm. Topic states read as a three-segment bar plus a
// label (Confiado / Ahí va / Repasalo / Sin empezar) — scannable without
// reading each row, and no amber/red status dots. The question screen anchors
// the prompt at the top and pins Comprobar above the keyboard, so there's
// never a button floating in an empty half-screen.

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, grammarIcon } from "@/components/icons"
import { coveredTopics, itemsForTopic, type CoveredTopic } from "@/lib/exercises/content"
import { gradeAnswer, isClientGradable, acceptedAnswers } from "@/lib/exercises/grade"
import { playCorrect, playFinish } from "@/lib/exercises/sound"
import { recordAttempt, topicMastery } from "@/lib/exercises/store"
import { getTopic } from "@/lib/exercises/taxonomy"
import type { ExerciseItem, GrammarArea, MasteryBand, TopicMastery } from "@/lib/exercises/types"

const SESSION_SIZE = 10

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const BAND_LABEL: Record<MasteryBand, string> = {
  untested: "Sin empezar",
  mislearned: "Repasalo",
  learning: "Ahí va",
  confident: "Confiado",
}

const BAND_SEGMENTS: Record<MasteryBand, number> = {
  untested: 0,
  mislearned: 1,
  learning: 2,
  confident: 3,
}

// Topics group by their taxonomy grammar area — learner-facing Spanish names,
// ordered from "the verbs themselves" outward.
const AREA_ORDER: GrammarArea[] = [
  "verbs",
  "tenses",
  "mood",
  "prepositions",
  "pronouns",
  "comparison",
  "usage",
]

const AREA_NAMES: Record<GrammarArea, string> = {
  verbs: "Verbos",
  tenses: "Tiempos verbales",
  mood: "Subjuntivo y mandatos",
  prepositions: "Preposiciones",
  pronouns: "Pronombres",
  comparison: "Comparaciones",
  usage: "Palabras confusas",
}

type View = { name: "home" } | { name: "quiz"; title: string; items: ExerciseItem[] }

export function ExercisesApp() {
  const covered = useMemo(() => coveredTopics(), [])
  const [view, setView] = useState<View>({ name: "home" })
  const [mastery, setMastery] = useState<Record<string, TopicMastery>>({})

  const refreshMastery = () => {
    const m: Record<string, TopicMastery> = {}
    for (const c of covered) m[c.topic.id] = topicMastery(c.topic.id)
    setMastery(m)
  }

  const searchParams = useSearchParams()

  // localStorage is client-only — read after mount to avoid hydration mismatch
  useEffect(() => {
    refreshMastery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startTopic = (topicId: string, title: string) => {
    const items = shuffle(itemsForTopic(topicId).filter(isClientGradable)).slice(0, SESSION_SIZE)
    if (items.length) setView({ name: "quiz", title, items })
  }

  // ?topic=<taxonomy id> jumps straight into that topic's quiz — the deep link
  // the session review uses ("Practicar →"). Falls back to the normal topic
  // map when the topic has no practice content yet.
  const requestedTopic = searchParams.get("topic")
  useEffect(() => {
    if (!requestedTopic) return
    const match = covered.find((c) => c.topic.id === requestedTopic)
    if (match) startTopic(match.topic.id, match.topic.title)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTopic])

  const startMixed = () => {
    // Weakest-first: untested topics sort ahead of low scores.
    const rank = (id: string) => {
      const m = mastery[id]
      if (!m || m.attemptCount === 0) return -1
      return m.score
    }
    const ranked = [...covered].sort((a, b) => rank(a.topic.id) - rank(b.topic.id))
    const pool = ranked.slice(0, 3).flatMap((c) => itemsForTopic(c.topic.id).filter(isClientGradable))
    const items = shuffle(pool).slice(0, SESSION_SIZE)
    if (items.length) setView({ name: "quiz", title: "Ponerme a prueba", items })
  }

  if (view.name === "quiz") {
    return (
      <Quiz
        title={view.title}
        items={view.items}
        onExit={() => {
          refreshMastery()
          setView({ name: "home" })
        }}
      />
    )
  }

  const totalQuestions = covered.reduce((n, c) => n + c.quizCount, 0)

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Práctica" subtitle="Poné a prueba la gramática de tus apuntes" />

      {/* The one green block: mixed questions from the weakest topics. */}
      <button onClick={startMixed} className="clay-green-hero flex w-full items-center gap-3.5 rounded-[26px] p-[18px] text-left">
        <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-green-well">
          <DuoIcon name="quiz" size={24} className="text-cream" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="font-serif text-[22px] tracking-[-0.01em] text-cream">Ponerme a prueba</p>
          <p className="text-[12.5px] text-green-on-dark">Preguntas mezcladas de tus temas flojos</p>
        </div>
      </button>

      <div className="mt-[26px] flex items-baseline justify-between px-1">
        <h2 className="font-serif text-[19px] text-ink">Temas</h2>
        <span className="text-[12.5px] text-ink-soft">{totalQuestions} preguntas</span>
      </div>

      {AREA_ORDER.map((area) => {
        const group = covered.filter((c) => c.topic.area === area)
        if (group.length === 0) return null
        return (
          <section key={area} className="mt-5">
            <h3 className="smallcaps px-1 pb-2.5 text-ink-faint">{AREA_NAMES[area]}</h3>
            <div className="stagger-children space-y-2">
              {group.map((c) => (
                <TopicCard
                  key={c.topic.id}
                  covered={c}
                  mastery={mastery[c.topic.id]}
                  onClick={() => startTopic(c.topic.id, c.topic.title)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function TopicCard({
  covered,
  mastery,
  onClick,
}: {
  covered: CoveredTopic
  mastery?: TopicMastery
  onClick: () => void
}) {
  const band: MasteryBand = mastery?.band ?? "untested"
  const filled = BAND_SEGMENTS[band]
  return (
    <button onClick={onClick} className="clay-card flex w-full items-center gap-[13px] rounded-[18px] p-3.5 text-left">
      <div className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
        <DuoIcon name={grammarIcon(covered.topic.id)} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{covered.topic.title}</p>
        <p className="truncate font-serif text-[13.5px] italic text-ink-soft">
          {covered.topic.spanish}
        </p>
      </div>
      <div className="flex flex-none flex-col items-end gap-1.5">
        <span className="text-[12.5px] text-ink-soft">
          <span className="font-medium text-ink-faint">{covered.topic.cefr}</span> · {covered.quizCount} P
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex items-center gap-[3px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-[5px] w-[9px] rounded-full ${i < filled ? "bg-green" : "bg-segment-empty"}`}
              />
            ))}
          </span>
          <span className="text-[11.5px] text-ink-soft">{BAND_LABEL[band]}</span>
        </span>
      </div>
    </button>
  )
}

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

function Quiz({
  title,
  items,
  onExit,
}: {
  title: string
  items: ExerciseItem[]
  onExit: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState("")
  const [typed, setTyped] = useState("")
  const [checked, setChecked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
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
  const pct = items.length ? Math.round((correctCount / items.length) * 100) : 0

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
            <p className="smallcaps mt-2.5 text-[12px] tracking-[.14em] text-ink-faint">
              Pregunta {idx + 1} de {items.length}
            </p>
          </div>
        )}
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-[22px] text-center">
          <DuoIcon name="logrado" size={44} className="text-green" />
          <p className="font-serif text-5xl text-ink">
            {correctCount}/{items.length}
          </p>
          <p className="text-sm text-ink-muted">
            {pct}% correctas{pct === 100 ? ". ¡Perfecto!" : ""}
          </p>
          <button
            onClick={onExit}
            className="clay-green mt-4 h-14 rounded-full px-8 text-base font-semibold text-cream"
          >
            Volver a los temas
          </button>
        </div>
      ) : (
        <>
          {/* the prompt is anchored top — no floating in a half-empty screen */}
          <div className="flex-1 overflow-y-auto px-[22px]">
            <div className="mb-7 mt-4">
              <PromptWithBlank prompt={item.prompt} />
              {item.promptEnglish && (
                <p className="mt-2.5 font-serif text-[13.5px] italic text-ink-soft">{item.promptEnglish}</p>
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
                placeholder="Escribí tu respuesta…"
                className="clay-recessed h-14 w-full rounded-[18px] px-5 font-serif text-lg text-ink outline-none placeholder:font-sans placeholder:text-[15px] placeholder:text-ink-faint focus:ring-1 focus:ring-green disabled:opacity-100"
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
                      {wasCorrect ? "¡Eso es!" : <>Mejor: «{acceptedAnswers(item)[0]}».</>}
                    </p>
                    <p className={`text-[13px] leading-normal ${wasCorrect ? "text-ink-muted" : "text-[#96604A]"}`}>
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
