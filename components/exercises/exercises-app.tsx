"use client"

import { useEffect, useMemo, useState } from "react"
import { Sparkles, ArrowLeft, Check, X } from "lucide-react"
import { AppHeader } from "@/components/home/app-header"
import { coveredTopics, itemsForTopic, type CoveredTopic } from "@/lib/exercises/content"
import { gradeAnswer, isClientGradable, acceptedAnswers } from "@/lib/exercises/grade"
import { recordAttempt, topicMastery } from "@/lib/exercises/store"
import type { ExerciseItem, MasteryBand, TopicMastery } from "@/lib/exercises/types"

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
  untested: "Not started",
  mislearned: "Needs work",
  learning: "Getting there",
  confident: "Confident",
}

const BAND_DOT: Record<MasteryBand, string> = {
  untested: "bg-muted-foreground/40",
  mislearned: "bg-red-500",
  learning: "bg-amber-500",
  confident: "bg-emerald-500",
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

  // localStorage is client-only — read after mount to avoid hydration mismatch
  useEffect(() => {
    refreshMastery()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startTopic = (topicId: string, title: string) => {
    const items = shuffle(itemsForTopic(topicId).filter(isClientGradable)).slice(0, SESSION_SIZE)
    if (items.length) setView({ name: "quiz", title, items })
  }

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
    if (items.length) setView({ name: "quiz", title: "Mixed quiz", items })
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
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Exercises" subtitle="Test yourself on grammar from your handouts" />

      <button
        onClick={startMixed}
        className="w-full mb-8 flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold">Quiz me</p>
          <p className="text-xs opacity-75">Mixed questions from your weakest topics</p>
        </div>
      </button>

      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-serif text-base text-foreground">Topics</h2>
        <span className="text-xs text-muted-foreground">{totalQuestions} questions</span>
      </div>
      <div className="space-y-2">
        {covered.map((c) => (
          <TopicCard
            key={c.topic.id}
            covered={c}
            mastery={mastery[c.topic.id]}
            onClick={() => startTopic(c.topic.id, c.topic.title)}
          />
        ))}
      </div>
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
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left hover:bg-secondary/50 active:scale-[0.98] transition-all"
    >
      <span className="text-2xl flex-shrink-0">{covered.topic.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{covered.topic.title}</p>
        <p className="text-xs text-muted-foreground font-serif italic truncate">
          {covered.topic.spanish}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-xs text-muted-foreground">{covered.quizCount} Q</span>
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${BAND_DOT[band]}`} />
          <span className="text-[11px] text-muted-foreground">{BAND_LABEL[band]}</span>
        </span>
      </div>
    </button>
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

  const item = items[idx]
  const isChoice = item.type === "choice"
  const answer = isChoice ? selected : typed

  const check = () => {
    if (checked || !answer.trim()) return
    const correct = gradeAnswer(item, answer)
    setWasCorrect(correct)
    setChecked(true)
    if (correct) setCorrectCount((c) => c + 1)
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
      return
    }
    setIdx(idx + 1)
    setSelected("")
    setTyped("")
    setChecked(false)
  }

  if (done) {
    const pct = Math.round((correctCount / items.length) * 100)
    return (
      <div className="min-h-dvh bg-background px-4 py-6 pb-24 flex flex-col">
        <QuizTopBar title={title} onExit={onExit} />
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          <p className="font-serif text-5xl text-foreground">
            {correctCount}/{items.length}
          </p>
          <p className="text-sm text-muted-foreground">
            {pct}% correct{pct === 100 ? " — ¡perfecto!" : ""}
          </p>
          <button
            onClick={onExit}
            className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Back to topics
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 flex flex-col">
      <QuizTopBar title={title} onExit={onExit} />

      {/* progress */}
      <div className="mt-4 mb-6">
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${(idx / items.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Question {idx + 1} of {items.length}
        </p>
      </div>

      {/* prompt */}
      <div className="mb-6">
        <p className="text-lg text-foreground leading-relaxed">{item.prompt}</p>
        {item.promptEnglish && (
          <p className="mt-1 text-sm text-muted-foreground italic">{item.promptEnglish}</p>
        )}
      </div>

      {/* input */}
      <div className="flex-1">
        {isChoice ? (
          <div className="space-y-2">
            {item.options.map((opt) => {
              const isSel = selected === opt
              const isRight = checked && acceptedAnswers(item).includes(opt)
              const isWrongPick = checked && isSel && !wasCorrect
              return (
                <button
                  key={opt}
                  disabled={checked}
                  onClick={() => setSelected(opt)}
                  className={`w-full p-4 rounded-2xl border text-left text-sm transition-all active:scale-[0.98] ${
                    isRight
                      ? "border-emerald-500 bg-emerald-500/10 text-foreground"
                      : isWrongPick
                        ? "border-red-500 bg-red-500/10 text-foreground"
                        : isSel
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {opt}
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
            onKeyDown={(e) => {
              if (e.key === "Enter") (checked ? next() : check())
            }}
            autoFocus
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type your answer…"
            className="w-full p-4 rounded-2xl border border-border bg-card text-foreground text-sm outline-none focus:border-primary disabled:opacity-100"
          />
        )}

        {/* feedback */}
        {checked && (
          <div
            className={`mt-4 p-4 rounded-2xl text-sm ${
              wasCorrect ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}
          >
            <p className="flex items-center gap-2 font-medium text-foreground">
              {wasCorrect ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" /> Correct
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-red-600" /> Not quite —{" "}
                  <span className="font-semibold">{acceptedAnswers(item)[0]}</span>
                </>
              )}
            </p>
            <p className="mt-1.5 text-muted-foreground">{item.explanation}</p>
          </div>
        )}
      </div>

      {/* action */}
      <div className="pt-4">
        {checked ? (
          <button
            onClick={next}
            autoFocus
            className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {idx + 1 >= items.length ? "See results" : "Next"}
          </button>
        ) : (
          <button
            onClick={check}
            disabled={!answer.trim()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:active:scale-100"
          >
            Check
          </button>
        )}
      </div>
    </div>
  )
}

function QuizTopBar({ title, onExit }: { title: string; onExit: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onExit}
        className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        aria-label="Exit quiz"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <p className="text-sm font-medium text-foreground">{title}</p>
    </div>
  )
}
