"use client"

// Drag and drop for a book's pages: hold the grip on a row and move it; the
// other rows slide out of the way, and the list scrolls when you reach the
// top or bottom of the screen. Pointer events with the grip set to
// touch-action: none, so it works the same with a thumb or a mouse and the
// page doesn't scroll under the finger. No library.
//
// The grip is also a keyboard control: arrow up and down move the page one
// place, and a live region says where it went.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { DuoIcon } from "@/components/icons"
import type { BookPage } from "@/lib/cuentos/types"

const GAP = 10 // matches space-y-2.5
const EDGE_TOP = 96 // auto-scroll zones, clear of the header…
const EDGE_BOTTOM = 160 // …and of the ask bar and tab bar
const SCROLL_STEP = 9

interface Drag {
  id: string
  from: number
  to: number
  startY: number // document coordinates
  dy: number
  shift: number // how far the others move: the dragged row's height plus the gap
  mids: number[] // document-space midpoints of every row at the start
  top: number
  height: number
}

export function SortablePages({
  pages,
  onMove,
  renderRow,
}: {
  pages: BookPage[]
  onMove: (pageId: string, toIndex: number) => void
  renderRow: (page: BookPage, grip: ReactNode, dragging: boolean) => ReactNode
}) {
  const rows = useRef(new Map<string, HTMLLIElement>())
  const [drag, setDrag] = useState<Drag | null>(null)
  const dragRef = useRef<Drag | null>(null)
  const pointerY = useRef(0)
  const frame = useRef<number | null>(null)
  const [announce, setAnnounce] = useState("")
  const [focusId, setFocusId] = useState<string | null>(null)

  const update = useCallback((clientY: number) => {
    const d = dragRef.current
    if (!d) return
    const dy = clientY + window.scrollY - d.startY
    const center = d.top + d.height / 2 + dy
    let to = d.from
    while (to < d.mids.length - 1 && center > d.mids[to + 1]) to++
    while (to > 0 && center < d.mids[to - 1]) to--
    const next = { ...d, dy, to }
    dragRef.current = next
    setDrag(next)
  }, [])

  // Scroll while the finger rests near an edge, and keep the row under it.
  // A frame loop that runs only while a drag is on.
  const startAutoScroll = useCallback(() => {
    const step = () => {
      if (!dragRef.current) return
      const y = pointerY.current
      const delta = y > window.innerHeight - EDGE_BOTTOM ? SCROLL_STEP : y < EDGE_TOP ? -SCROLL_STEP : 0
      if (delta) {
        window.scrollBy(0, delta)
        update(y)
      }
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }, [update])

  const start = (e: React.PointerEvent, page: BookPage, index: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    const rects = pages.map((p) => rows.current.get(p.id)?.getBoundingClientRect())
    if (rects.some((r) => !r)) return
    const mids = rects.map((r) => r!.top + window.scrollY + r!.height / 2)
    const own = rects[index]!
    const d: Drag = {
      id: page.id,
      from: index,
      to: index,
      startY: e.clientY + window.scrollY,
      dy: 0,
      shift: own.height + GAP,
      mids,
      top: own.top + window.scrollY,
      height: own.height,
    }
    dragRef.current = d
    pointerY.current = e.clientY
    setDrag(d)
    try {
      navigator.vibrate?.(8)
    } catch {}
    startAutoScroll()
  }

  const move = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    pointerY.current = e.clientY
    update(e.clientY)
  }

  const end = () => {
    const d = dragRef.current
    dragRef.current = null
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = null
    setDrag(null)
    if (d && d.to !== d.from) {
      onMove(d.id, d.to)
      setAnnounce(`Página movida al lugar ${d.to + 1}`)
    }
  }

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    },
    [],
  )

  // After a keyboard move the list re-renders: keep focus on the same grip.
  useEffect(() => {
    if (!focusId) return
    rows.current.get(focusId)?.querySelector<HTMLButtonElement>("[data-grip]")?.focus()
    setFocusId(null)
  }, [pages, focusId])

  const offsetFor = (index: number): number => {
    if (!drag) return 0
    if (index === drag.from) return drag.dy
    if (drag.from < drag.to && index > drag.from && index <= drag.to) return -drag.shift
    if (drag.to < drag.from && index >= drag.to && index < drag.from) return drag.shift
    return 0
  }

  return (
    <>
      <ul className="mt-6 space-y-2.5">
        {pages.map((page, i) => {
          const dragging = drag?.id === page.id
          const grip = (
            <button
              data-grip
              onPointerDown={(e) => start(e, page, i)}
              onPointerMove={move}
              onPointerUp={end}
              onPointerCancel={end}
              onKeyDown={(e) => {
                const to = e.key === "ArrowUp" ? i - 1 : e.key === "ArrowDown" ? i + 1 : null
                if (to === null || to < 0 || to >= pages.length) return
                e.preventDefault()
                setFocusId(page.id)
                onMove(page.id, to)
                setAnnounce(`Página movida al lugar ${to + 1}`)
              }}
              aria-label={`Mover la página ${i + 1}`}
              aria-describedby="cuentos-grip-hint"
              className={`flex h-11 w-11 flex-none touch-none select-none items-center justify-center rounded-full text-ink-muted ${
                dragging ? "cursor-grabbing bg-sunken" : "cursor-grab"
              }`}
            >
              <DuoIcon name="arrastrar" size={20} detail="#5F6B61" />
            </button>
          )
          return (
            <li
              key={page.id}
              ref={(el) => {
                if (el) rows.current.set(page.id, el)
                else rows.current.delete(page.id)
              }}
              className="relative"
              style={{
                transform: `translateY(${offsetFor(i)}px)${dragging ? " scale(1.02)" : ""}`,
                transition: dragging || !drag ? "none" : "transform 160ms ease-out",
                zIndex: dragging ? 20 : undefined,
                filter: dragging ? "drop-shadow(0 10px 18px rgba(30,61,44,.18))" : undefined,
              }}
            >
              {renderRow(page, grip, dragging)}
            </li>
          )
        })}
      </ul>
      <p id="cuentos-grip-hint" className="sr-only">
        Mantén pulsado y arrastra, o usa las flechas arriba y abajo.
      </p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </>
  )
}
