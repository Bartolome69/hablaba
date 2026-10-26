"use client"

// Palabras: a shelf of word packs, studied as flashcards.
//
// Two levels and no filters. This screen is the shelf: one green block for
// today's review across every pack, then the packs themselves. Tapping a pack
// opens it (components/vocab/pack-page.tsx), where its words live and where
// new ones get added. Every authored pack is preloaded, so there's nothing to
// save before studying.
//
// The green block has three states: cards due (Repaso de hoy), everything
// resting (Estás al día, which is a good day, not a nag), or nothing studied
// yet (the word of the day, with a way into its pack).

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/home/app-header"
import { DuoIcon, vocabSetIcon } from "@/components/icons"
import { PackProgress, packStatusLine } from "@/components/vocab/pack-progress"
import { VocabDeck } from "@/components/vocab/vocab-deck"
import { useTTS } from "@/hooks/use-tts"
import { PACK_ORDER, packLabel, packOfCatalogWord, wordOfTheDay } from "@/lib/vocab/catalog"
import {
  buildPracticeAnywayDeck,
  buildReviewDeck,
  countDue,
  hasStudied,
  packStats,
  type PackStats,
} from "@/lib/vocab/store"
import { withArticle, type VocabSetId, type VocabWord } from "@/lib/vocab/types"

const SHELF: VocabSetId[] = ["propias", ...PACK_ORDER]

export function VocabPage() {
  const { play, playingId } = useTTS("speak")
  const [stats, setStats] = useState<Partial<Record<VocabSetId, PackStats>>>({})
  const [dueCount, setDueCount] = useState(0)
  const [studied, setStudied] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [studying, setStudying] = useState<VocabWord[] | null>(null)

  // localStorage is client-only — load after mount to avoid hydration mismatch.
  const reload = useCallback(() => {
    setStats(Object.fromEntries(SHELF.map((id) => [id, packStats(id)])))
    setDueCount(countDue())
    setStudied(hasStudied())
    setLoaded(true)
  }, [])
  useEffect(reload, [reload])

  const potd = useMemo(() => wordOfTheDay(), [])
  const potdPack = packOfCatalogWord(potd.id)

  const start = (deck: VocabWord[]) => {
    if (deck.length > 0) setStudying(deck)
  }

  if (studying) {
    const finish = () => {
      setStudying(null)
      reload()
    }
    return (
      <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
        <AppHeader title="Repaso de hoy" />
        <VocabDeck words={studying} onExit={finish} onFinished={finish} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Palabras" subtitle="Packs de palabras, repasados con tarjetas" />

      {/* Rendered only after the store is read, so the hero doesn't flash the
          wrong state on load. */}
      {!loaded ? (
        <div className="h-[168px]" />
      ) : dueCount > 0 ? (
        <button
          onClick={() => start(buildReviewDeck())}
          className="clay-green-hero block w-full rounded-[26px] p-[22px] text-left"
        >
          <div className="flex items-center gap-[9px]">
            <DuoIcon name="repasar" size={17} className="text-[#EAF3EB]" detail="#8FBE9C" />
            <span className="smallcaps-lg text-green-on-dark">Repaso de hoy</span>
          </div>
          <p className="mt-3.5 font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
            {dueCount} {dueCount === 1 ? "tarjeta te espera" : "tarjetas te esperan"}
          </p>
          <span className="mt-1.5 block text-[13.5px] text-green-on-dark">
            De todos tus packs, las más flojas primero.
          </span>
          <span className="clay-cream mt-[18px] flex h-[46px] items-center justify-center gap-2 rounded-full">
            <span className="text-[15px] font-semibold text-green">Empezar</span>
            <DuoIcon name="flecha" size={16} />
          </span>
        </button>
      ) : studied ? (
        <div className="clay-green-hero rounded-[26px] p-[22px]">
          <div className="flex items-center gap-[9px]">
            <DuoIcon name="logrado" size={17} className="text-[#EAF3EB]" detail="#8FBE9C" />
            <span className="smallcaps-lg text-green-on-dark">Repaso de hoy</span>
          </div>
          <p className="mt-3.5 font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
            Estás al día
          </p>
          <span className="mt-1.5 block text-[13.5px] text-green-on-dark">
            Tus tarjetas están descansando. Abrí un pack para sumar palabras nuevas.
          </span>
          <button
            onClick={() => start(buildPracticeAnywayDeck())}
            className="mt-3 text-[13.5px] font-medium text-cream underline underline-offset-4"
          >
            Repasar igual
          </button>
        </div>
      ) : (
        <div className="clay-green-hero rounded-[26px] p-5">
          <div className="flex items-start gap-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <DuoIcon name="nueva" size={15} />
                <span className="smallcaps-lg text-green-on-dark">Palabra del día</span>
              </div>
              <p className="font-serif text-[25px] leading-[1.2] tracking-[-0.015em] text-cream">
                {withArticle(potd)}
              </p>
              <p className="text-[13px] text-green-on-dark">{potd.english}</p>
            </div>
            <button
              onClick={() => play(potd.id, withArticle(potd))}
              aria-label="Escuchar la palabra del día"
              className="press-disc flex h-11 w-11 flex-none items-center justify-center rounded-full bg-green-well"
            >
              <DuoIcon
                name="escuchar"
                size={20}
                className={`text-cream ${playingId === potd.id ? "animate-pulse" : ""}`}
              />
            </button>
          </div>
          {potdPack && (
            <Link
              href={`/app/palabras/${potdPack}`}
              className="clay-cream mt-4 flex h-[46px] items-center justify-center gap-2 rounded-full"
            >
              <span className="text-[15px] font-semibold text-green">Empezar con {packLabel(potdPack)}</span>
              <DuoIcon name="flecha" size={16} />
            </Link>
          )}
        </div>
      )}

      <div className="mt-[26px] flex items-baseline justify-between px-1">
        <h2 className="font-serif text-[19px] text-ink">Tus packs</h2>
        <span className="text-[12.5px] text-ink-soft">{SHELF.length} packs</span>
      </div>

      <ul className="stagger-children mt-3 space-y-2">
        {SHELF.map((id) => (
          <li key={id}>
            <PackRow id={id} stats={stats[id]} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function PackRow({ id, stats }: { id: VocabSetId; stats?: PackStats }) {
  const own = id === "propias"
  const status = !stats ? "" : own && stats.total === 0 ? "Agregá las tuyas" : packStatusLine(stats)
  return (
    <Link
      href={`/app/palabras/${id}`}
      className="clay-card flex w-full items-center gap-[13px] rounded-[18px] p-3.5 text-left"
    >
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-green-tint text-ink">
        <DuoIcon name={vocabSetIcon(id)} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{packLabel(id)}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
          {stats && stats.due > 0 && (
            <span className="h-[6px] w-[6px] flex-none rounded-full bg-terracotta" aria-hidden />
          )}
          <span className="truncate">{status}</span>
        </p>
      </div>
      <div className="flex w-[64px] flex-none flex-col items-end gap-1.5">
        <span className="text-[12.5px] text-ink-faint">{stats ? stats.total : ""}</span>
        {stats && stats.total > 0 && <PackProgress stats={stats} className="w-full" />}
      </div>
    </Link>
  )
}
