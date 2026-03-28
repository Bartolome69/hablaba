"use client"

import { useState, useEffect, useCallback } from "react"
import type { SavedPhrase } from "@/lib/types"

const STORAGE_KEY = "hablaba_saved_phrases"

export function useSavedPhrases() {
  const [phrases, setPhrases] = useState<SavedPhrase[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setPhrases(JSON.parse(stored))
    } catch {}
  }, [])

  const savePhrase = useCallback((spanish: string, english: string) => {
    setPhrases((prev) => {
      if (prev.some((p) => p.spanish === spanish)) return prev
      const updated = [
        { id: crypto.randomUUID(), spanish, english, savedAt: new Date() },
        ...prev,
      ]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  return { phrases, savePhrase }
}
