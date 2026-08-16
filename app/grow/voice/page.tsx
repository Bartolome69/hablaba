"use client"

// Hands-free voice conversation. Sibling of /grow/sparring: same full-screen
// treatment, same "your week, out loud" job — but spoken, with the parent
// pushing a pram instead of typing.
//
// Unlinked for now (see components/criar/grow-section-nav.tsx: the entry only
// appears once `criar_voice_enabled` is set), so it's dogfoodable by URL
// without showing up for anyone else.

import { useEffect, useMemo, useRef, useState } from "react"
import { Mic, MicOff, RotateCcw, WifiOff } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { CriarHeader } from "@/components/criar/criar-header"
import { LiveTranscript } from "@/components/criar/voice/live-transcript"
import { VoiceOrb } from "@/components/criar/voice/voice-orb"
import { ensureSeeded } from "@/lib/criar/seed"
import type { CriarChild } from "@/lib/criar/types"
import { MAX_SESSION_SECONDS, SESSION_WARNING_SECONDS } from "@/lib/criar/voice/config"
import { useVoiceSession } from "@/lib/criar/voice/use-voice-session"
import { useWakeLock } from "@/lib/criar/voice/use-wake-lock"

const MIC_EXPLAINER_SEEN = "criar_voice_mic_explained"

export default function VoicePage() {
  const [child, setChild] = useState<CriarChild | null>(null)
  const [showExplainer, setShowExplainer] = useState(false)
  const posthog = usePostHog()
  const startedRef = useRef(false)

  const { state, turns, error, userSpeaking, elapsed, start, stop } = useVoiceSession()

  useWakeLock(state === "live")

  useEffect(() => {
    setChild(ensureSeeded())
    try {
      setShowExplainer(localStorage.getItem(MIC_EXPLAINER_SEEN) !== "1")
    } catch {
      setShowExplainer(true)
    }
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
    // The explainer is shown once, before the OS prompt, so the permission
    // dialog never arrives unexplained. Safari gives no second chance if it's
    // dismissed — recovering means a trip to Settings.
    if (showExplainer) {
      try {
        localStorage.setItem(MIC_EXPLAINER_SEEN, "1")
      } catch {}
      setShowExplainer(false)
    }
    void start()
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
        />
      </div>

      {showExplainer && state === "idle" && (
        <div className="mx-4 mb-2 flex items-start gap-3 rounded-xl bg-secondary/60 px-4 py-3">
          <Mic className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
            Vamos a usar el micrófono para charlar en voz alta. Tu teléfono te va a pedir permiso
            una sola vez. Podés dejarlo en el bolsillo y seguir caminando.
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
              <p className="mt-1 text-muted-foreground">
                En iPhone: Ajustes → Safari → Micrófono, y permitilo para este sitio.
              </p>
            )}
          </div>
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
