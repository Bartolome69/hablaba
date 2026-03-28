"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import type { Message, PracticeMode } from "@/lib/types"
import type { HistoryMessage } from "@/lib/api"
import { saveChatMessages, loadChatMessages } from "@/lib/chat-cache"

interface UseChatOptions {
  mode: PracticeMode
  topicId?: string
  topicTitle?: string
  sessionId: string
  onSessionUpdate?: (messageCount: number) => void
  onNewBotMessage?: (id: string, text: string) => void
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
  sessionId,
  onSessionUpdate,
  onNewBotMessage,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const historyRef = useRef<HistoryMessage[]>([])
  const messageCountRef = useRef(0)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // Try to restore cached messages first
    const cached = loadChatMessages(sessionId)
    if (cached && cached.length > 0) {
      setMessages(cached)
      messageCountRef.current = cached.filter((m) => m.type === "user").length
      // Rebuild history from cached messages for the AI context
      historyRef.current = cached.map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text,
      })) as HistoryMessage[]
      return
    }

    // No cache — fetch the bot opener for this topic
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
        saveChatMessages(sessionId, [botMessage])
        onNewBotMessage?.(botMessage.id, botMessage.text)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [sessionId, topicId, topicTitle])

  const sendMessage = useCallback(async (text: string) => {
    const userMessageId = crypto.randomUUID()
    const userMessage: Message = {
      id: userMessageId,
      type: "user",
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => {
      const updated = [...prev, userMessage]
      saveChatMessages(sessionId, updated)
      return updated
    })
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyRef.current }),
      })
      const { reply, translation, correction } = await res.json()

      if (!res.ok) throw new Error("Chat API error")

      setMessages((prev) => {
        const withCorrection = correction
          ? prev.map((m) => (m.id === userMessageId ? { ...m, correction } : m))
          : prev
        saveChatMessages(sessionId, withCorrection)
        return withCorrection
      })

      const botMessage: Message = {
        id: crypto.randomUUID(),
        type: "bot",
        text: reply,
        translation: translation ?? undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => {
        const updated = [...prev, botMessage]
        saveChatMessages(sessionId, updated)
        return updated
      })

      onNewBotMessage?.(botMessage.id, botMessage.text)

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
      setMessages((prev) => {
        const updated = [...prev, errorMessage]
        saveChatMessages(sessionId, updated)
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, onSessionUpdate])

  return { messages, isLoading, sendMessage }
}
