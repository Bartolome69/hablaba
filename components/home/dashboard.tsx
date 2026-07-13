"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shuffle, Baby, ChevronDown } from "lucide-react"
import { AppHeader } from "@/components/home/app-header"
import { ContinueSession } from "@/components/home/continue-session"
import { ReviewCard } from "@/components/home/review-card"
import { useSavedPhrases } from "@/hooks/use-saved-phrases"
import { useSessions } from "@/hooks/use-sessions"
import {
  conversationTopics,
  dailyTopics,
  SURPRISE_TOPIC_ID,
  surpriseThemes,
  PARENT_CHILD_TOPIC_ID,
  parentChildThemes,
} from "@/lib/data"

export function Dashboard() {
  const router = useRouter()
  const { phrases } = useSavedPhrases()
  const { sessions, deleteSession } = useSessions()
  const [showAllSessions, setShowAllSessions] = useState(false)

  const SESSION_PREVIEW_COUNT = 3
  const visibleSessions = showAllSessions ? sessions : sessions.slice(0, SESSION_PREVIEW_COUNT)
  const hiddenSessionCount = sessions.length - SESSION_PREVIEW_COUNT

  const handleSurprise = () => {
    const theme = surpriseThemes[Math.floor(Math.random() * surpriseThemes.length)]
    router.push(`/chat?mode=solo&topic=${SURPRISE_TOPIC_ID}&theme=${encodeURIComponent(theme)}`)
  }

  const handleParentChild = () => {
    const theme = parentChildThemes[Math.floor(Math.random() * parentChildThemes.length)]
    router.push(`/chat?mode=solo&topic=${PARENT_CHILD_TOPIC_ID}&theme=${encodeURIComponent(theme)}`)
  }

  const topicCard = (topic: typeof conversationTopics[0]) => {
    const existingSession = sessions.find((s) => s.topicId === topic.id)
    const href = existingSession
      ? `/chat?mode=solo&topic=${topic.id}&session=${existingSession.id}`
      : `/chat?mode=solo&topic=${topic.id}`
    return (
    <button
      key={topic.id}
      onClick={() => router.push(href)}
      className="flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-2xl text-left hover:bg-secondary/50 active:scale-[0.98] transition-all"
    >
      <span className="text-2xl">{topic.emoji}</span>
      <div>
        <p className="text-sm font-medium text-foreground">{topic.title}</p>
        <p className="text-xs text-muted-foreground font-serif italic">{topic.spanish}</p>
      </div>
    </button>
  )
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader title="Practice" subtitle="Your daily Spanish practice" />

      {/* Continue — pick up in-progress conversations */}
      {sessions.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-base text-foreground mb-3">Pick up where you left off</h2>
          <div className="space-y-2">
            {visibleSessions.map((session) => (
              <ContinueSession
                key={session.id}
                session={{
                  id: session.id,
                  mode: "solo",
                  topic: `${session.topicEmoji} ${session.topicTitle}`,
                  messageCount: session.messageCount,
                  lastMessageAt: new Date(session.lastMessageAt),
                }}
                onContinue={() => router.push(`/chat?mode=solo&topic=${session.topicId}&session=${session.id}`)}
                onDelete={() => deleteSession(session.id)}
              />
            ))}
          </div>
          {hiddenSessionCount > 0 && (
            <button
              onClick={() => setShowAllSessions((v) => !v)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllSessions ? "Show less" : `See ${hiddenSessionCount} more`}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllSessions ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}

      {/* Review — practise saved phrases */}
      {phrases.length > 0 && (
        <div className="mb-8">
          <ReviewCard count={phrases.length} />
        </div>
      )}

      {/* Start a conversation */}
      <div>
        <h2 className="font-serif text-base text-foreground mb-1">Start a conversation</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Pick a topic and start chatting in Spanish.
        </p>

        {/* Surprise me */}
        <button
          onClick={handleSurprise}
          className="w-full mb-3 flex items-center gap-3 p-4 bg-primary text-primary-foreground rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-primary-foreground/15 flex items-center justify-center flex-shrink-0">
            <Shuffle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Surprise me</p>
            <p className="text-xs opacity-75">Let the AI pick a random topic</p>
          </div>
        </button>

        {/* Talk with your child */}
        <button
          onClick={handleParentChild}
          className="w-full mb-8 flex items-center gap-3 p-4 bg-secondary text-secondary-foreground rounded-2xl hover:bg-secondary/80 active:scale-[0.98] transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-accent/25 flex items-center justify-center flex-shrink-0">
            <Baby className="w-5 h-5 text-accent-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Talk with your child</p>
            <p className="text-xs text-muted-foreground">Free-chat practice for everyday moments together</p>
          </div>
        </button>

        {/* Hobbies & interests */}
        <div className="mb-8">
          <h3 className="font-serif text-base text-foreground mb-3">Hobbies & interests</h3>
          <div className="grid grid-cols-2 gap-3">
            {conversationTopics.map(topicCard)}
          </div>
        </div>

        {/* Daily life */}
        <div>
          <h3 className="font-serif text-base text-foreground mb-3">Daily life</h3>
          <div className="grid grid-cols-2 gap-3">
            {dailyTopics.map(topicCard)}
          </div>
        </div>
      </div>
    </div>
  )
}
