"use client"

// Voice session state. Deliberately the same shape as `use-sparring.ts` — plain
// hooks and refs, no state library — so the two feel like siblings.
//
// This hook is engine-agnostic: it holds a `VoiceEngine` and never imports
// anything OpenAI-specific. The factory below is the single line that changes
// when we trial ElevenLabs.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { VoiceEngine, VoiceEngineFactory } from "./adapter"
import { createOpenAIRealtimeEngine } from "./openai-realtime"
import { MAX_SESSION_SECONDS } from "./config"
import type { VoiceConnectionState, VoiceEngineMeta, VoiceError, VoiceTurn } from "./types"

const engineFactory: VoiceEngineFactory = createOpenAIRealtimeEngine

export interface VoiceSessionController {
  state: VoiceConnectionState
  turns: VoiceTurn[]
  error: VoiceError | null
  userSpeaking: boolean
  /** Seconds since the conversation went live. */
  elapsed: number
  meta: VoiceEngineMeta | null
  start: () => Promise<void>
  stop: () => void
}

export function useVoiceSession(): VoiceSessionController {
  const [state, setState] = useState<VoiceConnectionState>("idle")
  const [turnMap, setTurnMap] = useState<Record<string, VoiceTurn>>({})
  const [error, setError] = useState<VoiceError | null>(null)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [meta, setMeta] = useState<VoiceEngineMeta | null>(null)

  const engineRef = useRef<VoiceEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stateRef = useRef<VoiceConnectionState>("idle")
  stateRef.current = state

  const teardown = useCallback(() => {
    engineRef.current?.stop()
    engineRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.srcObject = null
      audioRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    if (stateRef.current === "idle" || stateRef.current === "ended") return
    teardown()
    setUserSpeaking(false)
    setState((prev) => (prev === "error" ? prev : "ended"))
  }, [teardown])

  const start = useCallback(async () => {
    if (engineRef.current) return
    setError(null)
    setTurnMap({})
    setElapsed(0)
    setUserSpeaking(false)
    setState("requesting-mic")

    // Created here, inside the tap handler's call stack, because mobile Safari
    // only unlocks audio playback from a real user gesture. Creating it later
    // (when the first remote track arrives) gets the playback refused.
    const audio = new Audio()
    audio.autoplay = true
    // Safari needs this to route to the speaker rather than treat the element
    // as a silent background player.
    audio.setAttribute("playsinline", "true")
    audioRef.current = audio

    const engine = engineFactory({
      onTurn: (turn) => {
        setTurnMap((prev) => {
          // An empty final turn means the engine dropped it (failed
          // transcription) — remove it rather than render a blank bubble.
          if (turn.final && !turn.text.trim()) {
            const { [turn.id]: _discarded, ...rest } = prev
            return rest
          }
          return { ...prev, [turn.id]: turn }
        })
      },
      onOpen: (engineMeta) => {
        setMeta(engineMeta)
        setState("live")
      },
      onClose: () => {
        setUserSpeaking(false)
        setState((prev) => (prev === "error" ? prev : "ended"))
      },
      onError: (err) => {
        setError(err)
        setState("error")
        teardown()
      },
      onUserSpeaking: setUserSpeaking,
    })

    engineRef.current = engine
    setState("connecting")
    await engine.start({ audioElement: audio })
  }, [teardown])

  // Elapsed timer + the hard cost cap. Counts only while actually live.
  useEffect(() => {
    if (state !== "live") return
    const id = window.setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next >= MAX_SESSION_SECONDS) stop()
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [state, stop])

  // iOS suspends audio capture when Safari backgrounds or the screen locks, and
  // does not resume it. Rather than leave a session that looks live but is
  // deaf, we end it and say so — the UI offers an explicit reconnect.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return
      if (stateRef.current !== "live" && stateRef.current !== "connecting") return
      teardown()
      setUserSpeaking(false)
      setState("interrupted")
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [teardown])

  // Leaving the screen must release the mic.
  useEffect(() => teardown, [teardown])

  const turns = useMemo(
    () => Object.values(turnMap).sort((a, b) => a.ordinal - b.ordinal),
    [turnMap],
  )

  return { state, turns, error, userSpeaking, elapsed, meta, start, stop }
}
