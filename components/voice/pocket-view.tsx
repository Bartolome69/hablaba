"use client"

// The pocket view (refresh Phase 6): a dark, near-empty screen for a voice
// conversation with the phone in a pocket or on the pram handle. Dark because
// the screen has to stay on (on iPhone the session stops when it locks) and a
// dark screen glares less and costs less battery on OLED. Two controls only,
// both at least 56px, both labelled:
//   - Pausa / Seguir: one tap, the thing you most likely want
//   - Terminar: press and HOLD, so a pocket or a toddler can't end the
//     conversation by accident (ending is the one action you can't undo)

import { useEffect, useRef, useState } from "react"
import { DuoIcon } from "@/components/icons"
import type { VoiceConnectionState } from "@/lib/voice/types"

const HOLD_TO_END_MS = 1000

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m}:${String(seconds % 60).padStart(2, "0")}`
}

export function PocketView({
  state,
  elapsed,
  userSpeaking,
  screenNote,
  onPause,
  onResume,
  onStop,
  onExit,
}: {
  state: VoiceConnectionState
  elapsed: number
  userSpeaking: boolean
  /** One line about the screen (iPhone: why it stays on). */
  screenNote?: string
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onExit: () => void
}) {
  const live = state === "live"
  const paused = state === "paused"
  const [holding, setHolding] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startHold = () => {
    setHolding(true)
    timer.current = setTimeout(() => {
      setHolding(false)
      try {
        navigator.vibrate?.(20)
      } catch {}
      onStop()
    }, HOLD_TO_END_MS)
  }
  const cancelHold = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }
  useEffect(() => () => cancelHold(), [])

  return (
    <div
      className="fixed inset-0 z-[60] mx-auto flex max-w-lg flex-col bg-green-press px-[22px] text-cream"
      style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top))", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      role="dialog"
      aria-label="Charla en el bolsillo"
    >
      <div className="flex items-center justify-between">
        <p className="smallcaps-lg text-green-on-dark">Bolsillo</p>
        <button onClick={onExit} className="flex h-11 items-center px-2 text-[14px] font-medium text-green-on-dark underline underline-offset-4">
          Salir del bolsillo
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <span
          aria-hidden
          className={`h-24 w-24 rounded-full ${live ? "anim-breathe bg-green-well" : "bg-green"}`}
          style={{ boxShadow: userSpeaking && live ? "0 0 0 10px rgba(168,208,180,.18)" : undefined }}
        />
        <p className="font-serif text-[30px] leading-tight tracking-[-0.015em]" aria-live="polite">
          {live ? "Te escucho" : paused ? "En pausa" : "Conectando…"}
        </p>
        <p className="text-[15px] tabular-nums text-green-on-dark">{formatElapsed(elapsed)}</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={live ? onPause : onResume}
          disabled={!live && !paused}
          className="flex h-[88px] w-full items-center justify-center gap-3 rounded-full bg-green-well text-[22px] font-semibold text-cream disabled:opacity-60"
          style={{ boxShadow: "0 4px 0 #0B2414" }}
        >
          <DuoIcon name={live ? "pausa" : "play"} size={28} className="text-cream" detail="#A8D0B4" />
          {live ? "Pausa" : "Seguir"}
        </button>
        <button
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !e.repeat && startHold()}
          onKeyUp={cancelHold}
          aria-label="Terminar: mantén pulsado"
          className="relative flex h-16 w-full select-none items-center justify-center overflow-hidden rounded-full text-[19px] font-bold text-cream [-webkit-touch-callout:none]"
          style={{ boxShadow: "inset 0 0 0 1.5px rgba(247,243,236,.35)" }}
        >
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-terracotta"
            style={{
              width: holding ? "100%" : "0%",
              transition: holding ? `width ${HOLD_TO_END_MS}ms linear` : "width 150ms ease-out",
            }}
          />
          <span className="relative">{holding ? "Sigue pulsando…" : "Mantén para terminar"}</span>
        </button>
        {screenNote && <p className="mt-1 text-center text-[13px] leading-snug text-green-on-dark">{screenNote}</p>}
      </div>
    </div>
  )
}
