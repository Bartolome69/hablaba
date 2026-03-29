"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { useChat } from "@/hooks/use-chat"
import { playAudio } from "@/lib/audio"
import { useSavedPhrases } from "@/hooks/use-saved-phrases"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { useSessions } from "@/hooks/use-sessions"
import { conversationTopics, dailyTopics, SURPRISE_TOPIC_ID } from "@/lib/data"
import type { PracticeMode } from "@/lib/types"

function ChatContent() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get("mode") as PracticeMode) || "solo"
  const topicId = searchParams.get("topic") ?? undefined
  const sessionId = useRef(searchParams.get("session") ?? crypto.randomUUID()).current

  const isSurprise = topicId === SURPRISE_TOPIC_ID
  const surpriseTheme = searchParams.get("theme") ?? undefined
  const topic = [...conversationTopics, ...dailyTopics].find((t) => t.id === topicId)

  const { upsertSession } = useSessions()
  const { savePhrase } = useSavedPhrases()
  const { voiceId } = useVoicePreference()
  const bottomRef = useRef<HTMLDivElement>(null)

  // TTS state managed at page level
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playTTS = useCallback(async (messageId: string, text: string) => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playingId === messageId) {
      setPlayingId(null)
      return
    }

    setPlayingId(messageId)
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voiceId }),
      })
      if (!res.ok) throw new Error("TTS failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = await playAudio(url)
      audioRef.current = audio
      audio.onended = () => {
        setPlayingId(null)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }
    } catch {
      setPlayingId(null)
    }
  }, [voiceId, playingId])

  const { messages, isLoading, sendMessage } = useChat({
    mode,
    topicId,
    topicTitle: isSurprise ? (surpriseTheme ?? "surprise") : topic?.title,
    sessionId,
    onSessionUpdate: (messageCount) => {
      const t = isSurprise ? { id: SURPRISE_TOPIC_ID, title: "Surprise", emoji: "🎲" } : topic
      if (!t) return
      upsertSession({
        id: sessionId,
        topicId: t.id,
        topicTitle: t.title,
        topicEmoji: t.emoji,
        messageCount,
        lastMessageAt: new Date().toISOString(),
      })
    },
    onNewBotMessage: (id, text) => playTTS(id, text),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Scroll to bottom when the keyboard opens
  // - window resize covers Android Chrome (interactiveWidget: resizes-content shrinks the window)
  // - visualViewport resize covers iOS Safari (layout viewport doesn't shrink there)
  useEffect(() => {
    const handler = () => {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    }
    window.addEventListener("resize", handler)
    window.visualViewport?.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("resize", handler)
      window.visualViewport?.removeEventListener("resize", handler)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <ChatHeader mode={mode} topic={isSurprise ? "🎲 Surprise" : (topic?.title ?? "Practice")} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            isPlaying={playingId === message.id}
            onPlayRequest={() => playTTS(message.id, message.text)}
            onSavePhrase={savePhrase}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0">
        <ChatInput
          onSend={sendMessage}
          onFocus={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
        />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <ChatContent />
    </Suspense>
  )
}
