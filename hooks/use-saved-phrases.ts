"use client"

import { useState, useEffect, useCallback } from "react"
import type { SavedPhrase, PracticeResult } from "@/lib/types"

const STORAGE_KEY = "hablaba_saved_phrases"

type StoredPhrase = Omit<SavedPhrase, "savedAt"> & { savedAt: string }

function persist(phrases: SavedPhrase[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(phrases))
  } catch {}
}

export function useSavedPhrases() {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as StoredPhrase[]
        setPhrases(parsed.map((p) => ({ ...p, savedAt: new Date(p.savedAt) })))
      }
    } catch {}
  }, [])

  const savePhrase = useCallback(
    (spanish: string, english: string, source: SavedPhrase["source"] = "correction") => {
      setPhrases((prev) => {
        if (prev.some((p) => p.spanish === spanish)) return prev
        const updated: SavedPhrase[] = [
          {
            id: crypto.randomUUID(),
            spanish,
            english,
            savedAt: new Date(),
            source,
            timesPracticed: 0,
            box: 0,
          },
          ...prev,
        ]
        persist(updated)
        return updated
      })
    },
    [],
  )

  const recordPractice = useCallback((id: string, result: PracticeResult) => {
    setPhrases((prev) => {
      const updated = prev.map((p) =>
        p.id === id
          ? {
              ...p,
              timesPracticed: (p.timesPracticed ?? 0) + 1,
              lastPracticedAt: new Date().toISOString(),
              box: result === "got_it" ? (p.box ?? 0) + 1 : 0,
            }
          : p,
      )
      persist(updated)
      return updated
    })
  }, [])

  const removePhrase = useCallback((id: string) => {
    setPhrases((prev) => {
      const updated = prev.filter((p) => p.id !== id)
      persist(updated)
      return updated
    })
  }, [])

  return { phrases, savePhrase, recordPractice, removePhrase }
}
