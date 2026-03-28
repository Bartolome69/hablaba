"use client"

import { useState, useEffect, useCallback } from "react"
import type { StoredSession } from "@/lib/types"

const STORAGE_KEY = "hablaba_sessions"

export function useSessions() {
  const [sessions, setSessions] = useState<StoredSession[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSessions(JSON.parse(stored))
    } catch {}
  }, [])

  const upsertSession = useCallback((session: StoredSession) => {
    setSessions((prev) => {
      const existing = prev.findIndex((s) => s.id === session.id)
      const updated =
        existing >= 0
          ? prev.map((s) => (s.id === session.id ? session : s))
          : [session, ...prev]
      const trimmed = updated.slice(0, 10) // keep last 10
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      return trimmed
    })
  }, [])

  return { sessions, upsertSession }
}
