"use client"

// The daily pack as a live query: pick a moment, see the library's phrases for
// it, generate only if the library runs short. No pack table anywhere.

import { useCallback, useEffect, useState } from "react"
import { Loader2, Sparkles, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { useTTS } from "@/hooks/use-tts"
import { fillPackForMoment, queryPackForMoment } from "@/lib/phrases/pack"
import { PHRASE_MOMENTS, type Phrase, type PhraseMoment } from "@/lib/phrases/types"

const MOMENT_LABELS: Record<PhraseMoment, { label: string; emoji: string }> = {
  despertar: { label: "Despertar", emoji: "🌅" },
  comida: { label: "Comida", emoji: "🍽️" },
  juego: { label: "Juego", emoji: "🧸" },
  paseo: { label: "Paseo", emoji: "🚼" },
  baño: { label: "Baño", emoji: "🛁" },
  calmar: { label: "Calmar", emoji: "🫂" },
  dormir: { label: "Dormir", emoji: "🌙" },
}

const STATE_LABEL: Record<Phrase["state"], string> = {
  nueva: "nueva",
  practicando: "practicando",
  usada: "usada",
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
    <section className="mb-8">
      <h2 className="mb-1 font-serif text-base text-foreground">Frases para el momento</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Tu biblioteca, filtrada por lo que estás por hacer.
      </p>

      <div className="-mx-4 mb-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5">
          {PHRASE_MOMENTS.map((m) => {
            const active = m === moment
            return (
              <button
                key={m}
                onClick={() => setMoment(m)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors active:scale-[0.97] ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                <span aria-hidden>{MOMENT_LABELS[m].emoji}</span>
                {MOMENT_LABELS[m].label}
              </button>
            )
          })}
        </div>
      </div>

      {pack.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground text-pretty">
          Todavía no hay frases para este momento — generá unas para empezar.
        </p>
      ) : (
        <ul className="mb-3 space-y-2">
          {pack.map((phrase) => (
            <li
              key={phrase.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-serif text-[15px] leading-snug text-foreground">{phrase.text}</p>
                <p className="text-xs text-muted-foreground">
                  {phrase.translation}
                  <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {STATE_LABEL[phrase.state]}
                  </span>
                </p>
              </div>
              <button
                onClick={() => play(phrase.id, phrase.text)}
                aria-label={`Escuchar: ${phrase.text}`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground active:scale-95"
              >
                <Volume2
                  className={`h-4 w-4 ${playingId === phrase.id ? "animate-pulse text-primary" : ""}`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={fill}
        disabled={filling}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary/50 active:scale-[0.99] disabled:opacity-60"
      >
        {filling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
        {filling ? "Generando…" : "Generar frases para este momento"}
      </button>
    </section>
  )
}
