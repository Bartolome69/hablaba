"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { playAudio, ttsUrl } from "@/lib/audio"

export function useTTS(
  context: "speak" | "chat" | "criar" = "chat",
  opts?: { register?: string },
) {
  const register = opts?.register
  const { voiceId } = useVoicePreference()
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
    posthog.capture("tts_played", { context, voice_id: voiceId })
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const audio = await playAudio(ttsUrl(text, voiceId, register), controller.signal)
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
  }, [voiceId, playingId, context, posthog, register, stop])

  // Kill audio if the component using this hook unmounts mid-playback.
  useEffect(() => stop, [stop])

  return { play, playingId, stop }
}
