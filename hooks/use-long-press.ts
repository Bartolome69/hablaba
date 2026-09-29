"use client"

// Press-and-hold for list rows. A pointer timer is the primary path because
// iOS Safari never fires `contextmenu` on a long touch; `contextmenu` is kept
// as a second path so desktop right-click (and Android, which does fire it)
// opens the same actions. Moving the finger more than a few pixels cancels, so
// scrolling a list of rows can never trigger it.

import { useCallback, useRef } from "react"

const HOLD_MS = 450
const MOVE_TOLERANCE = 8

export function useLongPress(onLongPress: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const fired = useRef(false)

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    origin.current = null
  }, [])

  const trigger = useCallback(() => {
    if (fired.current) return
    fired.current = true
    try {
      navigator.vibrate?.(12)
    } catch {}
    onLongPress()
  }, [onLongPress])

  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return
      fired.current = false
      origin.current = { x: e.clientX, y: e.clientY }
      timer.current = setTimeout(trigger, HOLD_MS)
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!origin.current) return
      const dx = Math.abs(e.clientX - origin.current.x)
      const dy = Math.abs(e.clientY - origin.current.y)
      if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clear()
    },
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault()
      clear()
      trigger()
    },
  }
}
