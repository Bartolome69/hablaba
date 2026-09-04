"use client"

// One word, wherever it's shown: the diagram readout, a set list, the learner's
// own list. Two controls, both discs: hear it, and keep it.
//
// The word always reads WITH its article ("la rodilla") — a B1 learner's
// mistake is never the noun, it's the gender in front of it, so the app never
// shows the bare noun on its own.

import { DuoIcon } from "@/components/icons"
import { withArticle } from "@/lib/vocab/types"

export interface WordRowData {
  key: string
  spanish: string
  article: string
  english: string
  example?: string
  exampleTranslation?: string
}

interface WordRowProps {
  word: WordRowData
  saved: boolean
  playing: boolean
  onPlay: (id: string, text: string) => void
  onToggleSave: () => void
  /** Show the example sentence — the diagram readout does, dense lists don't. */
  showExample?: boolean
}

export function WordRow({
  word,
  saved,
  playing,
  onPlay,
  onToggleSave,
  showExample = false,
}: WordRowProps) {
  const full = withArticle(word)

  return (
    <li className="clay-static flex items-start gap-3 rounded-[20px] px-4 py-[15px]">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-serif text-[17.5px] leading-[1.32] text-ink">{full}</p>
        <p className="text-[12.5px] leading-snug text-ink-soft">{word.english}</p>
        {showExample && word.example && (
          <div className="mt-2 border-t border-rule pt-2">
            <p className="font-serif text-[15px] leading-[1.35] text-ink">{word.example}</p>
            {word.exampleTranslation && (
              <p className="mt-0.5 text-[12px] leading-snug text-ink-soft">{word.exampleTranslation}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-none items-center gap-1.5">
        <button
          onClick={() => onPlay(word.key, showExample && word.example ? word.example : full)}
          aria-label={`Escuchar: ${full}`}
          className="press-disc flex h-9 w-9 items-center justify-center rounded-full bg-sunken-2 text-ink"
        >
          <DuoIcon name="escuchar" size={17} className={playing ? "animate-pulse" : undefined} />
        </button>
        <button
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? `Quitar ${full} de tu lista` : `Guardar ${full} en tu lista`}
          className={`press-disc flex h-9 w-9 items-center justify-center rounded-full ${
            saved ? "bg-green text-cream" : "bg-sunken-2 text-ink"
          }`}
        >
          <DuoIcon name={saved ? "check" : "guardada"} size={17} detail={saved ? "#8FBE9C" : undefined} />
        </button>
      </div>
    </li>
  )
}
