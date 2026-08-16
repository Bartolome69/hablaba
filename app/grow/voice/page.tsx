"use client"

// Hands-free voice conversation. Sibling of /grow/sparring: same full-screen
// treatment, same "your week, out loud" job — but spoken, with the parent
// pushing a pram instead of typing.
//
// Unlinked for now (see components/criar/grow-section-nav.tsx: the entry only
// appears once `criar_voice_enabled` is set), so it's dogfoodable by URL
// without showing up for anyone else.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { History, Mic, MicOff, RotateCcw, Sun, WifiOff } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { CriarHeader } from "@/components/criar/criar-header"
import { LiveTranscript } from "@/components/criar/voice/live-transcript"
import { VoiceOrb } from "@/components/criar/voice/voice-orb"
import { ensureSeeded } from "@/lib/criar/seed"
import { assembleSessionContext } from "@/lib/criar/session-context"
import type { CriarChild } from "@/lib/criar/types"
import {
  CORRECTION_LEVELS,
  CORRECTION_LEVEL_KEY,
  DEFAULT_CORRECTION_LEVEL,
  isCorrectionLevel,
  KEEP_AWAKE_KEY,
  MAX_SESSION_SECONDS,
  SESSION_WARNING_SECONDS,
  type CorrectionLevel,
} from "@/lib/criar/voice/config"
import { defaultKeepScreenAwake, micPermissionHelp } from "@/lib/criar/voice/platform"
import { useMediaSession } from "@/lib/criar/voice/use-media-session"
import { useVoiceSession } from "@/lib/criar/voice/use-voice-session"
import { useWakeLock } from "@/lib/criar/voice/use-wake-lock"

const MIC_EXPLAINER_SEEN = "criar_voice_mic_explained"

