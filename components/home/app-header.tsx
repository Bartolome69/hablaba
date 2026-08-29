"use client"

import { useState } from "react"
import { DuoIcon } from "@/components/icons"
import { StreakBadge } from "@/components/home/streak-badge"
import { SettingsSheet } from "@/components/settings-sheet"
import { useStreak } from "@/hooks/use-streak"

interface AppHeaderProps {
  title: string
  subtitle?: string
  /** Show the streak pill + settings disc — Hoy only, per the handoff. */
  controls?: boolean
}

export function AppHeader({ title, subtitle, controls = false }: AppHeaderProps) {
  const streak = useStreak()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="mb-6 flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-[34px] leading-none tracking-[-0.025em] text-ink">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-ink-soft">{subtitle}</p>}
      </div>
      {controls && (
        <div className="flex items-center gap-2 pt-0.5">
          <StreakBadge count={streak} />
          <button
            onClick={() => setSheetOpen(true)}
            className="clay-well flex h-[38px] w-[38px] items-center justify-center rounded-full bg-sunken-2 text-ink"
            aria-label="Ajustes"
          >
            <DuoIcon name="ajustes" size={19} />
          </button>
        </div>
      )}

      <SettingsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </header>
  )
}
