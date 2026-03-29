"use client"

import { useCallback, useRef, useState } from "react"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { playAudio } from "@/lib/audio"

export function useTTS() {
  const { voiceId } = useVoicePreference()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback(async (id: string, text: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingId === id) {
      setPlayingId(null)
      return
    }

    setPlayingId(id)
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
        setPlayingId(null)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }
    } catch {
      setPlayingId(null)
    }
  }, [voiceId, playingId])

  return { play, playingId }
}
