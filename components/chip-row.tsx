"use client"

// A single-line, horizontally scrolling chip row that never hard-slices a
// pill: the edges carry a soft fade instead, and each fade only appears when
// there is actually content hiding beyond it. Vertical padding keeps the
// pills' 2–3px lips out of the scroll clip.

import { useCallback, useEffect, useRef, useState } from "react"

const FADE_PX = 32
const EPSILON = 4

export function ChipRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [fadeLeft, setFadeLeft] = useState(false)
  const [fadeRight, setFadeRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setFadeLeft(el.scrollLeft > EPSILON)
    setFadeRight(el.scrollLeft < el.scrollWidth - el.clientWidth - EPSILON)
  }, [])

  useEffect(() => {
    update()
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [update])

  const mask = `linear-gradient(90deg, ${
    fadeLeft ? `transparent 0, #000 ${FADE_PX}px` : "#000 0"
  }, ${fadeRight ? `#000 calc(100% - ${FADE_PX}px), transparent 100%` : "#000 100%"})`

  return (
    <div
      ref={ref}
      onScroll={update}
      className={`scrollbar-hide -mx-[22px] overflow-x-auto px-[22px] ${className ?? ""}`}
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div className="flex w-max gap-2 pb-1 pt-px">{children}</div>
    </div>
  )
}
