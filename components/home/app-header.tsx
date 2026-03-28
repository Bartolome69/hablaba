"use client"

import { StreakBadge } from "@/components/home/streak-badge"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import type { UserProfile } from "@/lib/types"

interface AppHeaderProps {
  user: UserProfile
}

export function AppHeader({ user }: AppHeaderProps) {
  const { gender, setGender } = useVoicePreference()

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Hablaba
        </h1>
        <p className="text-sm text-muted-foreground">Practice makes perfect</p>
      </div>
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
        <StreakBadge count={user.streak} />
      </div>
    </header>
  )
}