export default function VoicePage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const [showExplainer, setShowExplainer] = useState(false)
  const [keepAwake, setKeepAwake] = useState(false)
  const [correctionLevel, setCorrectionLevel] = useState<CorrectionLevel>(DEFAULT_CORRECTION_LEVEL)
  const posthog = usePostHog()
  const startedRef = useRef(false)

  const { state, turns, error, userSpeaking, elapsed, sessionId, start, stop } =
    useVoiceSession(child)

  useWakeLock(state === "live" && keepAwake)

  // Lock-screen stop button, so the phone can go back in the pocket.
  useMediaSession(state === "live", stop)

  useEffect(() => {
    setChild(ensureSeeded())
    try {
      setShowExplainer(localStorage.getItem(MIC_EXPLAINER_SEEN) !== "1")
      const stored = localStorage.getItem(KEEP_AWAKE_KEY)
      setKeepAwake(stored === null ? defaultKeepScreenAwake() : stored === "1")
      const level = localStorage.getItem(CORRECTION_LEVEL_KEY)
      if (isCorrectionLevel(level)) setCorrectionLevel(level)
    } catch {
      setShowExplainer(true)
      setKeepAwake(defaultKeepScreenAwake())
    }
  }, [])

  const pickCorrectionLevel = useCallback((level: CorrectionLevel) => {
    setCorrectionLevel(level)
    try {
      localStorage.setItem(CORRECTION_LEVEL_KEY, level)
    } catch {}
  }, [])

  const toggleKeepAwake = useCallback(() => {
    setKeepAwake((prev) => {
      const next = !prev
      try {
        localStorage.setItem(KEEP_AWAKE_KEY, next ? "1" : "0")
      } catch {}
      return next
    })
  }, [])

  useEffect(() => {
    if (state === "live" && !startedRef.current) {
      startedRef.current = true
      posthog.capture("criar_voice_session_started")
    }
    if (state === "ended" && startedRef.current) {
      startedRef.current = false
      posthog.capture("criar_voice_session_ended", { duration_seconds: elapsed, turns: turns.length })
    }
    // elapsed/turns are read at transition time only — not triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, posthog])

  const handleStart = () => {
    if (!child) return
    // The explainer is shown once, before the OS prompt, so the permission
    // dialog never arrives unexplained. Safari gives no second chance if it's
    // dismissed — recovering means a trip to Settings.
    if (showExplainer) {
      try {
        localStorage.setItem(MIC_EXPLAINER_SEEN, "1")
      } catch {}
      setShowExplainer(false)
    }
    // Same curriculum query as sparring: this week's pack phrases + capture
    // lessons, woven into the partner's instructions server-side.
    void start({ ...assembleSessionContext(child), correctionLevel })
  }

  const nearLimit = useMemo(
    () => state === "live" && MAX_SESSION_SECONDS - elapsed <= SESSION_WARNING_SECONDS,
    [state, elapsed],
  )

  if (!child) return <div className="min-h-dvh bg-background" />

  return (
    <div className="fixed inset-0 mx-auto flex max-w-lg flex-col bg-background">
      <div className="flex-shrink-0 px-4 pt-6">
        <CriarHeader
          child={child}
          onChildUpdate={setChild}
          title="Charlar"
          subtitle="Sin manos · 5–15 min"
          action={
            <div className="flex gap-2">
              <Link
                href="/grow/voice/historial"
                aria-label="Charlas anteriores"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-[0.98]"
              >
                <History className="h-4 w-4" />
              </Link>
              <button
                onClick={toggleKeepAwake}
              aria-label={keepAwake ? "Dejar que la pantalla se apague" : "Mantener la pantalla encendida"}
              aria-pressed={keepAwake}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-secondary transition-all active:scale-[0.98] ${
                keepAwake ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              >
                <Sun className={`h-4 w-4 ${keepAwake ? "fill-current" : ""}`} />
              </button>
            </div>
          }
        />
      </div>

      {/* Changing this mid-conversation can't take effect (instructions are
          fixed when the session is minted), so it hides while live rather than
          pretending otherwise. */}
      {(state === "idle" || state === "ended" || state === "error") && (
        <div className="mx-4 mb-2 flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Corrígeme</span>
          <div className="flex flex-1 gap-1 rounded-full bg-secondary p-1">
            {CORRECTION_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => pickCorrectionLevel(level)}
                aria-pressed={correctionLevel === level}
                className={`flex-1 rounded-full py-1.5 text-center text-xs font-medium transition-colors ${
                  correctionLevel === level
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {showExplainer && state === "idle" && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-secondary/60 px-4 py-3">
          <Mic className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Vamos a usar el micrófono para charlar en voz alta. Tu teléfono te va a pedir permiso
            una sola vez. Después podés apagar la pantalla y guardarlo en el bolsillo — la
            conversación sigue.
          </p>
        </div>
      )}

      {state === "interrupted" && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-amber-500/10 px-4 py-3">
          <WifiOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <p className="text-sm leading-relaxed text-foreground text-pretty">
            La conversación se pausó cuando saliste de la pantalla. Lo que hablaste quedó acá abajo
            — tocá <span className="font-medium">Volver</span> para seguir.
          </p>
        </div>
      )}

      {state === "error" && error && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3">
          {error.kind === "mic-denied" ? (
            <MicOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          ) : (
            <RotateCcw className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          )}
          <div className="text-sm leading-relaxed text-foreground text-pretty">
            <p>{error.message}</p>
            {error.kind === "mic-denied" && (
              <p className="mt-1 text-muted-foreground">{micPermissionHelp()}</p>
            )}
          </div>
        </div>
      )}

      {state === "ended" && sessionId && (
        <div className="mx-4 mb-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-pretty">
          <p className="text-foreground">Quedó guardada la charla.</p>
          <Link href={`/grow/voice/${sessionId}`} className="font-medium text-primary underline-offset-2 hover:underline">
            Ver la conversación completa →
          </Link>
        </div>
      )}

      {nearLimit && (
        <p className="mx-4 mb-2 text-center text-xs font-medium text-amber-600 dark:text-amber-500">
          Estamos por cerrar la sesión — ya casi llegamos a los 15 minutos.
        </p>
      )}

      <LiveTranscript
        turns={turns}
        hint={
          state === "idle"
            ? "Tocá el micrófono y contale cómo viene tu día con el bebé."
            : state === "connecting" || state === "requesting-mic"
              ? "Un segundito…"
              : undefined
        }
      />

      <div className="flex-shrink-0 border-t border-border">
        <VoiceOrb
          state={state}
          userSpeaking={userSpeaking}
          elapsed={elapsed}
          nearLimit={nearLimit}
          onStart={handleStart}
          onStop={stop}
        />
      </div>
    </div>
  )
}
