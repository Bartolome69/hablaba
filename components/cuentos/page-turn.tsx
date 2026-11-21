"use client"

// Turning pages like a book. Swipe left for the next page, right for the
// previous one: the page you were on lifts off its edge as a "leaf" (a static
// snapshot of it, rotated in 3D around the spine side) and reveals the new
// page underneath, which is already the live page. The leaf follows the
// finger; let go past a third of the way, or flick, and it turns; otherwise it
// falls back and the old page returns.
//
// The buttons and the arrow keys use the same turn. Vertical scrolling is left
// to the browser (touch-action: pan-y), taps on words still work (a click
// after a swipe is swallowed), and with reduced motion the page just changes.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"

export type TurnDir = "next" | "prev"

const DECIDE_PX = 10 // movement before we decide swipe vs scroll
const COMMIT = 0.3 // fraction of the width that turns the page
const FLICK = 0.45 // px per ms that turns it regardless of distance
const MAX_ANGLE = 100 // past 90 the leaf is edge-on and gone

interface Leaf {
  key: number
  html: string
  scrollTop: number
  dir: TurnDir
  /** Set for button and keyboard turns: animate all the way on mount. */
  auto?: boolean
}

interface Gesture {
  id: number
  x0: number
  y0: number
  lastX: number
  lastT: number
  velocity: number
  mode: "undecided" | "turn" | "edge" | "scroll"
  dir: TurnDir
  progress: number
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

export function usePageTurn({
  mainRef,
  contentRef,
  canTurn,
  show,
  unshow,
}: {
  /** The scrolling page area: gets the swipe handlers. */
  mainRef: RefObject<HTMLElement | null>
  /** The page's content: what the leaf is a snapshot of. */
  contentRef: RefObject<HTMLElement | null>
  canTurn: (dir: TurnDir) => boolean
  /** Put the target page underneath (the turn has started). */
  show: (dir: TurnDir) => void
  /** The turn was abandoned: put the old page back. */
  unshow: (dir: TurnDir) => void
}) {
  const [leaf, setLeaf] = useState<Leaf | null>(null)
  const leafRef = useRef<HTMLDivElement | null>(null)
  const shadeRef = useRef<HTMLDivElement | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const swallowClick = useRef(false)
  const busy = useRef(false)
  const keyRef = useRef(0)

  const setAngle = (dir: TurnDir, angle: number) => {
    const sign = dir === "next" ? -1 : 1
    if (leafRef.current) leafRef.current.style.transform = `rotateY(${sign * angle}deg)`
    if (shadeRef.current) shadeRef.current.style.opacity = String(Math.min(1, angle / 90) * 0.55)
  }

  const finish = useCallback(
    (dir: TurnDir, from: number, commit: boolean) => {
      const el = leafRef.current
      const done = () => {
        if (!commit) unshow(dir)
        setLeaf(null)
        busy.current = false
      }
      if (!el || reducedMotion()) return done()
      const sign = dir === "next" ? -1 : 1
      const to = commit ? MAX_ANGLE : 0
      const duration = Math.max(140, Math.abs(to - from) * 4.2)
      const easing = "cubic-bezier(.25,.8,.35,1)"
      el.animate([{ transform: `rotateY(${sign * from}deg)` }, { transform: `rotateY(${sign * to}deg)` }], {
        duration,
        easing,
        fill: "forwards",
      }).onfinish = done
      shadeRef.current?.animate(
        [{ opacity: Math.min(1, from / 90) * 0.55 }, { opacity: Math.min(1, to / 90) * 0.55 }],
        { duration, easing, fill: "forwards" },
      )
    },
    [unshow],
  )

  /** Snapshot the current page into a leaf and put the target page underneath. */
  const begin = useCallback(
    (dir: TurnDir, auto: boolean) => {
      const content = contentRef.current
      busy.current = true
      if (reducedMotion() || !content) {
        show(dir)
        busy.current = false
        return
      }
      keyRef.current += 1
      setLeaf({ key: keyRef.current, html: content.innerHTML, scrollTop: mainRef.current?.scrollTop ?? 0, dir, auto })
      show(dir)
    },
    [contentRef, mainRef, show],
  )

  /** A turn from a button or an arrow key. */
  const turn = useCallback(
    (dir: TurnDir) => {
      if (busy.current || !canTurn(dir)) return
      begin(dir, true)
    },
    [begin, canTurn],
  )

  // Button turns animate the whole way as soon as the leaf exists.
  useLayoutEffect(() => {
    if (leaf?.auto) {
      setAngle(leaf.dir, 0)
      finish(leaf.dir, 0, true)
    } else if (leaf) setAngle(leaf.dir, 0)
  }, [leaf, finish])

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current || (e.pointerType === "mouse" && e.button !== 0)) return
    gesture.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      mode: "undecided",
      dir: "next",
      progress: 0,
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0
    const dt = Math.max(1, e.timeStamp - g.lastT)
    g.velocity = (e.clientX - g.lastX) / dt
    g.lastX = e.clientX
    g.lastT = e.timeStamp

