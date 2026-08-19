"use client"

// The conversation controls. Sized and positioned for a thumb on a phone that's
// being held one-handed over a pram.
//
// The big button is always the thing you most likely want next — start, pause,
// or resume. Ending is a deliberately separate, smaller target, because ending
// is the one action you can't undo: reaching for "pause" and hitting "stop"
// would lose the thread of the conversation.

import { Loader2, Mic, Play, Square } from "lucide-react"
import type { VoiceConnectionState } from "@/lib/voice/types"

const PRIMARY_LABELS: Record<VoiceConnectionState, string> = {
  idle: "Empezar",
  "requesting-mic": "Permitiendo…",
  connecting: "Conectando…",
  live: "Pausar",
  paused: "Seguir",
  interrupted: "Volver",
  ended: "Empezar de nuevo",
  error: "Reintentar",
}

const STATUS: Record<VoiceConnectionState, string> = {
  idle: "Listo cuando quieras",
  "requesting-mic": "Esperando el micrófono",
  connecting: "Conectando",
  live: "En línea",
  paused: "En pausa · micrófono apagado",
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
  onPause,
  onResume,
  onStop,
}: {
  state: VoiceConnectionState
  userSpeaking: boolean
  elapsed: number
  nearLimit: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
}) {
  const live = state === "live"
  const paused = state === "paused"
  const busy = state === "connecting" || state === "requesting-mic"
  const inConversation = live || paused

  const primaryAction = live ? onPause : paused ? onResume : busy ? onStop : onStart

  return (
    <div className="flex flex-col items-center gap-3 px-4 pb-6 pt-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          aria-hidden
          className={`h-1.5 w-1.5 rounded-full ${
            live
              ? "bg-emerald-500"
              : paused
                ? "bg-amber-500"
                : state === "error"
                  ? "bg-destructive"
                  : busy
                    ? "bg-amber-500 animate-pulse"
                    : "bg-muted-foreground/40"
          }`}
        />
        <span aria-live="polite">{STATUS[state]}</span>
        {inConversation && (
          <span className={nearLimit ? "text-amber-600 dark:text-amber-500" : undefined}>
            · {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Spacer keeps the primary button optically centred when the end
            button is showing, so its position doesn't shift mid-conversation. */}
        {inConversation && <div aria-hidden className="h-12 w-12" />}

        <button
          onClick={primaryAction}
          disabled={state === "requesting-mic"}
          aria-label={PRIMARY_LABELS[state]}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform active:scale-[0.96] disabled:opacity-70 ${
            live ? "bg-foreground" : "bg-primary"
          }`}
        >
          {/* Breathing ring while the parent is being heard — the only feedback
              that the mic is actually picking them up, at a glance, at arm's length. */}
          {live && userSpeaking && (
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-foreground/30"
            />
          )}
          {busy ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : live ? (
            <span aria-hidden className="flex gap-1.5">
              <span className="h-6 w-[5px] rounded-sm bg-current" />
              <span className="h-6 w-[5px] rounded-sm bg-current" />
            </span>
          ) : paused ? (
            <Play className="ml-0.5 h-7 w-7 fill-current" />
          ) : (
            <Mic className="h-7 w-7" />
          )}
        </button>

        {inConversation && (
          <button
            onClick={onStop}
            aria-label="Terminar y guardar la charla"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-[0.97]"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{PRIMARY_LABELS[state]}</p>
      {inConversation && (
        <p className="-mt-2 text-xs text-muted-foreground">
          {paused ? "Nadie te escucha · tocá para seguir" : "Cuadrado = terminar y guardar"}
        </p>
      )}
    </div>
  )
}
