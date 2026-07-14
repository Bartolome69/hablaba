"use client"

import { useState, useEffect, useCallback } from "react"
import type { StoredSession } from "@/lib/types"

const STORAGE_KEY = "hablaba_sessions"

// Most recently active first, so "Pick up where you left off" is reverse-chronological.
const byRecent = (a: StoredSession, b: StoredSession) =>
  new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()

export function useSessions() {
  const [sessions, setSessions] = useState<StoredSession[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setSessions((JSON.parse(stored) as StoredSession[]).sort(byRecent))
    } catch {}
  }, [])

  const upsertSession = useCallback((session: StoredSession) => {
    setSessions((prev) => {
      const others = prev.filter((s) => s.id !== session.id)
      const trimmed = [session, ...others].sort(byRecent).slice(0, 10) // most recent first, keep 10
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
      return trimmed
    })
  }, [])

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return { sessions, upsertSession, deleteSession }
}
