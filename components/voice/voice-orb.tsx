"use client"

// The one control. Sized and positioned for a thumb on a phone that's being
// held one-handed over a pram — everything else on the screen is read-only.

import { Loader2, Mic, Square } from "lucide-react"
import type { VoiceConnectionState } from "@/lib/voice/types"

const LABELS: Record<VoiceConnectionState, string> = {
  idle: "Empezar",
  "requesting-mic": "Permitiendo…",
  connecting: "Conectando…",
  live: "Terminar",
  interrupted: "Volver",
  ended: "Empezar de nuevo",
  error: "Reintentar",
}

const STATUS: Record<VoiceConnectionState, string> = {
  idle: "Listo cuando quieras",
  "requesting-mic": "Esperando el micrófono",
  connecting: "Conectando",
  live: "En línea",
  interrupted: "Se pausó",
  ended: "Terminada",
  error: "Algo falló",
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function VoiceOrb({
  state,
  userSpeaking,
  elapsed,
  nearLimit,
  onStart,
  onStop,
}: {
  state: VoiceConnectionState
  userSpeaking: boolean
  elapsed: number
  nearLimit: boolean
  onStart: () => void
  onStop: () => void
}) {
  const live = state === "live"
  const busy = state === "connecting" || state === "requesting-mic"

  return (
    <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            live
              ? "bg-emerald-500"
              : state === "error"
                ? "bg-destructive"
                : busy
                  ? "bg-amber-500 animate-pulse"
                  : "bg-muted-foreground/40"
          }`}
        />
        <span aria-live="polite">{STATUS[state]}</span>
        {live && (
          <span className={nearLimit ? "text-amber-600 dark:text-amber-500" : undefined}>
            · {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      <button
        onClick={live || busy ? onStop : onStart}
        disabled={state === "requesting-mic"}
        aria-label={LABELS[state]}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform active:scale-[0.96] disabled:opacity-70 ${
          live ? "bg-destructive" : "bg-primary"
        }`}
      >
        {/* Breathing ring while the parent is being heard — the only feedback
            that the mic is actually picking them up, at a glance, at arm's length. */}
        {live && userSpeaking && (
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full bg-destructive/40"
          />
        )}
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : live ? (
          <Square className="h-6 w-6 fill-current" />
        ) : (
          <Mic className="h-7 w-7" />
        )}
      </button>

      <p className="text-sm font-medium text-foreground">{LABELS[state]}</p>
    </div>
  )
}
