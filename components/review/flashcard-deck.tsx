"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Volume2, Loader2, Check, RotateCcw, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { playAudio } from "@/lib/audio"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import type { PracticeResult, SavedPhrase } from "@/lib/types"

interface FlashcardDeckProps {
  phrases: SavedPhrase[]
  onRecord: (id: string, result: PracticeResult) => void
  onExit: () => void
}

export function FlashcardDeck({ phrases, onRecord, onExit }: FlashcardDeckProps) {
  // Freeze the deck order for the duration of the session so cards don't
  // reshuffle underneath the user as their practice counts change.
  const deck = useMemo(
    () =>
      [...phrases].sort(
        (a, b) => (a.timesPracticed ?? 0) - (b.timesPracticed ?? 0) || b.savedAt.getTime() - a.savedAt.getTime(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const { voiceId } = useVoicePreference()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [gotItCount, setGotItCount] = useState(0)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const current = deck[index]
  const done = index >= deck.length

  const playTTS = useCallback(
    async (text: string) => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setPlaying(true)
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voice: voiceId }),
        })
        if (!res.ok) throw new Error("TTS failed")
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = await playAudio(url)
        audioRef.current = audio
        audio.onended = () => {
          setPlaying(false)
          URL.revokeObjectURL(url)
          audioRef.current = null
        }
      } catch {
        setPlaying(false)
        toast.error("No se pudo reproducir el audio")
      }
    },
    [voiceId],
  )

  const handleResult = (result: PracticeResult) => {
    if (!current) return
    onRecord(current.id, result)
    if (result === "got_it") setGotItCount((c) => c + 1)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaying(false)
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-12">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="font-serif text-xl text-foreground mb-1">¡Bien hecho!</h2>
        <p className="text-sm text-muted-foreground mb-6">
          You reviewed {deck.length} {deck.length === 1 ? "phrase" : "phrases"} — {gotItCount} got it.
        </p>
        <Button onClick={onExit}>Done</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">
          {index + 1} / {deck.length}
        </span>
        <button onClick={onExit} className="text-xs text-muted-foreground hover:text-foreground">
          Exit
        </button>
      </div>
      <div className="h-1 w-full rounded-full bg-secondary mb-6 overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(index / deck.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[220px] rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center active:scale-[0.99] transition-transform"
      >
        <p className="text-lg font-medium text-foreground">{current.spanish}</p>
        {flipped ? (
          <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/50 w-full">
            {current.english || "—"}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-4">Tap to reveal</p>
        )}
      </button>

      {/* Listen */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => playTTS(current.spanish)}
          disabled={playing}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 px-3 py-2 rounded-full"
          aria-label="Listen"
        >
          {playing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
          Listen
        </button>
      </div>

      {/* Answer buttons */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <Button variant="outline" onClick={() => handleResult("again")}>
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Again
        </Button>
        <Button onClick={() => handleResult("got_it")}>
          <Check className="w-4 h-4 mr-1.5" />
          Got it
        </Button>
      </div>
    </div>
  )
}
