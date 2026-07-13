"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { StreakBadge } from "@/components/home/streak-badge"
import { VoiceSheet } from "@/components/home/voice-sheet"
import { useStreak } from "@/hooks/use-streak"

interface AppHeaderProps {
  title: string
  subtitle?: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const streak = useStreak()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <header className="mb-6 flex items-start justify-between">
      <div className="flex flex-col">
        <h1 className="font-serif text-2xl font-semibold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <StreakBadge count={streak} />
        <button
          onClick={() => setSheetOpen(true)}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <VoiceSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </header>
  )
}
