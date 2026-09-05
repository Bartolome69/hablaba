"use client"

// Text side of a conversation thread. Same mechanics as the old useChat — plain
// hooks and refs, streaming reply, inline corrections — but reading and writing
// the unified conversation store instead of a per-session cache, so typed and
// spoken turns land in one ordered history.
//
// Inline corrections stay a TEXT-mode feature by design: a correction card is
// readable when you're looking at the screen and useless when the phone is in
// a pocket, so voice turns defer everything to the post-session review.

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import type { Correction } from "@/lib/types"
import { extractReply } from "@/lib/utils"
import { listTurns, nextOrdinal, saveTurn } from "./store"
import type { ConversationTurn } from "./types"

interface ChatHistoryMessage {
  role: "user" | "assistant"
  content: string
}

export function useConversation(
  conversationId: string | null,
  topicTitle?: string,
  /** Starter id — forwarded so /api/chat can pick a topic-specific persona. */
  topicId?: string,
  /**
   * Fired once per FINISHED assistant turn — never for a streaming partial, so
   * a caller can't end up speaking a half-sentence. The read-aloud setting
   * hangs off this; the hook stays about the thread and knows nothing about
   * audio.
   */
  onAssistantTurn?: (turn: ConversationTurn) => void,
) {
  // Held in a ref so a caller can pass an inline closure without the opener
  // effect re-running (and re-fetching) on every render.
  const onAssistantTurnRef = useRef(onAssistantTurn)
  onAssistantTurnRef.current = onAssistantTurn
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const initializedRef = useRef<string | null>(null)

  const reload = useCallback(() => {
    if (!conversationId) return
    setTurns(listTurns(conversationId))
  }, [conversationId])

  /** Rebuilt from the stored thread each send, so voice turns become chat context too. */
  const buildHistory = useCallback((): ChatHistoryMessage[] => {
    if (!conversationId) return []
    return listTurns(conversationId).map((t) => ({
      role: t.speaker === "user" ? "user" : "assistant",
      content: t.text,
    }))
  }, [conversationId])

  const persist = useCallback(
    (turn: ConversationTurn) => {
      saveTurn(turn)
      setTurns(listTurns(turn.conversationId))
    },
    [],
  )

  // Load the thread, and fetch an opener if it's brand new.
  useEffect(() => {
    if (!conversationId || initializedRef.current === conversationId) return
    initializedRef.current = conversationId

    const existing = listTurns(conversationId)
    if (existing.length > 0) {
      setTurns(existing)
      return
    }
    if (!topicTitle) return

    setIsLoading(true)
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opener: true, topic: topicTitle, topicId, history: [] }),
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Chat API error: ${r.status}`)
        return r.json()
      })
      .then(({ reply, translation }) => {
        const turn: ConversationTurn = {
          id: crypto.randomUUID(),
          conversationId,
          speaker: "assistant",
          modality: "text",
          text: reply,
          translation: translation ?? undefined,
          createdAt: new Date().toISOString(),
          ordinal: 0,
        }
        persist(turn)
        onAssistantTurnRef.current?.(turn)
      })
      .catch(() => {
        toast.error("No se pudo empezar", { description: "Check your connection and try again." })
      })
      .finally(() => setIsLoading(false))
  }, [conversationId, topicTitle, topicId, persist])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !text.trim()) return

      const history = buildHistory()
      const userTurn: ConversationTurn = {
        id: crypto.randomUUID(),
        conversationId,
        speaker: "user",
        modality: "text",
        text,
        createdAt: new Date().toISOString(),
        ordinal: nextOrdinal(conversationId),
      }
      persist(userTurn)
      setIsLoading(true)

      const botId = crypto.randomUUID()
      const botOrdinal = userTurn.ordinal + 1
      let sawFirstToken = false

      // Render the reply as it streams, without persisting every keystroke —
      // only the finished turn is written, plus one write per repaint is enough.
      const renderPartial = (partial: string) => {
        if (!sawFirstToken) {
          sawFirstToken = true
          setIsLoading(false)
        }
        setTurns((prev) => {
          const withoutBot = prev.filter((t) => t.id !== botId)
          return [
            ...withoutBot,
            {
              id: botId,
              conversationId,
              speaker: "assistant" as const,
              modality: "text" as const,
              text: partial,
              createdAt: new Date().toISOString(),
              ordinal: botOrdinal,
            },
          ]
        })
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history }),
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
          if (partial != null) renderPartial(partial)
        }
        raw += decoder.decode()

        const data = JSON.parse(raw) as {
          reply?: string
          translation?: string
          correction?: Correction | null
        }
        const reply = data.reply ?? extractReply(raw) ?? ""

        const botTurn: ConversationTurn = {
          id: botId,
          conversationId,
          speaker: "assistant",
          modality: "text",
          text: reply,
          translation: data.translation ?? undefined,
          createdAt: new Date().toISOString(),
          ordinal: botOrdinal,
        }
        persist(botTurn)
        onAssistantTurnRef.current?.(botTurn)

        // Corrections attach to the user's turn, which is where they're read.
        if (data.correction && data.correction.corrected !== data.correction.original) {
          persist({ ...userTurn, correction: data.correction })
        }
      } catch (err) {
        console.error("[useConversation]", err)
        toast.error("Algo salió mal", { description: "Your message wasn't sent. Try again." })
        setTurns((prev) => prev.filter((t) => t.id !== botId))
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, buildHistory, persist],
  )

  return { turns, isLoading, sendMessage, reload }
}
