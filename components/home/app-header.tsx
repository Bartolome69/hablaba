"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Settings } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { AppTabs, CRIAR_FLAG, isCriarEnabled } from "@/components/app-tabs"
import { StreakBadge } from "@/components/home/streak-badge"
import { VoiceSheet } from "@/components/home/voice-sheet"
import { useStreak } from "@/hooks/use-streak"

const LONG_PRESS_MS = 1200

export function AppHeader() {
  const streak = useStreak()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const posthog = usePostHog()

  // Long-press on the wordmark toggles the hidden Grow tab
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
    <header className="mb-8">
      {/* Row 1: brand + controls */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex flex-col select-none [-webkit-touch-callout:none]"
          onPointerDown={startPress}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
        >
          <h1 className="font-serif text-2xl font-semibold text-foreground leading-tight">Hablaba</h1>
          <p className="text-xs text-muted-foreground">Spanish for daily life</p>
        </div>
        <div className="flex items-center gap-2">
          <StreakBadge count={streak} />
          <button
            onClick={() => setSheetOpen(true)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-[0.98] transition-all"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: full-width tab navigation */}
      <AppTabs />

      <VoiceSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </header>
  )
}
