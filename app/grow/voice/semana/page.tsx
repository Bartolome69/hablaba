"use client"

// "Tu semana" — the weekly report. A 7-day group-by over the voice
// observations (computed client-side in lib/criar/voice/weekly.ts) plus one
// narrative call. This page is why the observation schema exists: patterns
// link straight into practice via their exercises-taxonomy tags.

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Flame, Loader2, Mic, Quote, Repeat } from "lucide-react"
import { CorrectionCards } from "@/components/criar/voice/correction-cards"
import { ensureSeeded } from "@/lib/criar/seed"
import type { CriarChild } from "@/lib/criar/types"
import {
  computeWeeklyData,
  fetchWeeklyNarrative,
  type WeeklyData,
} from "@/lib/criar/voice/weekly"
import { isPracticeableTag } from "@/lib/criar/voice/types"

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 rounded-2xl bg-secondary/50 px-3 py-3 text-center">
      <p className="font-serif text-xl font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

export default function WeeklyReportPage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const [data, setData] = useState<WeeklyData | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [tagLabels, setTagLabels] = useState<Record<string, string>>({})
  const [narrativeFailed, setNarrativeFailed] = useState(false)

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    const seeded = ensureSeeded()
    setChild(seeded)
    const weekly = computeWeeklyData(seeded.id)
    setData(weekly)
    if (weekly.stats.sessions > 0) {
      fetchWeeklyNarrative(weekly)
        .then((r) => {
          setNarrative(r.narrative)
          setTagLabels(r.tagLabels)
        })
        .catch(() => setNarrativeFailed(true))
    }
  }, [])

  if (!child || !data) return <div className="min-h-dvh bg-background" />

  const labelFor = (tag: string) => tagLabels[tag] ?? tag.replace(/-/g, " ")

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/grow/voice/historial"
          aria-label="Volver a tus charlas"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-serif text-lg font-semibold text-foreground">Tu semana</h1>
          <p className="text-xs text-muted-foreground">Los últimos 7 días, hablados</p>
        </div>
      </div>

      {data.stats.sessions === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="max-w-[26ch] text-sm text-muted-foreground text-balance">
            Esta semana todavía no charlaste. Una caminata con una conversación alcanza para
            empezar el informe.
          </p>
          <Link href="/grow/voice" className="text-sm font-medium text-primary">
            Empezar una charla →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-4 flex gap-2">
            <StatTile value={String(data.stats.sessions)} label="charlas" />
            <StatTile value={`${data.stats.minutes}′`} label="minutos" />
            <StatTile value={String(data.stats.userTurns)} label="veces que hablaste" />
          </div>

          {data.stats.streakDays > 1 && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-3">
              <Flame className="h-4 w-4 flex-shrink-0 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {data.stats.streakDays} días seguidos hablando español
              </p>
            </div>
          )}

          {/* Narrative */}
          {narrative ? (
            <p className="mb-6 rounded-2xl border border-border bg-card px-4 py-4 font-serif text-[15px] leading-relaxed text-foreground text-pretty">
              {narrative}
            </p>
          ) : narrativeFailed ? null : (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Escribiendo tu resumen…</p>
            </div>
          )}

          {/* Celebrations */}
          {data.celebrations.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">
                Frases tuyas que usaste en serio
              </h2>
              <ul className="space-y-1.5">
                {data.celebrations.map((phrase, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-xl bg-primary/10 px-3 py-2.5"
                  >
                    <Quote className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                    <p className="text-sm font-medium text-foreground">{phrase}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Patterns */}
          {data.patterns.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Patrones de la semana</h2>
              <ul className="space-y-2">
                {data.patterns.map((p) => (
                  <li key={p.tag} className="rounded-2xl bg-secondary/50 px-4 py-3">
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium capitalize text-foreground">
                        {labelFor(p.tag)}
                      </p>
                      <p className="text-xs tabular-nums text-muted-foreground">×{p.count}</p>
                    </div>
                    {p.examples[0]?.original && p.examples[0]?.corrected && (
                      <p className="text-sm leading-relaxed">
                        <span className="text-muted-foreground line-through decoration-muted-foreground/40">
                          {p.examples[0].original}
                        </span>{" "}
                        <ArrowRight className="inline h-3 w-3 text-muted-foreground" />{" "}
                        <span className="font-medium text-foreground">{p.examples[0].corrected}</span>
                      </p>
                    )}
                    {!p.examples[0]?.corrected && p.examples[0]?.note && (
                      <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                        {p.examples[0].note}
                      </p>
                    )}
                    {isPracticeableTag(p.tag) && (
                      <Link
                        href={`/app/exercises?topic=${p.tag}`}
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
          )}

          {/* Vocabulary variety */}
          {data.repetitions.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-foreground">Para variar</h2>
              <ul className="space-y-1.5">
                {data.repetitions.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-xl bg-secondary/50 px-3 py-2.5">
                    <Repeat className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                    <p className="text-sm leading-relaxed text-foreground">
                      <span className="font-medium">&ldquo;{r.word}&rdquo;</span>
                      {r.alternatives && (
                        <span className="text-muted-foreground"> — probá {r.alternatives}</span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <CorrectionCards corrections={data.corrections} />
        </>
      )}
    </div>
  )
}