    if (g.mode === "undecided") {
      if (Math.abs(dy) > DECIDE_PX && Math.abs(dy) > Math.abs(dx)) {
        g.mode = "scroll"
        return
      }
      if (Math.abs(dx) < DECIDE_PX || Math.abs(dx) < Math.abs(dy) * 1.2) return
      g.dir = dx < 0 ? "next" : "prev"
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}
      swallowClick.current = true
      if (!canTurn(g.dir)) {
        g.mode = "edge"
      } else {
        g.mode = "turn"
        begin(g.dir, false)
      }
    }

    const width = mainRef.current?.clientWidth || window.innerWidth
    if (g.mode === "turn") {
      const along = g.dir === "next" ? -dx : dx
      g.progress = Math.max(0, Math.min(1, along / width))
      setAngle(g.dir, g.progress * MAX_ANGLE)
    } else if (g.mode === "edge" && contentRef.current) {
      // The first or last page: a little give, no turn.
      contentRef.current.style.transform = `translateX(${dx * 0.18}px)`
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current
    gesture.current = null
    if (!g || g.id !== e.pointerId) return
    if (g.mode === "turn") {
      const towards = g.dir === "next" ? -g.velocity : g.velocity
      finish(g.dir, g.progress * MAX_ANGLE, g.progress > COMMIT || towards > FLICK)
    } else if (g.mode === "edge" && contentRef.current) {
      const el = contentRef.current
      el.animate([{ transform: el.style.transform }, { transform: "translateX(0)" }], {
        duration: 220,
        easing: "cubic-bezier(.25,.8,.35,1)",
      }).onfinish = () => (el.style.transform = "")
    }
  }

  const onPointerCancel = (e: React.PointerEvent) => {
    const g = gesture.current
    if (g?.mode === "turn") finish(g.dir, g.progress * MAX_ANGLE, false)
    if (g?.mode === "edge" && contentRef.current) contentRef.current.style.transform = ""
    if (g && g.id === e.pointerId) gesture.current = null
  }

  // After a swipe the browser still fires a click on whatever was under the
  // finger (a word, which would speak): swallow that one click.
  const onClickCapture = (e: React.MouseEvent) => {
    if (swallowClick.current) {
      swallowClick.current = false
      e.stopPropagation()
      e.preventDefault()
    }
  }
  useEffect(() => {
    const reset = () => (swallowClick.current = false)
    window.addEventListener("pointerdown", reset, true)
    return () => window.removeEventListener("pointerdown", reset, true)
  }, [])

  const handlers = { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture }

  return { handlers, turn, leaf, leafRef, shadeRef, turning: leaf !== null }
}

/** The lifted page. Static, hidden from assistive tech, never interactive. */
export function TurningLeaf({
  leaf,
  leafRef,
  shadeRef,
  background,
  className,
}: {
  leaf: { key: number; html: string; scrollTop: number; dir: TurnDir } | null
  leafRef: RefObject<HTMLDivElement | null>
  shadeRef: RefObject<HTMLDivElement | null>
  background: string
  /** The page area's padding, so the snapshot lines up with the live page. */
  className: string
}) {
  if (!leaf) return null
  return (
    <div
      key={leaf.key}
      ref={leafRef}
      aria-hidden
      inert
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background,
        transformOrigin: leaf.dir === "next" ? "left center" : "right center",
        backfaceVisibility: "hidden",
        boxShadow: "0 0 24px rgba(30,61,44,.22)",
        willChange: "transform",
      }}
    >
      <div className={className} style={{ transform: `translateY(${-leaf.scrollTop}px)` }} dangerouslySetInnerHTML={{ __html: leaf.html }} />
      <div
        ref={shadeRef}
        className="absolute inset-0"
        style={{
          opacity: 0,
          background:
            leaf.dir === "next"
              ? "linear-gradient(to left, rgba(18,60,31,.55), rgba(18,60,31,0) 70%)"
              : "linear-gradient(to right, rgba(18,60,31,.55), rgba(18,60,31,0) 70%)",
        }}
      />
    </div>
  )
}
