"use client"

// Small pieces shared by the Cuentos screens.

import { useEffect, useState, type ReactNode } from "react"
import { DuoIcon } from "@/components/icons"
import { getPhoto } from "@/lib/cuentos/blobs"
import type { SpanishDialect } from "@/lib/cuentos/types"

/** An object URL for a stored photo, revoked when it changes or unmounts. */
export function usePhotoUrl(photoId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!photoId) return
    let current: string | null = null
    let cancelled = false
    getPhoto(photoId)
      .then((blob) => {
        if (cancelled || !blob) return
        current = URL.createObjectURL(blob)
        setUrl(current)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (current) URL.revokeObjectURL(current)
      setUrl(null)
    }
  }, [photoId])
  return url
}

/** An object URL for an in-memory Blob. */
export function useBlobUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => {
      URL.revokeObjectURL(u)
      setUrl(null)
    }
  }, [blob])
  return url
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  right,
}: {
  title: string
  subtitle?: string
  onBack: () => void
  backLabel: string
  right?: ReactNode
}) {
  return (
    <header className="mb-5 flex items-center gap-3">
      <button
        onClick={onBack}
        aria-label={backLabel}
        className="clay-card flex h-11 w-11 flex-none items-center justify-center rounded-[14px] text-ink"
      >
        <DuoIcon name="volver" size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-serif text-[26px] leading-tight tracking-[-0.02em] text-ink">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-ink-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

const DIALECTS: { id: SpanishDialect; label: string; blurb: string }[] = [
  { id: "rioplatense", label: "Rioplatense", blurb: "mamadera, frutilla, upa" },
  { id: "neutral", label: "Neutral", blurb: "biberón, fresa" },
]

export function DialectPicker({ value, onChange }: { value: SpanishDialect; onChange: (d: SpanishDialect) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Vocabulario">
      {DIALECTS.map((d) => {
        const selected = value === d.id
        return (
          <button
            key={d.id}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(d.id)}
            className={`min-h-11 rounded-[18px] p-3 text-left ${selected ? "bg-[#EAF1EA]" : "clay-card"}`}
            style={selected ? { boxShadow: "inset 0 0 0 1.5px var(--hb-green), 0 2px 0 #CFDECF" } : undefined}
          >
            <p className={`text-sm font-semibold ${selected ? "text-green" : "text-ink"}`}>{d.label}</p>
            <p className="mt-0.5 font-serif text-[13px] italic text-ink-muted">{d.blurb}</p>
          </button>
        )
      })}
    </div>
  )
}

export const dialectLabel = (d: SpanishDialect) => (d === "neutral" ? "neutral" : "rioplatense")

export function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke={light ? "#F7F3EC" : "#1E3D2C"} strokeOpacity=".25" strokeWidth="2.6" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke={light ? "#F7F3EC" : "#1E3D2C"} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function relativeDay(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400_000)
  if (days <= 0) return "hoy"
  if (days === 1) return "ayer"
  return `hace ${days} días`
}
