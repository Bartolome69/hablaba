"use client"

import { useEffect, useRef, useState } from "react"

// Smoothly reveals `target` character-by-character at an eased cadence while
// `active`, decoupled from how the text actually arrives over the network — so
// bursty chunks still flow out naturally, Claude-style. When not active (e.g. a
// message restored from cache) the full text shows immediately.
export function useStreamedText(target: string, active: boolean): { text: string; caret: boolean } {
  const [shown, setShown] = useState(() => (active ? 0 : target.length))
  const shownRef = useRef(shown)
  shownRef.current = shown

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const total = target.length
      if (shownRef.current >= total) return // caught up — stop until more arrives
      const remaining = total - shownRef.current
      // Reveal a few characters per frame — gentle enough to read as a natural
      // type-out, capped so a fully-buffered reply still eases in (~a few
      // hundred cps) rather than snapping in all at once.
      const step = Math.min(remaining, Math.max(1, Math.min(6, Math.ceil(remaining / 8))))
      shownRef.current += step
      setShown(shownRef.current)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, active])

  const clamped = Math.min(shown, target.length)
  return { text: target.slice(0, clamped), caret: active || clamped < target.length }
}
