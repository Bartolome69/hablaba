"use client"

import { useState, type ReactNode } from "react"
import { Settings } from "lucide-react"
import { StreakBadge } from "@/components/home/streak-badge"
import { useStreak } from "@/hooks/use-streak"
import type { CriarChild } from "@/lib/criar/types"
import { SettingsSheet } from "@/components/settings-sheet"
import { GrowChildSettings } from "./grow-child-settings"
import { GrowSectionNav } from "./grow-section-nav"

interface CriarHeaderProps {
  child: CriarChild
  onChildUpdate: (child: CriarChild) => void
  title: string
  subtitle: string
  // Optional extra control (e.g. the mute toggle on the Catch up screen),
  // placed left of the streak + settings so every Grow tab keeps one header shape.
  action?: ReactNode
}

// Shared top chrome for every Grow tab: a one-line title + subtitle, the streak
// and settings controls, and the Today / Catch up / Journal tab bar. Identical
// on all three screens so the tab bar never shifts between them.
export function CriarHeader({ child, onChildUpdate, title, subtitle, action }: CriarHeaderProps) {
  const streak = useStreak()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h1 className="font-serif text-2xl font-semibold text-foreground leading-tight">{title}</h1>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 pt-1">
          {action}
          <StreakBadge count={streak} />
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <GrowSectionNav />

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        growDetails={<GrowChildSettings child={child} onChildUpdate={onChildUpdate} />}
      />
    </>
  )
}
