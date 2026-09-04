"use client"

// Palabras: the vocabulary surface.
//
// It is a peer of Frases, not a section inside it. Frases teaches you things to
// SAY; this teaches you things to NAME, which is a different move with
// different grammar attached (the article, the gender) and its own way in — a
// picture you touch rather than a list you read.
//
// One screen, three moves: browse a set, add a word of your own, study what
// you've kept. The green hero is whichever of those matters now — study, once
// there's anything to study; the word of the day before that.

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/home/app-header"
import { ChipRow } from "@/components/chip-row"
import { DuoIcon, vocabSetIcon } from "@/components/icons"
import { AddWordCard } from "@/components/vocab/add-word-card"
import { BodyMap, FigureSwitch } from "@/components/vocab/body-map"
import { VocabDeck } from "@/components/vocab/vocab-deck"
import { WordRow } from "@/components/vocab/word-row"
import { useTTS } from "@/hooks/use-tts"
import { FIGURES } from "@/lib/vocab/body-map"
import { SETS, SET_ORDER, wordOfTheDay, wordsByGroup } from "@/lib/vocab/catalog"
import {
  addCatalogWord,
  buildDeck,
  countDue,
  listWords,
  removeCatalogWord,
  removeWord,
  savedCatalogIds,
} from "@/lib/vocab/store"
import { BAND_LABELS, bandFor, describeDue, isDue } from "@/lib/vocab/schedule"
import { withArticle, type CatalogWord, type VocabSetId, type VocabWord } from "@/lib/vocab/types"
import type { WordRowData } from "@/components/vocab/word-row"

/** Narrow a catalog or saved word to exactly what a row renders. */
function toRow(word: CatalogWord | VocabWord, key: string): WordRowData {
  return {
    key,
    spanish: word.spanish,
    article: word.article,
    english: word.english,
    example: word.example,
    exampleTranslation: word.exampleTranslation,
  }
}

const SET_LABELS: Record<VocabSetId, string> = {
  cuerpo: "El cuerpo",
  animales: "Los animales",
  comida: "La comida",
  propias: "Las tuyas",
}

