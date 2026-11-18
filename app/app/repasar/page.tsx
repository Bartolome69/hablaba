"use client"

// Repasar: one session for job 5 (refresh Phase 3). Cards, then three grammar
// questions, then one of your phrases, then a calm summary. One tap from Hoy.
// Full screen and immersive (no nav, no ask bar); "Salir" leaves at any point
// and everything answered so far is already saved.

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DuoIcon } from "@/components/icons"
import { PracticeBridge, Quiz, type QuizResult } from "@/components/exercises/quiz"
import { PhraseRecall } from "@/components/review/phrase-recall"
import { VocabDeck } from "@/components/vocab/vocab-deck"
import { practicePhrasesForTopics } from "@/lib/exercises/practice-phrases"
import { runMigrations } from "@/lib/migrations"
import { buildRepasarPlan, isEmptyPlan, recordPhraseRecall, type RepasarPlan } from "@/lib/review/session"
import { useImmersive } from "@/lib/ui/immersive"

type Step = "cards" | "grammar" | "phrase" | "done"

interface Results {
  cards?: { cards: number; firstTry: number }
  grammar?: QuizResult
  phrase?: { text: string; gotIt: boolean }
}

export default function RepasarPage() {
  useImmersive()
  const router = useRouter()
  const [plan, setPlan] = useState<RepasarPlan | null>(null)
  const [step, setStep] = useState<Step>("cards")
  const [results, setResults] = useState<Results>({})

  // localStorage is client-only: build the plan after mount.
  useEffect(() => {
    runMigrations()
    const p = buildRepasarPlan()
    setPlan(p)
    setStep(p.cards.length ? "cards" : p.grammar ? "grammar" : p.phrase ? "phrase" : "done")
  }, [])

  const steps = useMemo<Step[]>(
    () =>
      plan
        ? ([plan.cards.length ? "cards" : null, plan.grammar ? "grammar" : null, plan.phrase ? "phrase" : null].filter(
            Boolean,
          ) as Step[])
        : [],
    [plan],
  )

  const advance = useCallback(
    (from: Step) => {
      const i = steps.indexOf(from)
      setStep(steps[i + 1] ?? "done")
    },
    [steps],
  )

  const exit = useCallback(() => router.push("/app/today"), [router])

  if (!plan) return <div className="min-h-dvh bg-background" />

  if (isEmptyPlan(plan)) {
    return (
      <Shell onExit={exit} label="Repasar">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <DuoIcon name="logrado" size={40} className="text-green" />
          <p className="mt-4 font-serif text-[28px] text-ink">Estás al día</p>
          <p className="mt-2 max-w-[280px] text-[14px] leading-relaxed text-ink-muted">
            No hay nada para repasar ahora. Vuelve mañana, o charla un rato con Elena.
          </p>
          <Link href="/app/today" className="clay-green mt-7 flex h-12 items-center rounded-full px-7 text-[15px] font-semibold text-cream">
            Volver a Hoy
          </Link>
        </div>
      </Shell>
    )
  }

  const position = steps.indexOf(step) + 1
  const stepLabel = step === "cards" ? "Tarjetas" : step === "grammar" ? "Gramática" : step === "phrase" ? "Una frase" : ""

  if (step === "grammar" && plan.grammar) {
    // The quiz brings its own full-screen chrome (header, progress, Comprobar).
    return (
      <Quiz
        title={`Repasar · ${plan.grammar.topic.label}`}
        items={plan.grammar.items}
        onExit={exit}
        onComplete={(r) => {
          setResults((x) => ({ ...x, grammar: r }))
          advance("grammar")
        }}
      />
    )
  }

  return (
    <Shell onExit={exit} label={step === "done" ? "Repasar" : `${stepLabel} · ${position} de ${steps.length}`}>
      {step === "cards" && (
        <VocabDeck
          words={plan.cards}
          onExit={exit}
          onFinished={() => advance("cards")}
          onComplete={(r) => {
            setResults((x) => ({ ...x, cards: r }))
            advance("cards")
          }}
        />
      )}
      {step === "phrase" && plan.phrase && (
        <PhraseRecall
          phrase={plan.phrase}
          onDone={(gotIt) => {
            recordPhraseRecall(plan.phrase!.id)
            setResults((x) => ({ ...x, phrase: { text: plan.phrase!.text, gotIt } }))
            advance("phrase")
          }}
        />
      )}
      {step === "done" && <Summary plan={plan} results={results} />}
    </Shell>
  )
}

