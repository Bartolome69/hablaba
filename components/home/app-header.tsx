"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AudioLines } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { StreakBadge } from "@/components/home/streak-badge"
import { VoiceSheet } from "@/components/home/voice-sheet"
import { useStreak } from "@/hooks/use-streak"

export function AppHeader() {
  const streak = useStreak()
  const pathname = usePathname()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const posthog = usePostHog()

  return (
    <header className="mb-8">
      {/* Row 1: brand + controls */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Hablaba</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <AudioLines className="w-4 h-4" />
          </button>
          <StreakBadge count={streak} />
        </div>
      </div>

      {/* Row 2: Speak / Practice tab toggle */}
      <div className="flex items-center bg-secondary rounded-full p-1">
        <button
          onClick={() => { posthog.capture("tab_switched", { tab: "speak" }); router.push("/speak") }}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
            pathname === "/speak"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Speak
        </button>
        <button
          onClick={() => { posthog.capture("tab_switched", { tab: "practice" }); router.push("/practice") }}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
            pathname === "/practice"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Practice
        </button>
      </div>

      <VoiceSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </header>
  )
}
