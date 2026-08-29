"use client"

// The on-page mini-quiz for /gramatica pages: three real questions from the
// topic's pack, graded in the browser, with the app's success ping. This is
// the page earning its search ranking — a visitor can practise before they've
// signed up for anything.

import { useState } from "react"
import Link from "next/link"
import { usePostHog } from "posthog-js/react"
import { DuoIcon } from "@/components/icons"
import { gradeAnswer, acceptedAnswers } from "@/lib/exercises/grade"
import { playCorrect, playFinish } from "@/lib/exercises/sound"
import type { ExerciseItem } from "@/lib/exercises/types"

function PromptWithBlank({ prompt }: { prompt: string }) {
  const parts = prompt.split(/_{2,}/)
  return (
    <p className="font-serif text-[24px] leading-[1.3] tracking-[-0.015em] text-ink text-pretty sm:text-[28px]">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="text-terracotta">___</span>}
        </span>
      ))}
    </p>
  )
}

export function TryIt({ items, topicId, topicTitle }: { items: ExerciseItem[]; topicId: string; topicTitle: string }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const posthog = usePostHog()

  if (items.length === 0) return null
  const item = items[idx]
  if (item.type !== "choice") return null
  const checked = picked !== null
  const wasCorrect = checked && gradeAnswer(item, picked)

  const pick = (opt: string) => {
    if (checked) return
    setPicked(opt)
    const correct = gradeAnswer(item, opt)
    if (correct) {
      setCorrectCount((c) => c + 1)
      playCorrect()
    }
    posthog?.capture("seo_tryit_answered", { topic: topicId, correct })
  }

  const next = () => {
    if (idx + 1 >= items.length) {
      setDone(true)
      playFinish()
      posthog?.capture("seo_tryit_completed", { topic: topicId, score: correctCount })
      return
    }
    setIdx(idx + 1)
    setPicked(null)
  }

  if (done) {
    return (
      <div className="clay-static rounded-[26px] p-6 text-center sm:p-8">
        <DuoIcon name="logrado" size={36} className="mx-auto text-green" />
        <p className="mt-3 font-serif text-3xl text-ink">
          {correctCount}/{items.length}
        </p>
        <p className="mt-1 text-sm text-ink-muted">
          {correctCount === items.length ? "¡Perfecto! Ready for the harder ones?" : "Good start — the full set will lock it in."}
        </p>
        <Link
          href={`/app/exercises?topic=${topicId}`}
          className="clay-green mt-5 inline-flex h-12 items-center justify-center rounded-full px-7 text-[15px] font-semibold text-cream"
        >
          Keep practising {topicTitle} free
        </Link>
      </div>
    )
  }

  return (
    <div className="clay-static rounded-[26px] p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="smallcaps text-ink-faint">Try it — question {idx + 1} of {items.length}</span>
        <span className="flex items-center gap-[3px]" aria-hidden>
          {items.map((_, i) => (
            <span key={i} className={`h-[5px] w-[14px] rounded-full ${i < idx || (i === idx && checked) ? "bg-green" : "bg-segment-empty"}`} />
          ))}
        </span>
      </div>

      <div className="mt-4">
        <PromptWithBlank prompt={item.prompt} />
        {item.promptEnglish && (
          <p className="mt-2 font-serif text-[13.5px] italic text-ink-soft">{item.promptEnglish}</p>
        )}
      </div>

      <div className="mt-5 space-y-2.5">
        {item.options.map((opt) => {
          const isPick = picked === opt
          const isRight = checked && acceptedAnswers(item).includes(opt)
          const isWrongPick = checked && isPick && !wasCorrect
          return (
            <button
              key={opt}
              disabled={checked}
              onClick={() => pick(opt)}
              className={`flex min-h-[54px] w-full items-center justify-between rounded-[18px] px-5 text-left transition-all duration-[120ms] ${
                isRight ? "bg-[#EAF1EA]" : isWrongPick ? "bg-terracotta-tint" : "clay-card"
              }`}
              style={
                isRight
                  ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 3px 0 #CFDECF" }
                  : isWrongPick
                    ? { boxShadow: "inset 0 0 0 1.5px var(--hb-terracotta)" }
                    : undefined
              }
            >
              <span className={`font-serif text-[19px] ${isRight ? "text-green" : isWrongPick ? "text-terracotta-ink" : "text-ink"}`}>
                {opt}
              </span>
              {isRight && (
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-green">
                  <DuoIcon name="check" size={14} className="text-cream" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {checked && (
        <div className={`anim-settle mt-4 rounded-[18px] p-4 ${wasCorrect ? "bg-green-tint" : "bg-terracotta-tint"}`}>
          <p className={`text-sm font-semibold ${wasCorrect ? "text-ink" : "text-terracotta-ink"}`}>
            {wasCorrect ? "¡Eso es!" : `Mejor: «${acceptedAnswers(item)[0]}».`}
          </p>
          <p className={`mt-1 text-[13px] leading-normal ${wasCorrect ? "text-ink-muted" : "text-[#96604A]"}`}>
            {item.explanation}
          </p>
        </div>
      )}

      {checked && (
        <button
          onClick={next}
          className="clay-green mt-4 h-12 w-full rounded-full text-[15px] font-semibold text-cream"
        >
          {idx + 1 >= items.length ? "See my score" : "Next question"}
        </button>
      )}
    </div>
  )
}
