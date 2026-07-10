"use client"

// Sparring chat state — a themed instance of the app's chat mechanics,
// pointed at /api/criar/sparring with context assembled from recent packs
// and captures. One session per child per day: reopening the same day
// resumes the cached conversation instead of restarting it.

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { Message } from "@/lib/types"
import type { CriarChild, SparringHistoryMessage } from "./types"
import type { SparringContext } from "./prompts"
import { describeAge } from "./stage"
import {
  getSparringSession,
  listCaptures,
  listPacks,
  saveSparringSession,
  todayKey,
  updateCapture,
} from "./store"

function assembleContext(child: CriarChild): SparringContext {
  const packs = listPacks(child.id).slice(0, 5) // roughly this week
  const packPhrases = packs.flatMap((p) => p.phrases.map((ph) => ph.spanish))
  const packLessons = packs.flatMap((p) =>
    p.captureLessons.map((l) => ({ request: l.request, spanish: l.spanish })),
  )
  return {
    childName: child.name,
    ageDescription: describeAge(child.birthdate),
    packPhrases,
    captureLessons: packLessons,
  }
}

export function useSparring(
  child: CriarChild | null,
  onNewBotMessage?: (id: string, text: string) => void,
) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const historyRef = useRef<SparringHistoryMessage[]>([])
  const contextRef = useRef<SparringContext | null>(null)
  const dateRef = useRef<string>("")
  const initializedRef = useRef(false)
  const onBotMessageRef = useRef(onNewBotMessage)
  onBotMessageRef.current = onNewBotMessage

  useEffect(() => {
    if (!child || initializedRef.current) return
    initializedRef.current = true

    const date = todayKey()
    dateRef.current = date
    contextRef.current = assembleContext(child)

    // Already sparred today — resume instead of restarting (no TTS replay)
    const cached = getSparringSession(child.id, date)
    if (cached) {
      setMessages(cached.messages)
      historyRef.current = cached.history
      return
    }

    setIsLoading(true)
    fetch("/api/criar/sparring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opener: true, history: [], context: contextRef.current }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Sparring API error: ${r.status}`)
        return r.json()
      })
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
        saveSparringSession(child.id, date, {
          messages: [botMessage],
          history: historyRef.current,
        })
        onBotMessageRef.current?.(botMessage.id, botMessage.text)
        // The session is now exercising taught material — bump taught → learning
        listCaptures(child.id)
          .filter((c) => c.status === "taught")
          .forEach((c) => updateCapture(c.id, { status: "learning" }))
      })
      .catch(() => {
        toast.error("No se pudo conectar", { description: "Check your connection and try again." })
      })
      .finally(() => setIsLoading(false))
  }, [child])

  const sendMessage = useCallback(async (text: string) => {
    if (!child) return null
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
      const res = await fetch("/api/criar/sparring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyRef.current,
          context: contextRef.current,
        }),
      })
      const { reply, translation, correction } = await res.json()
      if (!res.ok) throw new Error("Sparring API error")

      if (correction) {
        setMessages((prev) =>
          prev.map((m) => (m.id === userMessageId ? { ...m, correction } : m)),
        )
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        type: "bot",
        text: reply,
        translation: translation ?? undefined,
        timestamp: new Date(),
      }
      const newHistory: SparringHistoryMessage[] = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ]

      setMessages((prev) => {
        const updated = [...prev, botMessage]
        saveSparringSession(child.id, dateRef.current, { messages: updated, history: newHistory })
        return updated
      })
      historyRef.current = newHistory
      onBotMessageRef.current?.(botMessage.id, botMessage.text)
      return botMessage
    } catch (err) {
      console.error("[useSparring]", err)
      toast.error("Algo salió mal", { description: "Your message wasn't sent. Try again." })
      setMessages((prev) => prev.filter((m) => m.id !== userMessageId))
      return null
    } finally {
      setIsLoading(false)
    }
  }, [child])

  return { messages, isLoading, sendMessage }
}
