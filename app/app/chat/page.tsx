"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { usePostHog } from "posthog-js/react"
import { useChat } from "@/hooks/use-chat"
import { toast } from "sonner"
import { playAudio } from "@/lib/audio"
import { useSavedPhrases } from "@/hooks/use-saved-phrases"
import { useVoicePreference } from "@/hooks/use-voice-preference"
import { useSessions } from "@/hooks/use-sessions"
import { conversationTopics, dailyTopics, SURPRISE_TOPIC_ID, PARENT_CHILD_TOPIC_ID } from "@/lib/data"
import type { PracticeMode } from "@/lib/types"

function ChatContent() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get("mode") as PracticeMode) || "solo"
  const topicId = searchParams.get("topic") ?? undefined
  const sessionId = useRef(searchParams.get("session") ?? crypto.randomUUID()).current

  const isSurprise = topicId === SURPRISE_TOPIC_ID
  const isParentChild = topicId === PARENT_CHILD_TOPIC_ID
  const surpriseTheme = searchParams.get("theme") ?? undefined
  const topic = [...conversationTopics, ...dailyTopics].find((t) => t.id === topicId)

  const { upsertSession } = useSessions()
  const { savePhrase } = useSavedPhrases()
  const { voiceId } = useVoicePreference()
  const bottomRef = useRef<HTMLDivElement>(null)
  const posthog = usePostHog()

  // TTS state managed at page level
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Stop playback and cancel any in-flight TTS request. Stable identity so
  // the unmount effect below can tear down audio when the user leaves.
  const stopAudio = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const playTTS = useCallback(async (messageId: string, text: string) => {
    const wasPlaying = playingId === messageId
    stopAudio()
    if (wasPlaying) {
      setPlayingId(null)
      return
    }

    setPlayingId(messageId)
    const controller = new AbortController()
    abortRef.current = controller
    let url: string | null = null
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: voiceId, register: "rioplatense" }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error("TTS failed")
      const blob = await res.blob()
      url = URL.createObjectURL(blob)
      const audio = await playAudio(url, controller.signal)
      // Navigated away / superseded while the clip was loading.
      if (controller.signal.aborted) {
        audio.pause()
        URL.revokeObjectURL(url)
        return
      }
      const objectUrl = url
      audioRef.current = audio
      audio.onended = () => {
        setPlayingId(null)
        URL.revokeObjectURL(objectUrl)
        audioRef.current = null
      }
    } catch {
      if (url) URL.revokeObjectURL(url)
      if (controller.signal.aborted) return // silent — user cancelled
      setPlayingId(null)
      toast.error("No se pudo reproducir el audio", {
        description: "Tap to retry",
        action: {
          label: "Retry",
          onClick: () => playTTS(messageId, text),
        },
      })
    }
  }, [voiceId, playingId, stopAudio])

  // Kill audio if the user navigates away from the conversation.
  useEffect(() => stopAudio, [stopAudio])

  const { messages, isLoading, sendMessage } = useChat({
    mode,
    topicId,
    topicTitle: isParentChild
      ? (surpriseTheme ?? "family time")
      : isSurprise
        ? (surpriseTheme ?? "surprise")
        : topic?.title,
    sessionId,
    onSessionUpdate: (messageCount) => {
      const t = isParentChild
        ? { id: PARENT_CHILD_TOPIC_ID, title: "Family time", emoji: "👶" }
        : isSurprise
          ? { id: SURPRISE_TOPIC_ID, title: surpriseTheme ?? "Surprise", emoji: "💬" }
          : topic
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
    posthog.capture("conversation_started", {
      topic: isParentChild ? PARENT_CHILD_TOPIC_ID : isSurprise ? "surprise" : (topic?.id ?? "unknown"),
      topic_title: isParentChild
        ? (surpriseTheme ?? "family time")
        : isSurprise
          ? (surpriseTheme ?? "surprise")
          : (topic?.title ?? "unknown"),
      mode,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div className="fixed inset-0 bg-background flex flex-col mx-auto max-w-lg">
      <ChatHeader mode={mode} topic={isParentChild ? "👶 Family time" : isSurprise ? "🎲 Surprise" : (topic?.title ?? "Practice")} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            isPlaying={playingId === message.id}
            onPlayRequest={() => playTTS(message.id, message.text)}
            onSavePhrase={(spanish, english, source) => {
              savePhrase(spanish, english, source)
              posthog.capture("phrase_saved", { source })
            }}
          />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-pulse [animation-delay:300ms]" />
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
