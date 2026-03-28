"use client"

import { useState, useCallback, useRef } from "react"
import type { Message, PracticeMode } from "@/lib/types"
import type { HistoryMessage } from "@/lib/api"
import { sendChatMessage } from "@/lib/api"
import { sampleMessages } from "@/lib/data"

interface UseChatOptions {
  mode: PracticeMode
  initialMessages?: Message[]
}

interface UseChatReturn {
  messages: Message[]
  isLoading: boolean
  sendMessage: (text: string) => void
}

export function useChat({
  mode: _mode,
  initialMessages = sampleMessages,
}: UseChatOptions): UseChatReturn {
  // Seed messages are shown on load but are not sent to the API as history.
  // Real history builds up as the user has an actual conversation.
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [isLoading, setIsLoading] = useState(false)
  const historyRef = useRef<HistoryMessage[]>([])

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
      const { reply, correction } = await sendChatMessage({
        message: text,
        history: historyRef.current,
      })

      // Attach correction to the user message, if the AI flagged one
      if (correction) {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMessageId ? { ...m, correction } : m))
        )
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        type: "bot",
        text: reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])

      // Grow the history for the next round-trip
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ]
    } catch (err) {
      console.error("[useChat]", err)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: "bot",
        text: "Something went wrong. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { messages, isLoading, sendMessage }
}
