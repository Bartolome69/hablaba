"use client"

import { useState } from "react"
import { BookOpen, Check, Music, Volume2 } from "lucide-react"
import type { CriarPack } from "@/lib/criar/types"
import { stageMoments } from "@/lib/criar/stage"
import { setPhraseLearned } from "@/lib/criar/store"
import { useTTS } from "@/hooks/use-tts"

export function PackView({ pack: initialPack }: { pack: CriarPack }) {
  const [pack, setPack] = useState(initialPack)
  const { play, playingId } = useTTS("criar", { register: "rioplatense" })

  const moment = stageMoments[pack.stage].find((m) => m.id === pack.moment)

  const toggleLearned = (phraseId: string) => {
    setPack((prev) => ({
      ...prev,
      phrases: prev.phrases.map((ph) =>
        ph.id === phraseId ? { ...ph, learned: !ph.learned } : ph,
      ),
    }))
    const current = pack.phrases.find((ph) => ph.id === phraseId)
    setPhraseLearned(pack.id, phraseId, !current?.learned)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-lg text-foreground">
          {moment ? `${moment.emoji} ${moment.label}` : "Today's pack"}
        </h2>
        <span className="text-xs text-muted-foreground">
          Tap <Volume2 className="inline h-3 w-3" /> to hear it, ✓ when it&apos;s yours
        </span>
      </div>

      {pack.captureLessons.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">From your captures</h3>
          <div className="space-y-4">
            {pack.captureLessons.map((lesson) => (
              <div key={lesson.captureId}>
                <p className="text-xs text-muted-foreground mb-1">
                  You couldn&apos;t say: &ldquo;{lesson.request}&rdquo;
                </p>
                <div className="flex items-start gap-2">
                  <PlayButton
                    id={`lesson-${lesson.captureId}`}
                    text={lesson.spanish}
                    play={play}
                    playingId={playingId}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{lesson.spanish}</p>
                    {lesson.variants.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {lesson.variants.join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{lesson.note}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card">
        {pack.phrases.map((phrase, i) => (
          <div
            key={phrase.id}
            className={`flex items-start gap-2 p-3 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <PlayButton id={phrase.id} text={phrase.spanish} play={play} playingId={playingId} />
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] ${phrase.learned ? "text-muted-foreground" : "text-foreground"}`}>
                {phrase.spanish}
              </p>
              <p className="text-sm text-muted-foreground">{phrase.english}</p>
              {phrase.note && (
                <p className="mt-0.5 text-xs text-muted-foreground/80 italic">{phrase.note}</p>
              )}
            </div>
            <button
              onClick={() => toggleLearned(phrase.id)}
              aria-label={phrase.learned ? "Mark as not learned" : "Mark as learned"}
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                phrase.learned
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Check className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {pack.story && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <BookOpen className="h-4 w-4" />
              {pack.story.title}
            </h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              cuento
            </span>
          </div>
          <p className="mb-2 text-xs text-muted-foreground/80 italic">
            A little story to read aloud in Spanish.
          </p>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">
            {pack.story.text}
          </p>
          {pack.story.english && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {pack.story.english}
            </p>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Music className="h-4 w-4" />
            {pack.song.title}
          </h3>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {pack.song.kind}
          </span>
        </div>
        <p className="mb-2 text-xs text-muted-foreground/80 italic">
          No audio — this one you sing yourself.
        </p>
        <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">
          {pack.song.lyrics}
        </p>
        {pack.song.english && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {pack.song.english}
          </p>
        )}
      </div>
    </div>
  )
}

function PlayButton({
  id,
  text,
  play,
  playingId,
}: {
  id: string
  text: string
  play: (id: string, text: string) => void
  playingId: string | null
}) {
  const isPlaying = playingId === id
  return (
    <button
      onClick={() => play(id, text)}
      aria-label={isPlaying ? "Stop audio" : "Play audio"}
      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
        isPlaying ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
      }`}
    >
      <Volume2 className="h-4 w-4" />
    </button>
  )
}