function Shell({ onExit, label, children }: { onExit: () => void; label: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-lg flex-col bg-background">
      <div
        className="flex flex-shrink-0 items-center gap-3.5 px-[22px] pb-3"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <button
          onClick={onExit}
          aria-label="Salir de Repasar"
          className="clay-card flex h-11 w-11 items-center justify-center rounded-[14px] text-ink"
        >
          <DuoIcon name="volver" size={19} />
        </button>
        <p className="text-[15px] font-semibold text-ink">{label}</p>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-[22px] pb-8">{children}</div>
    </div>
  )
}

// What stuck, then what's next. Counts stay small; no score numeral. The
// "Guardar las frases" bridge appears when the grammar topic has practice
// phrases, and is then the screen's one green block.
function Summary({ plan, results }: { plan: RepasarPlan; results: Results }) {
  const lines: string[] = []
  const next: string[] = []
  const c = results.cards
  if (c) {
    lines.push(
      c.firstTry === c.cards
        ? `Todas las tarjetas a la primera (${c.cards}).`
        : `${c.firstTry} de ${c.cards} tarjetas a la primera.`,
    )
    if (c.firstTry < c.cards) next.push("Las que se te escaparon vuelven pronto.")
  }
  const g = results.grammar
  if (g && plan.grammar) {
    const label = plan.grammar.topic.label.toLowerCase()
    lines.push(g.correct === g.total ? `${sentenceStart(label)}: todo bien.` : `${sentenceStart(label)}: ${g.correct} de ${g.total}.`)
    if (g.missed.length) next.push(`Mira la pista de ${label} antes de la próxima.`)
  }
  const p = results.phrase
  if (p) {
    lines.push(p.gotIt ? `Te salió “${p.text}”.` : `“${p.text}” vuelve en tu próxima charla.`)
  }
  if (!next.length) next.push("Vuelve mañana: lo que sabes ya está programado más adelante.")

  const topicIds = plan.grammar ? [plan.grammar.topic.id] : []
  const hasBridge = practicePhrasesForTopics(topicIds).length > 0

  return (
    <div className="flex flex-1 flex-col items-center pt-6 text-center">
      <DuoIcon name="logrado" size={40} className="text-green" />
      <p className="mt-4 font-serif text-[28px] tracking-[-0.015em] text-ink">Listo por hoy</p>
      <div className="mt-3 flex max-w-[320px] flex-col gap-1.5">
        {lines.map((l) => (
          <p key={l} className="text-[14.5px] leading-relaxed text-ink">
            {l}
          </p>
        ))}
        {next.map((l) => (
          <p key={l} className="text-[14px] leading-relaxed text-ink-muted">
            {l}
          </p>
        ))}
      </div>
      {hasBridge && <PracticeBridge topicIds={topicIds} />}
      {hasBridge ? (
        <Link href="/app/today" className="mt-3 flex h-11 items-center px-4 text-[14.5px] font-medium text-ink-muted underline underline-offset-4">
          Volver a Hoy
        </Link>
      ) : (
        <Link href="/app/today" className="clay-green mt-7 flex h-12 items-center rounded-full px-7 text-[15px] font-semibold text-cream">
          Volver a Hoy
        </Link>
      )}
    </div>
  )
}

const sentenceStart = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
