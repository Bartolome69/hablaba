"use client"

// The "¿Cómo se dice…?" panel: ask (type, or hold to speak), read the answer,
// keep it or not. One component behind three places: the global sheet, the
// box at the top of Frases, and a pack's "¿Falta alguna?" box. A pack keeps
// itself as the word target; everywhere else words go to Tus palabras.

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { DuoIcon, type IconName } from "@/components/icons"
import { useRecorder } from "@/hooks/use-recorder"
import { useTTS } from "@/hooks/use-tts"
import {
  alreadySaved,
  answerDisplay,
  askLookup,
  saveAnswerAsPhrase,
  saveAnswerAsWord,
  type AskAnswer,
} from "@/lib/ask/ask"
import { packLabelInline } from "@/lib/vocab/catalog"
import type { VocabSetId } from "@/lib/vocab/types"
import { micPermissionHelp } from "@/lib/voice/platform"

// True to the Leitner ladder (lib/vocab/schedule.ts): a new word is due now,
// and a "lo sabía" makes it due tomorrow.
const NEXT_REVIEW = "Te la pregunto hoy y, si la sabes, otra vez mañana."

const DIALECT_NAME = { rioplatense: "En Argentina", neutral: "En neutro" } as const

export interface AskPanelProps {
  /** "sheet": inside the global sheet (its save is the green block). "card": inline on a page. */
  variant: "sheet" | "card"
  title?: string
  icon?: IconName
  /** A pack's add box: answers are words, saved into this pack. */
  target?: { set: VocabSetId }
  /** Helper line under the input, before anything is asked. */
  helper?: string
  placeholder?: string
  initialQuery?: string
  /** The sentence a word was met in (Phase 4: looking up a word from chat). */
  context?: string
  autoFocus?: boolean
  onSaved?: (kind: "word" | "phrase") => void
  onClose?: () => void
}

