"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import type { Message, PracticeMode } from "@/lib/types"
import type { HistoryMessage } from "@/lib/api"
import { saveChatMessages, loadChatMessages } from "@/lib/chat-cache"
import { extractReply } from "@/lib/utils"

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
      body: JSON.stringify({ opener: true, topic: topicTitle, topicId, history: [] }),
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
      .catch(() => {
        toast.error("No se pudo conectar", { description: "Check your connection and try again." })
      })
      .finally(() => setIsLoading(false))
  }, [sessionId, topicId, topicTitle])

  const sendMessage = useCallback(async (text: string) => {
    const userMessageId = crypto.randomUUID()
    const botId = crypto.randomUUID()
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

    // Add (once) or update the streaming bot bubble as text arrives. The
    // updater is pure — it decides from `prev` whether the bubble exists — so
    // it's safe under React's double-invoked updaters in dev.
    let sawFirstToken = false
    const renderReply = (partial: string) => {
      if (!sawFirstToken) {
        sawFirstToken = true
        setIsLoading(false)
      }
      setMessages((prev) =>
        prev.some((m) => m.id === botId)
          ? prev.map((m) => (m.id === botId ? { ...m, text: partial, streaming: true } : m))
          : [...prev, { id: botId, type: "bot", text: partial, timestamp: new Date(), streaming: true }],
      )
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: historyRef.current, topicId, stream: true }),
      })
      if (!res.ok || !res.body) throw new Error("Chat API error")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let raw = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        raw += decoder.decode(value, { stream: true })
        const partial = extractReply(raw)
        if (partial != null) renderReply(partial)
      }
      raw += decoder.decode()

      const data = JSON.parse(raw) as {
        reply: string
        translation?: string
        correction?: (Message["correction"] & { corrected_translation?: string | null }) | null
      }
      const reply = data.reply ?? extractReply(raw) ?? ""
      renderReply(reply)

      setMessages((prev) => {
        const updated = prev.map((m) => {
          if (m.id === botId) return { ...m, text: reply, translation: data.translation ?? undefined, streaming: false }
          if (m.id === userMessageId && data.correction) return { ...m, correction: data.correction }
          return m
        })
        saveChatMessages(sessionId, updated)
        return updated
      })

      onNewBotMessage?.(botId, reply)

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ]

      messageCountRef.current += 1
      onSessionUpdate?.(messageCountRef.current)
    } catch (err) {
      console.error("[useChat]", err)
      toast.error("Algo salió mal", { description: "Your message wasn't sent. Try again." })
      // Remove the user message (and any partial bot bubble) that failed
      setMessages((prev) => {
        const updated = prev.filter((m) => m.id !== userMessageId && m.id !== botId)
        saveChatMessages(sessionId, updated)
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, onSessionUpdate, onNewBotMessage, topicId])

  return { messages, isLoading, sendMessage }
}
