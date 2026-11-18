"use client"

// Práctica, Clay + calm. Topic states read as a three-segment bar plus a
// label (Confiado / Ahí va / Repasalo / Sin empezar) — scannable without
// reading each row, and no amber/red status dots. The question screen anchors
// the prompt at the top and pins Comprobar above the keyboard, so there's
// never a button floating in an empty half-screen.

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, grammarIcon } from "@/components/icons"
import { Quiz } from "@/components/exercises/quiz"
import { coveredTopics, itemsForTopic, totalQuestionCount, type CoveredTopic } from "@/lib/exercises/content"
import { isClientGradable } from "@/lib/exercises/grade"
import { topicMastery } from "@/lib/exercises/store"
import { shuffle } from "@/lib/utils"
import type { ExerciseItem, GrammarArea, MasteryBand, TopicMastery } from "@/lib/exercises/types"

const SESSION_SIZE = 10


const BAND_LABEL: Record<MasteryBand, string> = {
  untested: "Sin empezar",
  mislearned: "Repásalo",
  learning: "Ahí va",
  confident: "Confiado",
}

const BAND_SEGMENTS: Record<MasteryBand, number> = {
  untested: 0,
  mislearned: 1,
  learning: 2,
  confident: 3,
}

// Colour grading for the mastery bar, inside the palette: Repasalo is the
// state that matters (terracotta), Ahí va is green still warming up,
// Confiado is the full green. (Bart asked for the grading, Sep 2026 —
// mastery bars are the sanctioned exception to one-terracotta-per-screen.)
const BAND_FILL: Record<MasteryBand, string> = {
  untested: "",
  mislearned: "bg-terracotta",
  learning: "bg-green/55",
  confident: "bg-green",
}

type TopicSort = "area" | "flojos" | "olvidados"

// Weakest first is the default (QW8): it answers "what should I work on?".
const SORT_LABELS: Record<TopicSort, string> = {
  flojos: "Más flojos",
  area: "Por área",
  olvidados: "Sin practicar",
}

// Weakest first: proven-wrong beats never-tested beats still-learning.
const BAND_RANK: Record<MasteryBand, number> = {
  mislearned: 0,
  untested: 1,
  learning: 2,
  confident: 3,
}

/** "¿Hace cuánto practiqué esto?" — coarse on purpose; days are enough. */
function timeSince(iso: string | null | undefined): string {
  if (!iso) return "Nunca"
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return "Hoy"
  if (days === 1) return "Ayer"
  if (days < 7) return `Hace ${days} días`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? "Hace 1 semana" : `Hace ${weeks} semanas`
  const months = Math.floor(days / 30)
  return months <= 1 ? "Hace 1 mes" : `Hace ${months} meses`
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
  const [sort, setSort] = useState<TopicSort>("flojos")

  const changeSort = (s: TopicSort) => {
    setSort(s)
    try {
      localStorage.setItem("practica_sort", s)
    } catch {}
  }

  const refreshMastery = () => {
    const m: Record<string, TopicMastery> = {}
    for (const c of covered) m[c.topic.id] = topicMastery(c.topic.id)
    setMastery(m)
  }

  const searchParams = useSearchParams()

  // localStorage is client-only — read after mount to avoid hydration mismatch
  useEffect(() => {
    refreshMastery()
    try {
      const saved = localStorage.getItem("practica_sort") as TopicSort | null
      if (saved && saved in SORT_LABELS) setSort(saved)
    } catch {}
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

  const totalQuestions = totalQuestionCount(covered)

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Práctica" subtitle="Pon a prueba la gramática de tus apuntes" />

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
        <span className="text-[12.5px] text-ink-muted">{totalQuestions} preguntas</span>
      </div>

      {/* Sort: grouped by area, weakest first, or longest un-practised first. */}
      <div className="mt-3 flex gap-2">
        {(Object.keys(SORT_LABELS) as TopicSort[]).map((s) => {
          const active = s === sort
          return (
            <button
              key={s}
              onClick={() => changeSort(s)}
              aria-pressed={active}
              className={`h-[34px] flex-none rounded-full px-3.5 text-[13px] font-medium transition-transform duration-[120ms] active:translate-y-[2px] ${
                active ? "bg-green text-cream" : "bg-sunken-2 text-ink"
              }`}
              style={{
                boxShadow: active ? "0 3px 0 var(--hb-green-press)" : "0 2px 0 var(--hb-lip-sunken)",
              }}
            >
              {SORT_LABELS[s]}
            </button>
          )
        })}
      </div>

      {sort === "area" ? (
        AREA_ORDER.map((area) => {
          const group = covered.filter((c) => c.topic.area === area)
          if (group.length === 0) return null
          return (
            <section key={area} className="mt-5">
              <h3 className="smallcaps px-1 pb-2.5 text-ink-muted">{AREA_NAMES[area]}</h3>
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
        })
      ) : (
        <div className="stagger-children mt-4 space-y-2">
          {[...covered]
            .sort((a, b) => {
              const ma = mastery[a.topic.id]
              const mb = mastery[b.topic.id]
              if (sort === "flojos") {
                const byRank =
                  BAND_RANK[ma?.band ?? "untested"] - BAND_RANK[mb?.band ?? "untested"]
                if (byRank !== 0) return byRank
                return (ma?.score ?? 0) - (mb?.score ?? 0)
              }
              // olvidados: never-practised first, then oldest attempt first.
              return (ma?.lastPracticedAt ?? "").localeCompare(mb?.lastPracticedAt ?? "")
            })
            .map((c) => (
              <TopicCard
                key={c.topic.id}
                covered={c}
                mastery={mastery[c.topic.id]}
                staleness={sort === "olvidados" ? timeSince(mastery[c.topic.id]?.lastPracticedAt) : undefined}
                onClick={() => startTopic(c.topic.id, c.topic.title)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function TopicCard({
  covered,
  mastery,
  staleness,
  onClick,
}: {
  covered: CoveredTopic
  mastery?: TopicMastery
  /** In the Sin practicar sort: "Hace 12 días" / "Nunca" replaces the CEFR line. */
  staleness?: string
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
        <p className="truncate font-serif text-[13.5px] italic text-ink-muted">
          {covered.topic.spanish}
        </p>
      </div>
      <div className="flex flex-none flex-col items-end gap-1.5">
        {staleness ? (
          <span className="text-[12.5px] font-medium text-ink-muted">{staleness}</span>
        ) : (
          <span className="text-[12.5px] text-ink-muted">
            <span className="font-medium text-ink-muted">{covered.topic.cefr}</span> · {covered.quizCount} P
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="flex items-center gap-[3px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`h-[5px] w-[9px] rounded-full ${i < filled ? BAND_FILL[band] : "bg-segment-empty"}`}
              />
            ))}
          </span>
          <span className={`text-[12px] ${band === "mislearned" ? "font-medium text-terracotta-ink" : "text-ink-muted"}`}>
            {BAND_LABEL[band]}
          </span>
        </span>
      </div>
    </button>
  )
}
