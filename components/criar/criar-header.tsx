"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { StreakBadge } from "@/components/home/streak-badge"
import { useStreak } from "@/hooks/use-streak"
import type { CriarChild } from "@/lib/criar/types"
import { describeAge } from "@/lib/criar/stage"
import { SettingsSheet } from "./settings-sheet"

interface CriarHeaderProps {
  child: CriarChild
  onChildUpdate: (child: CriarChild) => void
}

export function CriarHeader({ child, onChildUpdate }: CriarHeaderProps) {
  const streak = useStreak()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className="mb-6 flex items-start justify-between">
      <div className="flex flex-col">
        <h1 className="font-serif text-2xl font-semibold text-foreground leading-tight">Grow</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {child.name} · {describeAge(child.birthdate)} · Rioplatense
        </p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <StreakBadge count={streak} />
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        child={child}
        onChildUpdate={onChildUpdate}
      />
    </header>
  )
}
