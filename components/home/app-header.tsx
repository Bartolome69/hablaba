"use client"

import { usePathname, useRouter } from "next/navigation"
import { StreakBadge } from "@/components/home/streak-badge"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { useStreak } from "@/hooks/use-streak"

export function AppHeader() {
  const { gender, setGender } = useVoicePreference()
  const streak = useStreak()
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="mb-8">
      {/* Row 1: brand + controls */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Hablaba</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-secondary rounded-full p-1 text-xs">
            <button
              onClick={() => setGender("female")}
              className={`px-3 py-1 rounded-full transition-colors ${
                gender === "female"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              ♀ Female
            </button>
            <button
              onClick={() => setGender("male")}
              className={`px-3 py-1 rounded-full transition-colors ${
                gender === "male"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              ♂ Male
            </button>
          </div>
          <StreakBadge count={streak} />
        </div>
      </div>

      {/* Row 2: Speak / Practice tab toggle */}
      <div className="flex items-center bg-secondary rounded-full p-1">
        <button
          onClick={() => router.push("/speak")}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
            pathname === "/speak"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Speak
        </button>
        <button
          onClick={() => router.push("/")}
          className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${
            pathname === "/"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          }`}
        >
          Practice
        </button>
      </div>
    </header>
  )
}
