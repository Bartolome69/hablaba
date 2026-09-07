"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { playAudio, ttsUrl } from "@/lib/audio"
import { getProfile } from "@/lib/profile/store"

/**
 * Where the audio is being played from, which decides HOW she reads it.
 *
 * "chat" is a line from a conversation — she says it the way she said it, so
 * tapping Repetir sounds like the same person you were just talking to.
 * Everything else is material the learner is working on (a phrase, a word, a
 * flashcard), where being able to catch every syllable beats sounding casual.
 */
export type TTSContext = "speak" | "chat" | "today"

const MANNER: Record<TTSContext, "conversational" | "clear"> = {
  chat: "conversational",
  speak: "clear",
  today: "clear",
}

export function useTTS(context: TTSContext = "chat") {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const posthog = usePostHog()

  // Stop playback and cancel anything still loading. Stable identity so the
  // unmount effect below tears down audio when the user navigates away.
  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const play = useCallback(async (id: string, text: string) => {
    const wasPlaying = playingId === id
    stop()
    if (wasPlaying) {
      setPlayingId(null)
      return
    }

    setPlayingId(id)
    // Read inside the handler: localStorage is client-only, and this way a
    // dialect change in Ajustes takes effect on the very next tap.
    const dialect = getProfile().dialect
    const manner = MANNER[context]
    posthog.capture("tts_played", { context, dialect, manner })
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const audio = await playAudio(ttsUrl(text, { dialect, manner }), controller.signal)
      // Navigated away / superseded while the clip was loading.
      if (controller.signal.aborted) {
        audio.pause()
        return
      }
      audioRef.current = audio
      audio.onended = () => {
        setPlayingId(null)
        audioRef.current = null
      }
    } catch {
      if (controller.signal.aborted) return // silent — user cancelled
      setPlayingId(null)
      toast.error("No se pudo reproducir el audio", {
        action: {
          label: "Retry",
          onClick: () => play(id, text),
        },
      })
    }
  }, [playingId, context, posthog, stop])

  // Kill audio if the component using this hook unmounts mid-playback.
  useEffect(() => stop, [stop])

  return { play, playingId, stop }
}
