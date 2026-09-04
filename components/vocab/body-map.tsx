"use client"

// The tappable body. Every region IS a word — the figure is drawn out of its
// labelled parts rather than as an outline with invisible hotspots over it, so
// what you can tap and what the diagram shows can never drift apart.
//
// Clay + calm on an SVG: unselected parts are the sunken cream with a hairline
// rule, the selected part is the screen's green mass. No fill animation on the
// parts themselves — only the readout below settles.
//
// The diagram is never the only route to a word: the surface lists every word
// in the set underneath, at full row size. Some regions here are smaller than
// the 44px minimum (the elbow, a nostril) because a body is shaped like a
// body; the list is what makes that acceptable.

import { useMemo } from "react"
import { DuoIcon } from "@/components/icons"
import { FIGURES, type BodyFigure, type RegionShape } from "@/lib/vocab/body-map"
import { SETS } from "@/lib/vocab/catalog"
import { withArticle } from "@/lib/vocab/types"
import type { CatalogWord } from "@/lib/vocab/types"

function Shape({ shape, ...rest }: { shape: RegionShape } & React.SVGProps<SVGElement>) {
  const props = rest as Record<string, unknown>
  if (shape.kind === "rect") {
    return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.rx} {...props} />
  }
  if (shape.kind === "ellipse") {
    return <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} {...props} />
  }
  return <path d={shape.d} {...props} />
}

interface BodyMapProps {
  figure: BodyFigure
  selectedId: string | null
  savedIds: Set<string>
  onSelect: (word: CatalogWord) => void
}

export function BodyMap({ figure, selectedId, savedIds, onSelect }: BodyMapProps) {
  const words = useMemo(
    () => new Map(SETS.cuerpo.words.map((w) => [w.id, w])),
    [],
  )
  const selected = selectedId ? words.get(selectedId) : undefined

  return (
    <svg
      viewBox={figure.viewBox}
      className="mx-auto block w-full max-w-[230px]"
      role="group"
      aria-label={`Diagrama: ${figure.label}`}
    >
      {figure.regions.map((region) => {
        const word = words.get(region.wordId)
        if (!word) return null
        const isSelected = region.wordId === selectedId
        const isSaved = savedIds.has(region.wordId)
        return (
          <g
            key={region.wordId}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${withArticle(word)} — ${word.english}`}
            onClick={() => onSelect(word)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onSelect(word)
              }
            }}
            className="cursor-pointer outline-none focus-visible:opacity-80"
          >
            {region.shapes.map((shape, i) => (
              <Shape
                key={i}
                shape={shape}
                fill={
                  isSelected
                    ? "var(--hb-green)"
                    : isSaved
                      ? "var(--hb-green-tint)"
                      : region.tone === "shade"
                        ? "var(--hb-lip-sunken)"
                        : "var(--hb-sunken-2)"
                }
                stroke={isSelected ? "var(--hb-green-press)" : "var(--hb-lip-sunken)"}
                strokeWidth={1.5}
                style={{ transition: "fill 120ms cubic-bezier(.22,1,.36,1)" }}
              />
            ))}
          </g>
        )
      })}

      {/* The label rides with the selection so the eye never leaves the body. */}
      {selected && (
        <text
          x={figure.regions.find((r) => r.wordId === selectedId)!.label.x}
          y={figure.regions.find((r) => r.wordId === selectedId)!.label.y}
          textAnchor={figure.regions.find((r) => r.wordId === selectedId)!.label.anchor}
          className="font-serif"
          fontSize="15"
          fill="var(--hb-ink)"
        >
          {withArticle(selected)}
        </text>
      )}
    </svg>
  )
}

/** The Cuerpo / Cara segment above the diagram. */
export function FigureSwitch({
  active,
  onChange,
}: {
  active: BodyFigure["id"]
  onChange: (id: BodyFigure["id"]) => void
}) {
  return (
    <div className="clay-well mx-auto mb-4 flex w-fit items-center gap-1 rounded-full bg-sunken-2 p-1">
      {FIGURES.map((figure) => {
        const isActive = figure.id === active
        return (
          <button
            key={figure.id}
            onClick={() => onChange(figure.id)}
            aria-pressed={isActive}
            className={`press-chip flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium ${
              isActive ? "bg-green text-cream" : "text-ink-muted"
            }`}
            style={isActive ? { boxShadow: "0 2px 0 var(--hb-green-press)" } : undefined}
          >
            <DuoIcon name={figure.id === "cuerpo" ? "cuerpo" : "peque"} size={15} />
            {figure.label}
          </button>
        )
      })}
    </div>
  )
}
