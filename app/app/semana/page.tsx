"use client"

// "Tu semana" — the weekly report over ALL conversations, typed and spoken.
// Moved here from the Grow module when it collapsed; the IA phase-3
// aggregation layer will take over the queries behind it.

import { useEffect, useState } from "react"
import Link from "next/link"
import { CorrectionCards } from "@/components/voice/correction-cards"
import { DuoIcon } from "@/components/icons"
import { runMigrations } from "@/lib/migrations"
import {
  computeWeeklyData,
  fetchWeeklyNarrative,
  type WeeklyData,
} from "@/lib/conversations/weekly"
import { isPracticeableTag } from "@/lib/voice/types"

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="clay-static flex-1 rounded-[18px] px-3 py-3.5 text-center">
      <p className="font-serif text-[22px] leading-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{label}</p>
    </div>
  )
}

export default function WeeklyReportPage() {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [narrative, setNarrative] = useState<string | null>(null)
  const [tagLabels, setTagLabels] = useState<Record<string, string>>({})
  const [narrativeFailed, setNarrativeFailed] = useState(false)

  // localStorage is client-only — load after mount to avoid hydration mismatch
  useEffect(() => {
    runMigrations()
    const weekly = computeWeeklyData()
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

  if (!data) return <div className="min-h-dvh bg-background" />

  const labelFor = (tag: string) => tagLabels[tag] ?? tag.replace(/-/g, " ")

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <div className="mb-6 flex items-center gap-3.5">
        <Link
          href="/app/today"
          aria-label="Volver a Hoy"
          className="clay-card flex h-9 w-9 items-center justify-center rounded-[13px] text-ink"
        >
          <DuoIcon name="volver" size={18} />
        </Link>
        <div>
          <h1 className="font-serif text-[22px] leading-tight tracking-[-0.015em] text-ink">Tu semana</h1>
          <p className="text-xs text-ink-soft">Los últimos 7 días de conversación</p>
        </div>
      </div>

      {data.stats.sessions === 0 ? (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sunken-2 text-ink">
            <DuoIcon name="micro" size={22} />
          </div>
          <p className="max-w-[26ch] text-sm text-ink-muted text-balance">
            Esta semana todavía no charlaste. Una conversación alcanza para empezar el informe.
          </p>
          <Link href="/app/charla" className="flex items-center gap-1.5 text-sm font-semibold text-green">
            Empezar una charla
            <DuoIcon name="flecha" size={14} />
          </Link>
        </div>
      ) : (
        <>
          <div className="stagger-children mb-4 flex gap-2">
            <StatTile value={String(data.stats.sessions)} label="charlas" />
            <StatTile value={`${data.stats.minutes}′`} label="minutos hablados" />
            <StatTile value={String(data.stats.userTurns)} label="veces que hablaste" />
          </div>

          {/* The streak is the screen's one terracotta moment. */}
          {data.stats.streakDays > 1 && (
            <div className="mb-4 flex items-center gap-2.5 rounded-[18px] bg-terracotta-tint px-4 py-3">
              <DuoIcon name="racha" size={17} className="flex-shrink-0 text-ink" />
              <p className="text-sm font-semibold text-terracotta-ink">
                {data.stats.streakDays} días seguidos con español
              </p>
            </div>
          )}

          {narrative ? (
            <p className="clay-static mb-6 rounded-[20px] px-4 py-4 font-serif text-[17px] leading-relaxed text-ink text-pretty">
              {narrative}
            </p>
          ) : narrativeFailed ? null : (
            <div className="mb-6 flex items-center gap-3 rounded-[18px] bg-sunken px-4 py-4">
              <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
                <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-45" />
                <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-70 [animation-delay:140ms]" />
                <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-terracotta [animation-delay:280ms]" />
              </span>
              <p className="text-sm text-ink-muted">Escribiendo tu resumen…</p>
            </div>
          )}

          {data.celebrations.length > 0 && (
            <section className="mb-6">
              <h2 className="px-1 font-serif text-[19px] text-ink">Frases tuyas que usaste en serio</h2>
              <ul className="mt-2.5 space-y-1.5">
                {data.celebrations.map((phrase, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-[16px] bg-green-tint px-3.5 py-2.5">
                    <DuoIcon name="logrado" size={15} className="mt-0.5 flex-shrink-0 text-green" />
                    <p className="font-serif text-[16px] leading-snug text-ink">{phrase}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {data.patterns.length > 0 && (
            <section className="mb-6">
              <h2 className="px-1 font-serif text-[19px] text-ink">Patrones de la semana</h2>
              <ul className="mt-2.5 space-y-2">
                {data.patterns.map((p) => (
                  <li key={p.tag} className="clay-static rounded-[18px] px-4 py-3.5">
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <p className="text-[15px] font-semibold capitalize text-ink">{labelFor(p.tag)}</p>
                      <p className="text-xs tabular-nums text-ink-soft">×{p.count}</p>
                    </div>
                    {p.examples[0]?.original && p.examples[0]?.corrected && (
                      <p className="font-serif text-[17px] leading-[1.4] text-ink">
                        <span className="text-ink-soft underline decoration-terracotta decoration-2 underline-offset-[3px]">
                          {p.examples[0].original}
                        </span>{" "}
                        <DuoIcon name="flecha" size={13} className="inline" />{" "}
                        <span>{p.examples[0].corrected}</span>
                      </p>
                    )}
                    {!p.examples[0]?.corrected && p.examples[0]?.note && (
                      <p className="text-[13px] leading-relaxed text-ink-muted text-pretty">
                        {p.examples[0].note}
                      </p>
                    )}
                    {isPracticeableTag(p.tag) && (
                      <Link
                        href={`/app/exercises?topic=${p.tag}`}
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
          )}

          {data.repetitions.length > 0 && (
            <section className="mb-6">
              <h2 className="px-1 font-serif text-[19px] text-ink">Para variar</h2>
              <ul className="mt-2.5 space-y-1.5">
                {data.repetitions.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-[16px] bg-sunken px-3.5 py-2.5">
                    <DuoIcon name="repasar" size={14} className="mt-0.5 flex-shrink-0 text-ink-soft" detail="#8A9188" />
                    <p className="text-sm leading-relaxed text-ink">
                      <span className="font-serif text-[16px]">«{r.word}»</span>
                      {r.alternatives && (
                        <span className="text-ink-muted">: probá {r.alternatives}</span>
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
