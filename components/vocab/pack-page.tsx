"use client"

// One pack: its words, a way to study them as flashcards, and a way to add
// your own. Subgroups are plain headings, not filters; the whole pack is on
// one scroll. Press and hold a word for "Ya la sé" (skip it to the top of the
// ladder) or "Quitar" (hide it on this device; undoable, and recoverable from
// the footer).

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon } from "@/components/icons"
import { AddWordCard } from "@/components/vocab/add-word-card"
import { PackProgress } from "@/components/vocab/pack-progress"
import { VocabDeck } from "@/components/vocab/vocab-deck"
import { useLongPress } from "@/hooks/use-long-press"
import { useTTS } from "@/hooks/use-tts"
import { packLabel, SETS } from "@/lib/vocab/catalog"
import { BAND_LABELS, bandFor, isDue } from "@/lib/vocab/schedule"
import {
  buildPackDeck,
  buildPracticeAnywayDeck,
  isVirtual,
  markKnown,
  packContents,
  packStats,
  removeFromPack,
  restoreRemoved,
  unhidePack,
  type PackContents,
  type PackStats,
} from "@/lib/vocab/store"
import { withArticle, type VocabSetId, type VocabWord } from "@/lib/vocab/types"

export function PackPage({ packId }: { packId: VocabSetId }) {
  const { play, playingId } = useTTS("speak")
  const posthog = usePostHog()
  const label = packLabel(packId)
  const pack = packId === "propias" ? undefined : SETS[packId]
  const [contents, setContents] = useState<PackContents | null>(null)
  const [stats, setStats] = useState<PackStats | null>(null)
  const [nextDeck, setNextDeck] = useState<VocabWord[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [studying, setStudying] = useState<VocabWord[] | null>(null)

  const reload = useCallback(() => {
    setContents(packContents(packId))
    setStats(packStats(packId))
    setNextDeck(buildPackDeck(packId))
    setOpenId(null)
  }, [packId])
  useEffect(reload, [reload])

  const groups = useMemo(() => {
    if (!contents) return []
    const out: { id: string; label: string; words: VocabWord[] }[] = []
    if (contents.own.length > 0) {
      out.push({ id: "own", label: pack ? "Agregadas por vos" : "", words: contents.own })
    }
    if (pack) {
      const groupOf = new Map(pack.words.map((w) => [w.id, w.group]))
      for (const g of pack.groups ?? [{ id: "", label: "" }]) {
        const words = contents.catalog.filter((w) => !g.id || groupOf.get(w.catalogId ?? "") === g.id)
        if (words.length > 0) out.push({ id: g.id || "all", label: g.label, words })
      }
    }
    return out
  }, [contents, pack])

  const remove = (word: VocabWord) => {
    const removed = removeFromPack(word)
    posthog.capture("vocab_word_removed", { pack: packId, own: !word.catalogId })
    reload()
    toast("Palabra quitada", {
      description: withArticle(word),
      action: {
        label: "Deshacer",
        onClick: () => {
          restoreRemoved(removed)
          reload()
        },
      },
    })
  }

  const known = (word: VocabWord) => {
    markKnown(word.id)
    reload()
    toast.success("Marcada como sabida", { description: `${withArticle(word)} vuelve en un mes.` })
  }

  if (studying) {
    const finish = () => {
      setStudying(null)
      reload()
    }
    return (
      <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
        <AppHeader title={label} />
        <VocabDeck words={studying} onExit={finish} onFinished={finish} />
      </div>
    )
  }

  const newInDeck = nextDeck.filter((w) => isVirtual(w) || w.timesPracticed === 0).length
  const dueInDeck = nextDeck.length - newInDeck
  const seenCount = stats ? stats.sabidas + stats.practicando : 0

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <div className="flex items-center gap-3.5">
        <Link
          href="/app/palabras"
          aria-label="Volver a Palabras"
          className="clay-card flex h-9 w-9 flex-none items-center justify-center rounded-[13px] text-ink"
        >
          <DuoIcon name="volver" size={19} />
        </Link>
        <span className="text-[13px] font-medium text-ink-soft">Palabras</span>
      </div>

      <h1 className="mt-5 font-serif text-[32px] leading-[1.05] tracking-[-0.025em] text-ink">{label}</h1>
      {pack && <p className="mt-1.5 text-[13.5px] text-ink-soft">{pack.blurb}</p>}

      {stats && stats.total > 0 && (
        <div className="mt-4">
          <PackProgress stats={stats} />
          <p className="mt-2 text-[12.5px] text-ink-soft">
            {stats.total} palabras · {stats.sabidas} sabidas · {stats.practicando} practicando ·{" "}
            {stats.unseen} nuevas
          </p>
        </div>
      )}

      {/* The one green block: study this pack, or practise anyway once it's all resting. */}
      {stats && nextDeck.length > 0 ? (
        <button
          onClick={() => setStudying(nextDeck)}
          className="clay-green-hero mt-5 flex w-full items-center gap-3.5 rounded-[26px] p-[18px] text-left"
        >
          <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-green-well">
            <DuoIcon name="repasar" size={22} className="text-cream" detail="#8FBE9C" />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-serif text-[22px] tracking-[-0.01em] text-cream">Estudiar este pack</p>
            <p className="text-[12.5px] text-green-on-dark">
              {[
                dueInDeck > 0 ? `${dueInDeck} para repasar` : "",
                newInDeck > 0 ? `${newInDeck} ${newInDeck === 1 ? "nueva" : "nuevas"}` : "",
              ]
                .filter(Boolean)
                .join(" · ")}{" "}
              · {nextDeck.length} tarjetas
            </p>
          </div>
        </button>
      ) : stats && seenCount > 0 ? (
        <div className="clay-green-hero mt-5 rounded-[26px] p-[18px]">
          <p className="font-serif text-[22px] tracking-[-0.01em] text-cream">Todo descansando</p>
          <p className="mt-0.5 text-[12.5px] text-green-on-dark">
            Ya viste todas las palabras de este pack. Vuelven cuando toca.
          </p>
          <button
            onClick={() => setStudying(buildPracticeAnywayDeck(packId))}
            className="mt-2.5 text-[13.5px] font-medium text-cream underline underline-offset-4"
          >
            Repasar igual
          </button>
        </div>
      ) : null}

      <AddWordCard set={packId} label={label} onAdded={reload} />

      {contents && contents.catalog.length + contents.own.length === 0 && (
        <p className="mt-6 px-1 text-center text-[13px] leading-relaxed text-ink-soft">
          {pack ? "Quitaste todas las palabras de este pack." : "Acá van las palabras que no entran en ningún pack."}
        </p>
      )}

      {groups.map((g) => (
        <section key={g.id} className="mt-7">
          {g.label && <h2 className="mb-2.5 px-1 font-serif text-[19px] text-ink">{g.label}</h2>}
          <ul className="stagger-children space-y-[9px]">
            {g.words.map((w) => (
              <PackWordRow
                key={w.id}
                word={w}
                open={openId === w.id}
                playing={playingId === w.id}
                onPlay={() => play(w.id, withArticle(w))}
                onOpen={() => setOpenId(w.id)}
                onClose={() => setOpenId(null)}
                onKnown={() => known(w)}
                onRemove={() => remove(w)}
              />
            ))}
          </ul>
        </section>
      ))}

      {pack && contents && contents.hiddenCount > 0 && (
        <button
          onClick={() => {
            unhidePack(pack.id)
            reload()
          }}
          className="mt-7 w-full text-center text-[13px] font-medium text-ink-muted underline underline-offset-4"
        >
          {contents.hiddenCount} {contents.hiddenCount === 1 ? "palabra quitada" : "palabras quitadas"} ·
          Mostrarlas
        </button>
      )}
    </div>
  )
}

