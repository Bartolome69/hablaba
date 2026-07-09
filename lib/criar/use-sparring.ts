"use client"

// Sparring chat state — a themed instance of the app's chat mechanics,
// pointed at /api/criar/sparring with context assembled from recent packs
// and captures. Sessions are ephemeral (not cached): each visit starts fresh.

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { Message } from "@/lib/types"
import type { CriarChild } from "./types"
import type { SparringContext } from "./prompts"
import { describeAge } from "./stage"
import { listCaptures, listPacks, updateCapture } from "./store"

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
  const historyRef = useRef<{ role: "user" | "assistant"; content: string }[]>([])
  const contextRef = useRef<SparringContext | null>(null)
  const initializedRef = useRef(false)
  const onBotMessageRef = useRef(onNewBotMessage)
  onBotMessageRef.current = onNewBotMessage

  useEffect(() => {
    if (!child || initializedRef.current) return
    initializedRef.current = true

    const context = assembleContext(child)
    contextRef.current = context

    setIsLoading(true)
    fetch("/api/criar/sparring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opener: true, history: [], context }),
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
      setMessages((prev) => [...prev, botMessage])
      historyRef.current = [
        ...historyRef.current,
        { role: "user", content: text },
        { role: "assistant", content: reply },
      ]
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
  }, [])

  return { messages, isLoading, sendMessage }
}
