"use client"

// The daily pack as a live query: pick a moment, see the library's phrases for
// it, generate only if the library runs short. No pack table anywhere.
//
// The chip row intentionally runs off the right edge — it's a scroll cue, not
// a layout accident. "nueva" is the one terracotta tag; the other states are
// quiet small-caps.

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { ChipRow } from "@/components/chip-row"
import { DuoIcon, momentIcon } from "@/components/icons"
import { useTTS } from "@/hooks/use-tts"
import { fillPackForMoment, queryPackForMoment } from "@/lib/phrases/pack"
import { isStarterPhrase } from "@/lib/phrases/starter"
import { PHRASE_MOMENTS, type Phrase, type PhraseMoment } from "@/lib/phrases/types"

const MOMENT_LABELS: Record<PhraseMoment, string> = {
  despertar: "Despertar",
  comida: "Comida",
  juego: "Juego",
  paseo: "Paseo",
  baño: "Baño",
  calmar: "Calmar",
  dormir: "Dormir",
}

export function MomentPack() {
  const [moment, setMoment] = useState<PhraseMoment>("juego")
  const [pack, setPack] = useState<Phrase[]>([])
  const [filling, setFilling] = useState(false)
  const { play, playingId } = useTTS("speak")
  const posthog = usePostHog()

  const refresh = useCallback((m: PhraseMoment) => {
    setPack(queryPackForMoment(m))
  }, [])

  useEffect(() => refresh(moment), [moment, refresh])

  const fill = async () => {
    if (filling) return
    setFilling(true)
    posthog.capture("pack_fill_requested", { moment })
    try {
      setPack(await fillPackForMoment(moment))
    } catch {
      toast.error("No se pudieron generar frases", { description: "Probá de nuevo en un momento." })
    } finally {
      setFilling(false)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="px-1 font-serif text-[19px] text-ink">Frases para el momento</h2>
      <p className="mt-1 px-1 text-[12.5px] text-ink-soft">
        Tu biblioteca, filtrada por lo que estás por hacer.
      </p>

      <ChipRow className="mt-3">
        {PHRASE_MOMENTS.map((m) => {
            const active = m === moment
            return (
              <button
                key={m}
                onClick={() => setMoment(m)}
                aria-pressed={active}
                className={`flex h-[38px] flex-none items-center gap-[7px] rounded-full px-3.5 transition-transform duration-[120ms] active:translate-y-[2px] ${
                  active ? "bg-green text-cream" : "bg-sunken-2 text-ink"
                }`}
                style={{
                  boxShadow: active ? "0 3px 0 var(--hb-green-press)" : "0 2px 0 var(--hb-lip-sunken)",
                }}
              >
                <DuoIcon name={momentIcon(m)} size={15} />
                <span className="text-[13px] font-medium">{MOMENT_LABELS[m]}</span>
              </button>
            )
          })}
      </ChipRow>

      {pack.length === 0 ? (
        <p className="mt-4 px-1 text-sm text-ink-muted text-pretty">
          Todavía no hay frases para este momento. Generá unas para empezar.
        </p>
      ) : (
        <ul className="stagger-children mt-4 space-y-[9px]">
          {pack.map((phrase) => (
            <li key={phrase.id} className="clay-static flex items-start gap-3 rounded-[20px] px-4 py-[15px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <p className="font-serif text-[17.5px] leading-[1.32] text-ink">{phrase.text}</p>
                <div className="flex flex-wrap items-center gap-[7px]">
                  <span className="text-[12.5px] text-ink-soft">{phrase.translation}</span>
                  {/* Starter rows are the built-in floor, not learner activity — no state tag. */}
                  {isStarterPhrase(phrase) ? null : phrase.state === "nueva" ? (
                    <span className="rounded-full bg-terracotta-tint px-[7px] py-[3px] text-[9.5px] font-medium uppercase tracking-[.14em] text-terracotta-ink">
                      nueva
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-medium uppercase tracking-[.14em] text-ink-faint">
                      {phrase.state}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => play(phrase.id, phrase.text)}
                aria-label={`Escuchar: ${phrase.text}`}
                className="press-disc flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sunken-2 text-ink"
              >
                <DuoIcon
                  name="escuchar"
                  size={17}
                  className={playingId === phrase.id ? "animate-pulse" : undefined}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={fill}
        disabled={filling}
        className="press-chip mt-3 flex w-full items-center justify-center gap-2 rounded-[18px] bg-sunken py-3 text-sm font-medium text-ink disabled:opacity-60"
      >
        {filling ? (
          <span className="flex h-3.5 items-end gap-[3px]" aria-hidden>
            <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-45" />
            <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-green opacity-70 [animation-delay:140ms]" />
            <span className="anim-bar h-3.5 w-[3px] rounded-[2px] bg-terracotta [animation-delay:280ms]" />
          </span>
        ) : (
          <DuoIcon name="rayo" size={14} />
        )}
        {filling ? "Generando…" : "Generar frases personalizadas"}
      </button>
    </section>
  )
}
