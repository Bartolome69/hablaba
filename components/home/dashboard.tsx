"use client"

import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/home/app-header"
import { ContinueSession } from "@/components/home/continue-session"
import { PhraseList } from "@/components/home/phrase-list"
import { useSavedPhrases } from "@/hooks/use-saved-phrases"
import { useSessions } from "@/hooks/use-sessions"
import { conversationTopics, mockUser } from "@/lib/data"

export function Dashboard() {
  const router = useRouter()
  const { phrases } = useSavedPhrases()
  const { sessions } = useSessions()

  return (
    <div className="min-h-dvh bg-background px-4 py-6 pb-24">
      <AppHeader user={mockUser} />

      {/* Conversation starters */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Start a conversation</h2>
        <div className="grid grid-cols-2 gap-3">
          {conversationTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => router.push(`/chat?mode=solo&topic=${topic.id}`)}
              className="flex flex-col items-start gap-2 p-4 bg-card border border-border rounded-2xl text-left hover:bg-secondary/50 active:scale-[0.98] transition-all"
            >
              <span className="text-2xl">{topic.emoji}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{topic.title}</p>
                <p className="text-xs text-muted-foreground">{topic.spanish}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent conversations */}
      {sessions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent conversations</h2>
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Saved phrases */}
      {phrases.length > 0 && (
        <PhraseList phrases={phrases} totalCount={phrases.length} />
      )}
    </div>
  )
}
