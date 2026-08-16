"use client"

// The session review: 3–5 observations from the post-session analysis, framed
// encouragingly, corrections as original → corrected. Renders on the session
// detail view above the transcript.
//
// Grammar observations carry an exercises-taxonomy topic id in detail.tag, so
// they link straight into practice (/app/exercises?topic=<tag>). URL string
// only — the Grow module never imports exercises code.

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, MessageCircleHeart, RotateCcw, Sparkles } from "lucide-react"
import { ensureSessionAnalysis } from "@/lib/criar/voice/analysis"
import {
  isPracticeableTag,
  type CriarVoiceObservation,
  type CriarVoiceObservationType,
} from "@/lib/criar/voice/types"

const MAX_SHOWN = 5

const TYPE_LABELS: Record<CriarVoiceObservationType, string> = {
  target_phrase_used: "¡Lo usaste!",
  error_grammar: "Un ajuste",
  avoidance: "Un desafío",
  repetition: "Variedad",
  code_switch: "En criollo",
  voseo_lapse: "Voseo",
}

// Celebrations first, then the work, then variety notes.
const TYPE_ORDER: CriarVoiceObservationType[] = [
  "target_phrase_used",
  "error_grammar",
  "avoidance",
  "code_switch",
  "repetition",
  "voseo_lapse",
]

type Status = "loading" | "ready" | "error"

export function SessionReview({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<Status>("loading")
  const [observations, setObservations] = useState<CriarVoiceObservation[]>([])

  const run = useCallback(() => {
    setStatus("loading")
    ensureSessionAnalysis(sessionId)
      .then((obs) => {
        setObservations(obs)
        setStatus("ready")
      })
      .catch(() => setStatus("error"))
  }, [sessionId])

  useEffect(() => run(), [run])

  if (status === "loading") {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Estamos mirando tu charla…</p>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-secondary/50 px-4 py-4">
        <p className="text-sm text-muted-foreground text-pretty">
          No pudimos revisar la charla esta vez.
        </p>
        <button
          onClick={run}
          className="flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reintentar
        </button>
      </div>
    )
  }

  if (observations.length === 0) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary/50 px-4 py-4">
        <MessageCircleHeart className="h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-sm text-foreground text-pretty">
          Nada para corregir esta vez — hablaste muy bien. Dale, otra charla mañana.
        </p>
      </div>
    )
  }

  const shown = [...observations]
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
    .slice(0, MAX_SHOWN)

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">De esta charla</h2>
      </div>
      <ul className="space-y-2">
        {shown.map((obs) => (
          <li key={obs.id} className="rounded-2xl bg-secondary/50 px-4 py-3">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {TYPE_LABELS[obs.type]}
            </p>
            {obs.detail.original && obs.detail.corrected && (
              <p className="mb-1 text-sm leading-relaxed">
                <span className="text-muted-foreground line-through decoration-muted-foreground/40">
                  {obs.detail.original}
                </span>{" "}
                <ArrowRight className="inline h-3 w-3 text-muted-foreground" />{" "}
                <span className="font-medium text-foreground">{obs.detail.corrected}</span>
              </p>
            )}
            {obs.detail.original && !obs.detail.corrected && (
              <p className="mb-1 text-sm font-medium text-foreground">
                &ldquo;{obs.detail.original}&rdquo;
              </p>
            )}
            {obs.detail.note && (
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {obs.detail.note}
              </p>
            )}
            {isPracticeableTag(obs.detail.tag) && (
              <Link
                href={`/app/exercises?topic=${obs.detail.tag}`}
                className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary"
              >
                Practicar esto
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
