"use client"

import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/home/app-header"
import { PracticeModeCard } from "@/components/home/practice-mode-card"
import { DailyPromptCard } from "@/components/home/daily-prompt-card"
import { ContinueSession } from "@/components/home/continue-session"
import { PhraseList } from "@/components/home/phrase-list"
import { dailyPrompt, savedPhrases, lastSession, mockUser } from "@/lib/data"
import type { PracticeMode } from "@/lib/types"

export function Dashboard() {
  const router = useRouter()

  const handleStartPractice = (mode: PracticeMode) => {
    router.push(`/chat?mode=${mode}`)
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader user={mockUser} />

      <div className="grid grid-cols-2 gap-3 mb-8">
        <PracticeModeCard mode="solo" onClick={() => handleStartPractice("solo")} />
        <PracticeModeCard mode="together" onClick={() => handleStartPractice("together")} />
      </div>

      <div className="mb-6">
        <DailyPromptCard
          prompt={dailyPrompt}
          onStart={() => handleStartPractice("together")}
        />
      </div>

      <div className="mb-6">
        <ContinueSession
          session={lastSession}
          onContinue={() => handleStartPractice(lastSession.mode)}
        />
      </div>

      <PhraseList phrases={savedPhrases} totalCount={mockUser.savedPhraseCount} />
    </div>
  )
}
