"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Message, PracticeMode } from "@/lib/types"
import type { HistoryMessage } from "@/lib/api"

interface UseChatOptions {
  mode: PracticeMode
  topicId?: string
  topicTitle?: string
  sessionId?: string
  onSessionUpdate?: (messageCount: number) => void
}

interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  sendMessage: (text: string) => void
}

export function useChat({
  mode: _mode,
  topicId,
  topicTitle,
  onSessionUpdate,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const historyRef = useRef<HistoryMessage[]>([])
  const messageCountRef = useRef(0)

  // Fetch bot opener when a topic is provided
  useEffect(() => {
    if (!topicId || !topicTitle) return

    setIsLoading(true)
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opener: true, topic: topicTitle, history: [] }),
    })
      .then((r) => r.json())
      .then(({ reply, translation }) => {
        const botMessage: Message = {
          id: crypto.randomUUID(),
          type: "bot",
          text: reply,
          translation: translation ?? undefined,
          timestamp: new Date(),
        }
        setMessages([botMessage])
        historyRef.current = [{ role: "assistant", content: reply }]
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [topicId, topicTitle])

  const sendMessage = useCallback(async (text: string) => {
    const userMessageId = crypto.randomUUID()
    const userMessage: Message = {
      id: userMessageId,
      type: "user",
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyRef.current }),
      })
      const { reply, translation, correction } = await res.json()

      if (!res.ok) throw new Error("Chat API error")

      if (correction) {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMessageId ? { ...m, correction } : m))
        )
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        type: "bot",
        text: reply,
        translation: translation ?? undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ]

      messageCountRef.current += 1
      onSessionUpdate?.(messageCountRef.current)
    } catch (err) {
      console.error("[useChat]", err)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: "bot",
        text: "Algo salió mal. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [onSessionUpdate])

  return { messages, isLoading, sendMessage }
}
