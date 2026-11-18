"use client"

import { useState } from "react"
import { DuoIcon } from "@/components/icons"
import { SettingsSheet } from "@/components/settings-sheet"

interface AppHeaderProps {
  title: string
  subtitle?: string
  /** Show the settings disc (Hoy only). No streak: removed in QW6. */
  controls?: boolean
}

export function AppHeader({ title, subtitle, controls = false }: AppHeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="mb-6 flex items-start justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-[34px] leading-none tracking-[-0.025em] text-ink">{title}</h1>
        {subtitle && <p className="text-[13.5px] text-ink-muted">{subtitle}</p>}
      </div>
      {controls && (
        <div className="flex items-center gap-2 pt-0.5">
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
