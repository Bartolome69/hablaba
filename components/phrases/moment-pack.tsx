"use client"

// The pack row as a live query over the library. First pill is Recientes —
// the learner's own phrases (captures, saves, generated), newest first. The
// moment pills hold only phrases tagged with that moment (captures are
// auto-tagged by the API), topped up from the authored starter set, so every
// tap visibly changes the list. Generation is per-moment, so the button only
// shows on moment tabs. "nueva" is the one terracotta tag; the other states
// are quiet small-caps.
//
// Press and hold a phrase for its actions (copy, remove), shown inline in the
// card rather than in a sheet. Removing is always undoable from the toast, and
// on a built-in starter it hides the phrase on this device instead.

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { ChipRow } from "@/components/chip-row"
import { DuoIcon, momentIcon } from "@/components/icons"
import { useLongPress } from "@/hooks/use-long-press"
import { useTTS } from "@/hooks/use-tts"
import { fillPackForMoment, queryPackForMoment, queryRecentPhrases } from "@/lib/phrases/pack"
import { hideStarter, isStarterPhrase, unhideStarter } from "@/lib/phrases/starter"
import { removePhrase, restorePhrase } from "@/lib/phrases/store"
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

type PackTab = "recientes" | PhraseMoment

export function MomentPack() {
  const [tab, setTab] = useState<PackTab>("recientes")
  const [pack, setPack] = useState<Phrase[]>([])
  const [filling, setFilling] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const { play, playingId } = useTTS("speak")
  const posthog = usePostHog()
  // The undo toast can outlive a tab switch; it refreshes whatever is showing then.
  const tabRef = useRef(tab)
  tabRef.current = tab

  const refresh = useCallback((t: PackTab) => {
    setPack(t === "recientes" ? queryRecentPhrases() : queryPackForMoment(t))
  }, [])

  useEffect(() => {
    setOpenId(null)
    refresh(tab)
  }, [tab, refresh])

  const remove = (phrase: Phrase) => {
    const starter = isStarterPhrase(phrase)
    if (starter) hideStarter(phrase.id)
    else removePhrase(phrase.id)
    setOpenId(null)
    refresh(tab)
    posthog.capture("phrase_removed", { source: starter ? "starter" : phrase.source })
    toast("Frase quitada", {
      description: phrase.text,
      action: {
        label: "Deshacer",
        onClick: () => {
          if (starter) unhideStarter(phrase.id)
          else restorePhrase(phrase)
          refresh(tabRef.current)
        },
      },
    })
  }

  const copy = async (phrase: Phrase) => {
    setOpenId(null)
    try {
      await navigator.clipboard.writeText(phrase.text)
      toast.success("Copiada", { description: phrase.text })
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  // Fresh device: nothing captured or saved yet, so Recientes is empty —
  // land on a moment pack instead of an empty first tab.
  useEffect(() => {
    if (queryRecentPhrases().length === 0) setTab("juego")
  }, [])

  const fill = async () => {
    if (filling || tab === "recientes") return
    setFilling(true)
    posthog.capture("pack_fill_requested", { moment: tab })
    try {
      setPack(await fillPackForMoment(tab))
    } catch {
      toast.error("No se pudieron generar frases", { description: "Probá de nuevo en un momento." })
    } finally {
      setFilling(false)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="px-1 font-serif text-[19px] text-ink">Tus frases</h2>
      <p className="mt-1 px-1 text-[12.5px] text-ink-soft">
        Lo último que pediste, y un pack para cada momento del día.
      </p>

      <ChipRow className="mt-3">
        {(["recientes", ...PHRASE_MOMENTS] as PackTab[]).map((t) => {
          const active = t === tab
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              aria-pressed={active}
              className={`flex h-[38px] flex-none items-center gap-[7px] rounded-full px-3.5 transition-transform duration-[120ms] active:translate-y-[2px] ${
                active ? "bg-green text-cream" : "bg-sunken-2 text-ink"
              }`}
              style={{
                boxShadow: active ? "0 3px 0 var(--hb-green-press)" : "0 2px 0 var(--hb-lip-sunken)",
              }}
            >
              <DuoIcon name={t === "recientes" ? "reciente" : momentIcon(t)} size={15} />
              <span className="text-[13px] font-medium">
                {t === "recientes" ? "Recientes" : MOMENT_LABELS[t]}
              </span>
            </button>
          )
        })}
      </ChipRow>

      {pack.length === 0 ? (
        <p className="mt-4 px-1 text-sm text-ink-muted text-pretty">
          {tab === "recientes"
            ? "Acá aparecen las frases que capturás, guardás o generás. Empezá capturando algo que no supiste decir."
            : "Todavía no hay frases para este momento. Generá unas para empezar."}
        </p>
      ) : (
        <ul className="stagger-children mt-4 space-y-[9px]">
          {pack.map((phrase) => (
            <PhraseRow
              key={phrase.id}
              phrase={phrase}
              playing={playingId === phrase.id}
              open={openId === phrase.id}
              onPlay={() => play(phrase.id, phrase.text)}
              onOpen={() => setOpenId(phrase.id)}
              onClose={() => setOpenId(null)}
              onCopy={() => copy(phrase)}
              onRemove={() => remove(phrase)}
            />
          ))}
        </ul>
      )}

      {tab !== "recientes" && (
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
      )}
    </section>
  )
}

function PhraseRow({
  phrase,
  playing,
  open,
  onPlay,
  onOpen,
  onClose,
  onCopy,
  onRemove,
}: {
  phrase: Phrase
  playing: boolean
  open: boolean
  onPlay: () => void
  onOpen: () => void
  onClose: () => void
  onCopy: () => void
  onRemove: () => void
}) {
  const press = useLongPress(onOpen)

  return (
    <li
      {...press}
      className="clay-static select-none rounded-[20px] px-4 py-[15px] [-webkit-touch-callout:none]"
      style={open ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 2px 0 var(--hb-lip)" } : undefined}
    >
      <div className="flex items-start gap-3">
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
          onClick={onPlay}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Escuchar: ${phrase.text}`}
          className="press-disc flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sunken-2 text-ink"
        >
          <DuoIcon name="escuchar" size={17} className={playing ? "animate-pulse" : undefined} />
        </button>
      </div>

      {open && (
        <div className="anim-settle mt-3 flex gap-2 border-t border-rule pt-3">
          <button
            onClick={onCopy}
            className="press-chip h-11 flex-1 rounded-full bg-sunken-2 text-[13.5px] font-medium text-ink"
          >
            Copiar
          </button>
          <button
            onClick={onRemove}
            className="press-chip h-11 flex-1 rounded-full bg-terracotta-tint text-[13.5px] font-semibold text-terracotta-ink"
          >
            Quitar
          </button>
          <button
            onClick={onClose}
            className="press-chip h-11 rounded-full px-4 text-[13.5px] font-medium text-ink-muted"
          >
            Listo
          </button>
        </div>
      )}
    </li>
  )
}