export function AskPanel({
  variant,
  title = "¿Cómo se dice…?",
  icon = "rayo",
  target,
  helper,
  placeholder = "En inglés o en español…",
  initialQuery,
  context,
  autoFocus,
  onSaved,
  onClose,
}: AskPanelProps) {
  const [value, setValue] = useState(initialQuery ?? "")
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<AskAnswer | null>(null)
  /** Where the word lives once kept (or if it already was): links to that library. */
  const [savedWord, setSavedWord] = useState<{ pack: VocabSetId; label: string } | null>(null)
  const [savedPhrase, setSavedPhrase] = useState(false)
  const [justAddedWord, setJustAddedWord] = useState(false)
  const posthog = usePostHog()
  const { play, playingId } = useTTS("speak")
  const inputRef = useRef<HTMLInputElement>(null)
  const wordSet: VocabSetId = target?.set ?? "propias"
  const surface = variant === "sheet" ? "sheet" : target ? "pack" : "frases"

  const ask = useCallback(
    async (query: string) => {
      const text = query.trim()
      if (!text || busy) return
      setBusy(true)
      try {
        const result = await askLookup(text, { want: target ? "word" : "auto", context })
        posthog.capture("ask_answered", { kind: result.kind, surface })
        const saved = alreadySaved(result)
        setAnswer(result)
        setSavedWord(saved.word)
        setSavedPhrase(saved.phrase)
        setJustAddedWord(false)
        setValue("")
      } catch {
        toast.error("No se pudo buscar", { description: "Prueba de nuevo en un momento." })
      } finally {
        setBusy(false)
      }
    },
    [busy, target, context, posthog, surface],
  )

  // Opened with a word already in hand (from a chat bubble): ask straight away.
  const askedInitial = useRef(false)
  useEffect(() => {
    if (initialQuery && !askedInitial.current) {
      askedInitial.current = true
      void ask(initialQuery)
    }
  }, [initialQuery, ask])

  const recorder = useRecorder(
    useCallback((text: string) => void ask(text), [ask]),
    useCallback((kind: "denied" | "failed") => {
      if (kind === "denied") toast.error("Sin permiso para el micrófono", { description: micPermissionHelp() })
      else toast.error("No te pude escuchar", { description: "Prueba de nuevo, o escríbelo." })
    }, []),
  )

  const saveWord = () => {
    if (!answer) return
    const outcome = saveAnswerAsWord(answer, wordSet)
    posthog.capture("ask_saved", { as: "word", status: outcome.status, surface })
    if (outcome.status === "added") {
      setSavedWord({ pack: wordSet, label: packLabelInline(wordSet) })
      setJustAddedWord(true)
    } else {
      setSavedWord({ pack: outcome.pack, label: outcome.packLabel })
      if (outcome.restored) toast.success("Volvió a tus palabras", { description: `Está en ${outcome.packLabel}.` })
    }
    onSaved?.("word")
  }

  const savePhrase = () => {
    if (!answer) return
    const phrase = saveAnswerAsPhrase(answer)
    posthog.capture("ask_saved", { as: "phrase", ok: !!phrase, surface })
    setSavedPhrase(true)
    onSaved?.("phrase")
  }

  const close = () => {
    setAnswer(null)
    onClose?.()
  }

  const ready = !busy && !!value.trim()
  const recording = recorder.state === "recording"
  const hearing = recorder.state === "transcribing"
  // In the sheet, the save is the one green block; inline, the page already has one.
  const primary =
    variant === "sheet"
      ? "clay-green text-cream"
      : "clay-card text-ink"

  const body = (
    <>
      <div className="flex gap-[9px]">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask(value)}
          placeholder={recording ? "Te escucho…" : hearing ? "Escuchando…" : placeholder}
          aria-label={title}
          disabled={busy || recording || hearing}
          autoFocus={autoFocus}
          enterKeyHint="search"
          className="clay-recessed h-11 min-w-0 flex-1 rounded-full px-4 text-[15px] text-ink outline-none placeholder:text-ink-muted focus:ring-1 focus:ring-green/40 disabled:opacity-70"
        />
        {recorder.supported && !value.trim() && !busy ? (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              // Keep the hold even if the thumb drifts off the button.
              try {
                e.currentTarget.setPointerCapture(e.pointerId)
              } catch {}
              void recorder.start()
            }}
            onPointerUp={recorder.stop}
            onPointerCancel={recorder.stop}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Mantén pulsado para hablar"
            className={`flex h-11 w-11 flex-none select-none items-center justify-center rounded-full [-webkit-touch-callout:none] ${
              recording ? "bg-green text-cream" : "clay-card text-ink"
            }`}
          >
            {hearing ? <Spinner light={false} /> : <DuoIcon name="micro" size={19} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => ask(value)}
            disabled={!ready}
            className={`flex h-11 flex-none items-center justify-center rounded-full px-5 text-[14.5px] font-semibold ${
              ready || busy ? (answer && variant === "sheet" ? "clay-card text-ink" : "clay-green text-cream") : "bg-sunken-2 text-ink-muted"
            }`}
          >
            {busy ? <Spinner light={!(answer && variant === "sheet")} /> : "Dale"}
          </button>
        )}
      </div>

      {!answer && helper && <p className="mt-2.5 px-1 text-[12.5px] leading-snug text-ink-muted">{helper}</p>}
      {!answer && recording && (
        <p className="mt-2.5 px-1 text-[12.5px] text-ink-muted" role="status">
          Suelta para buscar.
        </p>
      )}

      {answer && (
        <div className="anim-settle mt-3.5 rounded-[18px] bg-sunken px-4 py-3.5" aria-live="polite">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[22px] leading-[1.25] tracking-[-0.01em] text-ink">{answerDisplay(answer)}</p>
              <p className="mt-1 text-[13.5px] text-ink-muted">{answer.gloss}</p>
              {answer.otherDialect && (
                <p className="mt-1 text-[13px] text-ink-muted">
                  {DIALECT_NAME[answer.otherDialect.dialect]}:{" "}
                  <span className="font-serif text-[14.5px] text-ink">{answer.otherDialect.spanish}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => play("ask-answer", answerDisplay(answer))}
              aria-label="Escuchar"
              className="press-disc flex h-11 w-11 flex-none items-center justify-center rounded-full bg-surface"
            >
              <DuoIcon name="escuchar" size={19} className={playingId === "ask-answer" ? "animate-pulse" : ""} />
            </button>
          </div>

          {answer.kind === "word" && answer.example && (
            <div className="mt-3 border-t border-rule pt-3">
              <p className="font-serif text-[15.5px] leading-snug text-ink">“{answer.example}”</p>
              {answer.exampleGloss && <p className="mt-0.5 text-[12.5px] text-ink-muted">{answer.exampleGloss}</p>}
            </div>
          )}

          <div className="mt-3.5 flex flex-col gap-2">
            {answer.kind === "word" &&
              (savedWord ? (
                <SavedLine>
                  {justAddedWord ? "En " : "Ya está en "}
                  <Link
                    href={`/app/palabras/${savedWord.pack}`}
                    onClick={onClose}
                    className="underline decoration-green/40 underline-offset-[3px]"
                  >
                    {lowerFirst(savedWord.label)} →
                  </Link>
                  {justAddedWord ? ` ${NEXT_REVIEW}` : ""}
                </SavedLine>
              ) : (
                <button onClick={saveWord} className={`flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold ${primary}`}>
                  <DuoIcon name="palabras" size={17} />
                  {target ? `Guardar en ${packLabelInline(wordSet)}` : "Guardar como palabra"}
                </button>
              ))}

            {(answer.kind === "phrase" || answer.example) &&
              (savedPhrase ? (
                <SavedLine>En tus frases.</SavedLine>
              ) : (
                <button
                  onClick={savePhrase}
                  className={`flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold ${
                    answer.kind === "phrase" ? primary : "press-chip bg-sunken-2 text-ink"
                  }`}
                >
                  <DuoIcon name="guardada" size={16} />
                  {answer.kind === "phrase" ? "Guardar como frase" : "Guardar la frase de ejemplo"}
                </button>
              ))}

            <button onClick={close} className="flex h-11 items-center justify-center text-[14px] font-medium text-ink-muted">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )

  if (variant === "sheet") return body

  return (
    <div className="clay-static rounded-[22px] p-4">
      <div className="mb-3 flex items-center gap-2">
        <DuoIcon name={icon} size={17} />
        <p className="text-[14.5px] font-semibold text-ink">{title}</p>
      </div>
      {body}
    </div>
  )
}

/** Pack names mid-sentence: "en tus palabras", not "en Tus palabras". */
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

function SavedLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex min-h-11 items-center gap-1.5 px-1 text-[13.5px] font-medium text-green" role="status">
      <DuoIcon name="check" size={15} className="flex-none" />
      <span>{children}</span>
    </p>
  )
}

function Spinner({ light }: { light: boolean }) {
  const c = light ? "#F7F3EC" : "#1E3D2C"
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-label="Buscando">
      <circle cx="12" cy="12" r="9" stroke={c} strokeOpacity=".3" strokeWidth="2.6" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}
