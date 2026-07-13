"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Settings } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { CRIAR_FLAG, isCriarEnabled } from "@/lib/criar-flag"
import { StreakBadge } from "@/components/home/streak-badge"
import { VoiceSheet } from "@/components/home/voice-sheet"
import { useStreak } from "@/hooks/use-streak"

const LONG_PRESS_MS = 1200

interface AppHeaderProps {
  title: string
  subtitle?: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const streak = useStreak()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const posthog = usePostHog()

  // Long-press on the title toggles the hidden Grow tab
  const pressTimer = useRef<number | null>(null)

  const startPress = () => {
    pressTimer.current = window.setTimeout(() => {
      pressTimer.current = null
      try {
        if (isCriarEnabled()) {
          localStorage.removeItem(CRIAR_FLAG)
          window.location.reload()
        } else {
          localStorage.setItem(CRIAR_FLAG, "1")
          posthog.capture("criar_unlocked")
          router.push("/grow")
        }
      } catch {}
    }, LONG_PRESS_MS)
  }

  const cancelPress = () => {
    if (pressTimer.current !== null) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  return (
    <header className="mb-6 flex items-start justify-between">
      <div
        className="flex flex-col select-none [-webkit-touch-callout:none]"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => e.preventDefault()}
      >
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