function PackWordRow({
  word,
  open,
  playing,
  onPlay,
  onOpen,
  onClose,
  onKnown,
  onRemove,
}: {
  word: VocabWord
  open: boolean
  playing: boolean
  onPlay: () => void
  onOpen: () => void
  onClose: () => void
  onKnown: () => void
  onRemove: () => void
}) {
  const press = useLongPress(onOpen)
  const seen = !isVirtual(word) && word.timesPracticed > 0
  const band = seen ? bandFor(word) : null
  const due = seen && isDue(word)

  return (
    <li
      {...press}
      className="clay-static select-none rounded-[20px] px-4 py-[13px] [-webkit-touch-callout:none]"
      style={open ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 2px 0 var(--hb-lip)" } : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="flex items-center gap-2 font-serif text-[17.5px] leading-[1.3] text-ink">
            {withArticle(word)}
            {due && (
              <span className="h-[7px] w-[7px] flex-none rounded-full bg-terracotta" aria-label="Lista para repasar" />
            )}
          </p>
          <p className="text-[12.5px] leading-snug text-ink-soft">
            {word.english}
            {band && <span className="text-ink-faint"> · {BAND_LABELS[band]}</span>}
          </p>
        </div>
        <button
          onClick={onPlay}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label={`Escuchar: ${withArticle(word)}`}
          className="press-disc flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sunken-2 text-ink"
        >
          <DuoIcon name="escuchar" size={17} className={playing ? "animate-pulse" : undefined} />
        </button>
      </div>

      {open && (
        <div className="anim-settle mt-3 flex gap-2 border-t border-rule pt-3">
          {band !== "sabida" && (
            <button
              onClick={onKnown}
              className="press-chip h-11 flex-1 rounded-full bg-sunken-2 text-[13.5px] font-medium text-ink"
            >
              Ya la sé
            </button>
          )}
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
