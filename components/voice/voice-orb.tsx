"use client"

// The voice console, Clay + calm. Three controls in a row, every one labelled
// — "cuadrado = terminar y guardar" explained in text is exactly what this
// replaces — under a live caption bar that shows what the mic is hearing, so
// the pause disc never covers the conversation and you always know she's
// listening.
//
// The big disc is always the thing you most likely want next — pause or
// resume. Ending is a deliberately separate target, because ending is the one
// action you can't undo: reaching for "pause" and hitting "stop" would lose
// the thread of the conversation.

import { DuoIcon } from "@/components/icons"
import type { VoiceConnectionState } from "@/lib/voice/types"

const PRIMARY_LABELS: Record<VoiceConnectionState, string> = {
  idle: "Empezar",
  "requesting-mic": "Permitiendo…",
  connecting: "Conectando…",
  live: "Pausar",
  paused: "Continuar",
  interrupted: "Volver",
  ended: "Empezar de nuevo",
  error: "Reintentar",
}

const CAPTION_FALLBACK: Record<VoiceConnectionState, string> = {
  idle: "Listo cuando quieras",
  "requesting-mic": "Esperando el micrófono…",
  connecting: "Conectando…",
  live: "Te escucho — hablá cuando quieras",
  paused: "En pausa · nadie te escucha",
  interrupted: "Se pausó al salir de la pantalla",
  ended: "Charla guardada",
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
  caption,
  elapsed,
  nearLimit,
  onStart,
  onPause,
  onResume,
  onStop,
  outputGain,
  onCycleGain,
}: {
  state: VoiceConnectionState
  userSpeaking: boolean
  /** Partial transcript of what the parent is saying right now. */
  caption?: string
  elapsed: number
  nearLimit: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  outputGain: number
  onCycleGain: () => void
}) {
  const live = state === "live"
  const paused = state === "paused"
  const busy = state === "connecting" || state === "requesting-mic"
  const inConversation = live || paused

  const primaryAction = live ? onPause : paused ? onResume : busy ? onStop : onStart
  const barsAnimate = live && (userSpeaking || !caption)

  return (
    <div
      className="flex flex-col items-center gap-3.5 px-[22px] pt-[18px]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
    >
      {/* Live caption bar: the proof she's hearing you, without a screen full
          of transcript between you and the pause button. */}
      <div className="flex w-full items-center gap-2.5 rounded-2xl bg-sunken px-3.5 py-[9px]">
        <div className="flex h-[15px] flex-none items-end gap-[3px]" aria-hidden>
          {[0.4, 0.65, 1, 0.65].map((opacity, i) => (
            <span
              key={i}
              className={`w-[3px] rounded-[2px] ${i === 2 ? "bg-terracotta" : "bg-green"} ${
                barsAnimate ? "anim-bar" : ""
              }`}
              style={{
                height: barsAnimate ? 15 : 4 + i * 2 - (i === 3 ? 4 : 0),
                opacity: i === 2 ? 1 : opacity,
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
        <span
          aria-live="polite"
          className="min-w-0 flex-1 truncate font-serif text-[13px] text-ink-muted"
        >
          {caption || CAPTION_FALLBACK[state]}
        </span>
        {inConversation && (
          <span
            className={`flex-none text-[11px] font-medium tabular-nums ${
              nearLimit ? "text-terracotta-ink" : "text-ink-soft"
            }`}
          >
            {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* Volume: adjustable mid-conversation (unlike topic or corrígeme,
            which are baked in when the session is minted). */}
        <div className="flex w-[62px] flex-col items-center gap-1.5">
          <button
            onClick={onCycleGain}
            aria-label={`Volumen ${outputGain}× — tocá para cambiar`}
            className="clay-card flex h-14 w-14 items-center justify-center rounded-full text-ink"
          >
            <DuoIcon name="escuchar" size={24} />
          </button>
          <span className="text-[11px] text-ink-soft">Volumen {outputGain}×</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="relative flex h-[112px] w-[112px] items-center justify-center">
            {live && (
              <span aria-hidden className="anim-breathe absolute inset-0 rounded-full bg-green-ring" />
            )}
            <button
              onClick={primaryAction}
              disabled={state === "requesting-mic"}
              aria-label={PRIMARY_LABELS[state]}
              className="clay-green-disc relative flex h-[88px] w-[88px] items-center justify-center rounded-full text-cream disabled:opacity-70"
            >
              {busy ? (
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="#F7F3EC" strokeOpacity=".3" strokeWidth="2.6" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="#F7F3EC" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
              ) : live ? (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <rect x="7" y="5" width="4" height="14" rx="2" fill="#F7F3EC" />
                  <rect x="13" y="5" width="4" height="14" rx="2" fill="#F7F3EC" />
                </svg>
              ) : paused ? (
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M8.8 5.4 18 12l-9.2 6.6Z"
                    fill="#F7F3EC"
                    stroke="#F7F3EC"
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <DuoIcon name="micro" size={32} detail="#8FBE9C" />
              )}
            </button>
          </div>
          <span className="text-[12.5px] font-semibold text-ink" aria-live="polite">
            {PRIMARY_LABELS[state]}
          </span>
        </div>

        <div className="flex w-[62px] flex-col items-center gap-1.5">
          <button
            onClick={onStop}
            aria-label="Terminar y guardar la charla"
            className="clay-card flex h-14 w-14 items-center justify-center rounded-full"
          >
            <DuoIcon name="parar" size={22} />
          </button>
          <span className="text-[11px] text-ink-soft">Terminar</span>
        </div>
      </div>
    </div>
  )
}
