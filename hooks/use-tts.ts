"use client"

import { useCallback, useRef, useState } from "react"
import { usePostHog } from "posthog-js/react"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { playAudio, ttsUrl } from "@/lib/audio"

export function useTTS(context: "speak" | "chat" = "chat") {
  const { voiceId } = useVoicePreference()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const posthog = usePostHog()

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
    posthog.capture("tts_played", { context, voice_id: voiceId })
    try {
      const audio = await playAudio(ttsUrl(text, voiceId))
      audioRef.current = audio
      audio.onended = () => {
        setPlayingId(null)
        audioRef.current = null
      }
    } catch {
      setPlayingId(null)
    }
  }, [voiceId, playingId, context, posthog])

  return { play, playingId }
}
