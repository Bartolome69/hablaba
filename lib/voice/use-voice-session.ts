"use client"

// Voice session state. Deliberately the same shape as `use-sparring.ts` — plain
// hooks and refs, no state library — so the two feel like siblings.
//
// Engine-agnostic AND surface-agnostic: it holds a `VoiceEngine` (the factory
// below is the single line that changes when we trial ElevenLabs) and writes
// through a `VoicePersistence` adapter, so Grow binds it to the criar_* tables
// and Speak to its own — the hook never knows whose transcript this is.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { VoiceEngine, VoiceEngineFactory } from "./adapter"
import { createOpenAIRealtimeEngine } from "./openai-realtime"
import { MAX_SESSION_SECONDS } from "./config"
import { suspendsAudioOnBackground } from "./platform"
import type {
  VoiceConnectionState,
  VoiceEngineMeta,
  VoiceError,
  VoiceSeedContext,
  VoiceSessionRecord,
  VoiceTurn,
  VoiceTurnRecord,
} from "./types"

const engineFactory: VoiceEngineFactory = createOpenAIRealtimeEngine

/** How a surface stores its sessions. All writes are synchronous (localStorage). */
export interface VoicePersistence {
  createSession(session: VoiceSessionRecord): void
  saveTurn(turn: VoiceTurnRecord): void
  endSession(id: string, endedAt: string, durationSeconds: number): void
}

export interface VoiceSessionController {
  state: VoiceConnectionState
  turns: VoiceTurn[]
  error: VoiceError | null
  userSpeaking: boolean
  /** Seconds since the conversation went live. */
  elapsed: number
  meta: VoiceEngineMeta | null
  /** Persisted id of the most recent conversation — the link target for "ver la charla". */
  sessionId: string | null
  start: (seedContext: VoiceSeedContext) => Promise<void>
  stop: () => void
}

export function useVoiceSession(
  persistence: VoicePersistence | null,
  sessionEndpoint: string,
): VoiceSessionController {
  const [state, setState] = useState<VoiceConnectionState>("idle")
  const [turnMap, setTurnMap] = useState<Record<string, VoiceTurn>>({})
  const [error, setError] = useState<VoiceError | null>(null)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [meta, setMeta] = useState<VoiceEngineMeta | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)

  const engineRef = useRef<VoiceEngine | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stateRef = useRef<VoiceConnectionState>("idle")
  stateRef.current = state

  // Persistence bookkeeping. Turns are written to the store as they finalise
  // (a killed tab loses at most the turn in flight); anything still partial
  // when the session ends is flushed then.
  const sessionIdRef = useRef<string | null>(null)
  const sessionStartedAtRef = useRef<number>(0)
  const liveTurnsRef = useRef<Record<string, VoiceTurn>>({})
  const writtenTurnIdsRef = useRef<Set<string>>(new Set())
  const persistenceRef = useRef(persistence)
  persistenceRef.current = persistence
  const endpointRef = useRef(sessionEndpoint)
  endpointRef.current = sessionEndpoint

  const persistTurn = useCallback((turn: VoiceTurn) => {
    const sid = sessionIdRef.current
    if (!sid || !turn.text.trim() || writtenTurnIdsRef.current.has(turn.id)) return
    writtenTurnIdsRef.current.add(turn.id)
    persistenceRef.current?.saveTurn({
      id: turn.id,
      sessionId: sid,
      speaker: turn.speaker,
      text: turn.text,
      startedAt: turn.startedAt,
      ordinal: turn.ordinal,
    })
  }, [])

  /** Stamp the session ended and flush still-partial turns. Idempotent. */
  const persistSessionEnd = useCallback(() => {
    const sid = sessionIdRef.current
    if (!sid) return
    for (const turn of Object.values(liveTurnsRef.current)) persistTurn(turn)
    persistenceRef.current?.endSession(
      sid,
      new Date().toISOString(),
      Math.round((Date.now() - sessionStartedAtRef.current) / 1000),
    )
    sessionIdRef.current = null
  }, [persistTurn])

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
    persistSessionEnd()
    setUserSpeaking(false)
    setState((prev) => (prev === "error" ? prev : "ended"))
  }, [teardown, persistSessionEnd])

  const start = useCallback(async (seedContext: VoiceSeedContext) => {
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

    liveTurnsRef.current = {}
    writtenTurnIdsRef.current = new Set()

    const engine = engineFactory({
      onTurn: (turn) => {
        if (turn.final && !turn.text.trim()) {
          // Dropped by the engine (failed transcription) — remove everywhere.
          delete liveTurnsRef.current[turn.id]
          setTurnMap((prev) => {
            const { [turn.id]: _discarded, ...rest } = prev
            return rest
          })
          return
        }
        if (turn.final) {
          delete liveTurnsRef.current[turn.id]
          persistTurn(turn)
        } else {
          liveTurnsRef.current[turn.id] = turn
        }
        setTurnMap((prev) => ({ ...prev, [turn.id]: turn }))
      },
      onOpen: (engineMeta) => {
        setMeta(engineMeta)
        // The session row exists from the moment the conversation is live —
        // its turns attach to it as they finalise.
        if (persistenceRef.current) {
          const id = crypto.randomUUID()
          sessionIdRef.current = id
          sessionStartedAtRef.current = Date.now()
          setSessionId(id)
          persistenceRef.current.createSession({
            id,
            startedAt: new Date().toISOString(),
            endedAt: null,
            durationSeconds: null,
            seedContext,
            engineMeta,
          })
        }
        setState("live")
      },
      onClose: () => {
        persistSessionEnd()
        setUserSpeaking(false)
        setState((prev) => (prev === "error" ? prev : "ended"))
      },
      onError: (err) => {
        setError(err)
        setState("error")
        teardown()
        persistSessionEnd()
      },
      onUserSpeaking: setUserSpeaking,
    })

    engineRef.current = engine
    setState("connecting")
    await engine.start({ audioElement: audio, seedContext, sessionEndpoint: endpointRef.current })
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

  // Backgrounding is platform-dependent, and getting this wrong in either
  // direction is bad: on iOS the mic is suspended and never resumes, so a
  // session left "live" is silently deaf; on Android the session keeps running
  // with the screen off, which is the entire point of hands-free mode, and
  // stopping it here would throw that away. Only iOS gets the pause.
  useEffect(() => {
    if (!suspendsAudioOnBackground()) return
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return
      if (stateRef.current !== "live" && stateRef.current !== "connecting") return
      teardown()
      persistSessionEnd()
      setUserSpeaking(false)
      setState("interrupted")
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => document.removeEventListener("visibilitychange", onVisibility)
  }, [teardown, persistSessionEnd])

  // Leaving the screen must release the mic (and close out the session row).
  useEffect(
    () => () => {
      teardown()
      persistSessionEnd()
    },
    [teardown, persistSessionEnd],
  )

  const turns = useMemo(
    () => Object.values(turnMap).sort((a, b) => a.ordinal - b.ordinal),
    [turnMap],
  )

  return { state, turns, error, userSpeaking, elapsed, meta, sessionId, start, stop }
}
