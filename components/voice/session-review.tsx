"use client"

// The session review: 3–5 observations from the post-session analysis, framed
// encouragingly, corrections as original → corrected. Renders on the session
// detail view above the transcript.
//
// Grammar observations carry an exercises-taxonomy topic id in detail.tag, so
// they link straight into practice (/app/exercises?topic=<tag>). URL string
// only — module code never imports exercises code.
//
// Surface-agnostic: the caller passes its own `analyze` (the main app's reads
// lib/conversations/), so this component never knows whose conversation it's
// reviewing.

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { DuoIcon } from "@/components/icons"
import {
  isPracticeableTag,
  type VoiceObservationRecord,
  type VoiceObservationType,
} from "@/lib/voice/types"

const MAX_SHOWN = 5

const TYPE_LABELS: Record<VoiceObservationType, string> = {
  target_phrase_used: "¡Lo usaste!",
  error_grammar: "Un ajuste",
  avoidance: "Un desafío",
  repetition: "Variedad",
  code_switch: "En criollo",
}

// Celebrations first, then the work, then variety notes.
const TYPE_ORDER: VoiceObservationType[] = [
  "target_phrase_used",
  "error_grammar",
  "avoidance",
  "code_switch",
  "repetition",
]

type Status = "loading" | "ready" | "error"

export function SessionReview({
  sessionId,
  analyze,
}: {
  sessionId: string
  /** The surface's ensure-analysis function — runs it lazily if needed. */
  analyze: (sessionId: string) => Promise<VoiceObservationRecord[]>
}) {
  const [status, setStatus] = useState<Status>("loading")
  const [observations, setObservations] = useState<VoiceObservationRecord[]>([])

  const run = useCallback(() => {
    setStatus("loading")
    analyze(sessionId)
      .then((obs) => {
        setObservations(obs)
        setStatus("ready")
      })
      .catch(() => setStatus("error"))
  }, [sessionId, analyze])

  useEffect(() => run(), [run])

  if (status === "loading") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-sunken px-4 py-4">
        <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
          <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-45" />
          <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-70 [animation-delay:140ms]" />
          <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-terracotta [animation-delay:280ms]" />
        </span>
        <p className="text-sm text-ink-muted">Estamos mirando tu charla…</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-[18px] bg-sunken px-4 py-4">
        <p className="text-sm text-ink-muted text-pretty">
          No pudimos revisar la charla esta vez.
        </p>
        <button onClick={run} className="press-chip flex items-center gap-1.5 text-sm font-medium text-green">
          <DuoIcon name="repasar" size={14} />
          Reintentar
        </button>
      </div>
    )
  }

  if (observations.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-sunken px-4 py-4">
        <DuoIcon name="logrado" size={17} className="flex-shrink-0 text-green" />
        <p className="text-sm text-ink text-pretty">
          Nada para corregir esta vez: hablaste muy bien. Dale, otra charla mañana.
        </p>
      </div>
    )
  }

  const shown = [...observations]
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
    .slice(0, MAX_SHOWN)

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2 px-1">
        <DuoIcon name="brote" size={17} className="text-green" />
        <h2 className="font-serif text-[19px] text-ink">De esta charla</h2>
      </div>
      <ul className="stagger-children space-y-2">
        {shown.map((obs) => (
          <li key={obs.id} className="clay-static rounded-[18px] px-4 py-3.5">
            <p className={`smallcaps mb-1.5 ${obs.type === "error_grammar" ? "text-terracotta" : "text-ink-faint"}`}>
              {TYPE_LABELS[obs.type]}
            </p>
            {obs.detail.original && obs.detail.corrected && (
              <p className="mb-1 font-serif text-[17px] leading-[1.4] text-ink">
                <span className="text-ink-soft underline decoration-terracotta decoration-2 underline-offset-[3px]">
                  {obs.detail.original}
                </span>{" "}
                <DuoIcon name="flecha" size={13} className="inline" />{" "}
                <span>{obs.detail.corrected}</span>
              </p>
            )}
            {obs.detail.original && !obs.detail.corrected && (
              <p className="mb-1 font-serif text-[17px] leading-[1.4] text-ink">
                «{obs.detail.original}»
              </p>
            )}
            {obs.detail.note && (
              <p className="text-[13px] leading-relaxed text-ink-muted text-pretty">
                {obs.detail.note}
              </p>
            )}
            {isPracticeableTag(obs.detail.tag) && (
              <Link
                href={`/app/exercises?topic=${obs.detail.tag}`}
                className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-green"
              >
                Practicar esto
                <DuoIcon name="flecha" size={13} />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