export function VocabPage() {
  const { play, playingId } = useTTS("speak")
  const [set, setSet] = useState<VocabSetId>("cuerpo")
  const [figureId, setFigureId] = useState<"cuerpo" | "cara">("cuerpo")
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [mine, setMine] = useState<VocabWord[]>([])
  const [dueCount, setDueCount] = useState(0)
  const [studying, setStudying] = useState<VocabWord[] | null>(null)

  // localStorage is client-only — load after mount to avoid hydration mismatch.
  const reload = useCallback(() => {
    setSaved(savedCatalogIds())
    setMine(listWords())
    setDueCount(countDue())
  }, [])
  useEffect(reload, [reload])

  const potd = useMemo(() => wordOfTheDay(), [])
  const figure = FIGURES.find((f) => f.id === figureId)!
  const selectedWord = selectedRegion
    ? SETS.cuerpo.words.find((w) => w.id === selectedRegion)
    : undefined

  const toggleCatalog = (word: CatalogWord, inSet: VocabSetId) => {
    if (saved.has(word.id)) removeCatalogWord(word.id)
    else addCatalogWord(word, inSet)
    reload()
  }

  /** `anyway` ignores the schedule — the way out of the all-caught-up state. */
  const startStudy = (anyway = false) => {
    const deck = buildDeck(undefined, 20, { includeNotDue: anyway })
    if (deck.length > 0) setStudying(deck)
  }

  if (studying) {
    return (
      <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
        <AppHeader title="Repaso" />
        <VocabDeck
          words={studying}
          onExit={() => {
            setStudying(null)
            reload()
          }}
          onFinished={() => {
            setStudying(null)
            reload()
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <AppHeader title="Palabras" subtitle="Tocá una palabra para escucharla" />

      {/* The one green block, in three states: words waiting, everything
          resting, or nothing saved yet. The middle one is the whole point of
          the ladder — an empty queue is a good day, not a nag, so it reads as
          "al día" and the way to practise anyway is a quiet line underneath. */}
      {dueCount > 0 ? (
        <button
          onClick={() => startStudy()}
          className="clay-green-hero block w-full rounded-[26px] p-[22px] text-left"
        >
          <div className="flex items-center gap-[9px]">
            <DuoIcon name="repasar" size={17} className="text-[#EAF3EB]" detail="#8FBE9C" />
            <span className="smallcaps-lg text-green-on-dark">Tu lista</span>
          </div>
          <p className="mt-3.5 font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
            Repasá tus palabras
          </p>
          <span className="mt-1.5 block text-[13.5px] text-green-on-dark">
            {dueCount} {dueCount === 1 ? "lista para hoy" : "listas para hoy"}
            {mine.length > dueCount ? ` · ${mine.length - dueCount} descansando` : ""}
          </span>
          <span className="clay-cream mt-[18px] flex h-[46px] items-center justify-center gap-2 rounded-full">
            <span className="text-[15px] font-semibold text-green">Empezar</span>
            <DuoIcon name="flecha" size={16} />
          </span>
        </button>
      ) : mine.length > 0 ? (
        <div className="clay-green-hero rounded-[26px] p-[22px]">
          <div className="flex items-center gap-[9px]">
            <DuoIcon name="logrado" size={17} className="text-[#EAF3EB]" detail="#8FBE9C" />
            <span className="smallcaps-lg text-green-on-dark">Tu lista</span>
          </div>
          <p className="mt-3.5 font-serif text-[26px] leading-tight tracking-[-0.015em] text-cream">
            Estás al día
          </p>
          <span className="mt-1.5 block text-[13.5px] text-green-on-dark">
            Tus {mine.length} palabras están descansando. Te las voy trayendo de a poco.
          </span>
          <button
            onClick={() => startStudy(true)}
            className="mt-3 text-[13.5px] font-medium text-cream underline underline-offset-4"
          >
            Repasar igual
          </button>
        </div>
      ) : (
        <div className="clay-green-hero flex items-start gap-3.5 rounded-[26px] p-5">
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
      )}

      <AddWordCard onAdded={reload} />

      {/* Sets */}
      <div className="mt-8">
        <ChipRow>
          {SET_ORDER.map((id) => {
            const isActive = id === set
            return (
              <button
                key={id}
                onClick={() => setSet(id)}
                aria-pressed={isActive}
                className={`flex h-[38px] flex-none items-center gap-[7px] rounded-full px-3.5 transition-transform duration-[120ms] active:translate-y-[2px] ${
                  isActive ? "bg-green text-cream" : "bg-sunken-2 text-ink"
                }`}
                style={{
                  boxShadow: isActive ? "0 3px 0 var(--hb-green-press)" : "0 2px 0 var(--hb-lip-sunken)",
                }}
              >
                <DuoIcon name={vocabSetIcon(id)} size={15} />
                <span className="text-[13px] font-medium">{SET_LABELS[id]}</span>
              </button>
            )
          })}
        </ChipRow>
      </div>

      {set === "propias" ? (
        <MyWords
          words={mine}
          playingId={playingId}
          onPlay={play}
          onRemove={(id) => {
            removeWord(id)
            reload()
          }}
        />
      ) : (
        <div className="mt-5">
          {set === "cuerpo" && (
            <section className="mb-7">
              <FigureSwitch
                active={figureId}
                onChange={(id) => {
                  setFigureId(id)
                  setSelectedRegion(null)
                }}
              />
              <BodyMap
                figure={figure}
                selectedId={selectedRegion}
                savedIds={saved}
                onSelect={(word) => {
                  setSelectedRegion(word.id)
                  play(word.id, withArticle(word))
                }}
              />
              <div className="mt-4">
                {selectedWord ? (
                  <ul className="anim-settle">
                    <WordRow
                      word={toRow(selectedWord, selectedWord.id)}
                      saved={saved.has(selectedWord.id)}
                      playing={playingId === selectedWord.id}
                      onPlay={play}
                      onToggleSave={() => toggleCatalog(selectedWord, "cuerpo")}
                      showExample
                    />
                  </ul>
                ) : (
                  <p className="px-1 text-center text-[13px] text-ink-soft">
                    Tocá una parte del cuerpo para escucharla.
                  </p>
                )}
              </div>
            </section>
          )}

          <p className="mb-3 px-1 text-[13px] text-ink-soft">{SETS[set].blurb}</p>
          {wordsByGroup(SETS[set]).map((group) => (
            <section key={group.id} className="mb-6">
              <h2 className="mb-2.5 px-1 font-serif text-[19px] text-ink">{group.label}</h2>
              <ul className="stagger-children space-y-[9px]">
                {group.words.map((word) => (
                  <WordRow
                    key={word.id}
                    word={toRow(word, word.id)}
                    saved={saved.has(word.id)}
                    playing={playingId === word.id}
                    onPlay={play}
                    onToggleSave={() => toggleCatalog(word, set)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** The learner's own list — every word they've kept, whatever set it came from. */
function MyWords({
  words,
  playingId,
  onPlay,
  onRemove,
}: {
  words: VocabWord[]
  playingId: string | null
  onPlay: (id: string, text: string) => void
  onRemove: (id: string) => void
}) {
  if (words.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center px-6 text-center">
        <div className="clay-well mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sunken-2">
          <DuoIcon name="brote" size={24} className="text-ink-muted" />
        </div>
        <h2 className="font-serif text-[19px] text-ink">Todavía no guardaste ninguna</h2>
        <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink-soft">
          Guardá palabras de los sets de arriba, o escribí una en inglés y te la traduzco. Todo lo
          que guardes entra en el repaso.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="font-serif text-[19px] text-ink">Tu lista</h2>
        <span className="text-[12.5px] text-ink-soft">{words.length}</span>
      </div>
      <ul className="stagger-children space-y-[9px]">
        {words.map((word) => (
          <li key={word.id} className="clay-static flex items-start gap-3 rounded-[20px] px-4 py-[15px]">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="flex items-center gap-2 font-serif text-[17.5px] leading-[1.32] text-ink">
                {withArticle(word)}
                {isDue(word) && (
                  <span
                    className="h-[7px] w-[7px] flex-none rounded-full bg-terracotta"
                    aria-label="Lista para repasar"
                  />
                )}
              </p>
              <p className="text-[12.5px] leading-snug text-ink-soft">{word.english}</p>
              <p className="mt-1 text-[11.5px] text-ink-faint">
                {BAND_LABELS[bandFor(word)]} · {describeDue(word)}
              </p>
            </div>
            <div className="flex flex-none items-center gap-1.5">
              <button
                onClick={() => onPlay(word.id, withArticle(word))}
                aria-label={`Escuchar: ${withArticle(word)}`}
                className="press-disc flex h-9 w-9 items-center justify-center rounded-full bg-sunken-2 text-ink"
              >
                <DuoIcon
                  name="escuchar"
                  size={17}
                  className={playingId === word.id ? "animate-pulse" : undefined}
                />
              </button>
              <button
                onClick={() => onRemove(word.id)}
                aria-label={`Quitar ${withArticle(word)} de tu lista`}
                className="press-disc flex h-9 w-9 items-center justify-center rounded-full bg-green text-cream"
              >
                <DuoIcon name="check" size={17} detail="#8FBE9C" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
