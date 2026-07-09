"use client"

import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/home/app-header"
import { ContinueSession } from "@/components/home/continue-session"
import { PhraseList } from "@/components/home/phrase-list"
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
    <div className="min-h-dvh bg-background px-4 py-6 pb-8">
      <AppHeader />

      <p className="text-sm text-muted-foreground mb-4 -mt-2">
        Pick a topic and start chatting in Spanish.
      </p>

      {/* Recent conversations — elevated to top */}
      {sessions.length > 0 && (
        <div className="mb-8">
          <h2 className="font-serif text-base text-foreground mb-3">Pick up where you left off</h2>
          <div className="space-y-2">
            {sessions.map((session) => (
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
        </div>
      )}

      {/* Surprise me */}
      <button
        onClick={handleSurprise}
        className="w-full mb-3 flex items-center justify-center gap-3 p-4 bg-primary text-primary-foreground rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <span className="text-2xl">🎲</span>
        <div className="text-left">
          <p className="text-sm font-semibold">Surprise me</p>
          <p className="text-xs opacity-75">Let the AI pick a random topic</p>
        </div>
      </button>

      {/* Talk with your child */}
      <button
        onClick={handleParentChild}
        className="w-full mb-8 flex items-center justify-center gap-3 p-4 bg-accent text-accent-foreground rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <span className="text-2xl">👶</span>
        <div className="text-left">
          <p className="text-sm font-semibold">Talk with your child</p>
          <p className="text-xs opacity-75">Free-chat practice for everyday moments together</p>
        </div>
      </button>

      {/* Hobbies & interests */}
      <div className="mb-8">
        <h2 className="font-serif text-base text-foreground mb-3">Hobbies & interests</h2>
        <div className="grid grid-cols-2 gap-3">
          {conversationTopics.map(topicCard)}
        </div>
      </div>

      {/* Daily life */}
      <div className="mb-8">
        <h2 className="font-serif text-base text-foreground mb-3">Daily life</h2>
        <div className="grid grid-cols-2 gap-3">
          {dailyTopics.map(topicCard)}
        </div>
      </div>

      {/* Saved phrases */}
      {phrases.length > 0 && (
        <PhraseList phrases={phrases} totalCount={phrases.length} />
      )}
    </div>
  )
}
