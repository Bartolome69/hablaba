"use client"

// Tap-to-translate for transcript turns: first tap fetches the English and
// reveals it, later taps toggle it. Translations are cached per turn id so a
// bubble never bills twice. Used by the live voice transcript (mic stays live
// while reading — no need to pause the conversation) and the saved-transcript
// detail view.

import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

export function useTurnTranslations() {
  const [translations, setTranslations] = useState<Record<string, string>>({})
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const cacheRef = useRef<Record<string, string>>({})

  const toggle = useCallback(async (id: string, text: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        return next
      }
      next.add(id)
      return next
    })

    if (cacheRef.current[id]) return

    setPendingId(id)
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error(`Translate API error: ${res.status}`)
      const data = (await res.json()) as { translation: string }
      cacheRef.current[id] = data.translation
      setTranslations((prev) => ({ ...prev, [id]: data.translation }))
    } catch {
      // Close the reveal and let the parent tap again to retry.
      setOpenIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.error("No se pudo traducir", { description: "Tocá de nuevo para reintentar." })
    } finally {
      setPendingId((prev) => (prev === id ? null : prev))
    }
  }, [])

  return { translations, openIds, pendingId, toggle }
}
