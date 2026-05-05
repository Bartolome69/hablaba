"use client"

import { useState, useCallback, useEffect } from "react"

const STORAGE_KEY = "hablaba-heard-phrases"

export function useHeardPhrases() {
  const [heard, setHeard] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setHeard(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  const markHeard = useCallback((id: string) => {
    setHeard((prev) => {
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }, [])

  return { heard, markHeard }
}
