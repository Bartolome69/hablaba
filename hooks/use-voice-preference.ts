"use client"

import { useCallback, useEffect, useState } from "react"
import { type VoiceId, defaultVoiceId, resolveVoiceId } from "@/lib/voices"

const STORAGE_KEY = "hablaba_voice"
const READ_ALOUD_KEY = "hablaba_read_aloud"

export function useVoicePreference() {
  const [voiceId, setVoiceIdState] = useState<VoiceId>(defaultVoiceId)
  /**
   * Speak her replies in TEXT chat as they arrive. Off by default and staying
   * that way: this app is used one-handed on a bus and next to a sleeping
   * baby, so sound is something you ask for, never something that happens to
   * you. Voice mode is unaffected — it speaks either way, that being the point
   * of it.
   */
  const [readAloud, setReadAloudState] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      // Stored ids predate the shared voice set; resolve carries an old pick
      // (nova, onyx, fable) to its current equivalent. Written back so the
      // mapping happens once rather than on every read.
      const resolved = resolveVoiceId(stored)
      setVoiceIdState(resolved)
      if (resolved !== stored) {
        try {
          localStorage.setItem(STORAGE_KEY, resolved)
        } catch {}
      }
    }
    setReadAloudState(localStorage.getItem(READ_ALOUD_KEY) === "1")
  }, [])

  const setVoiceId = useCallback((id: VoiceId) => {
    setVoiceIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const setReadAloud = useCallback((on: boolean) => {
    setReadAloudState(on)
    try {
      localStorage.setItem(READ_ALOUD_KEY, on ? "1" : "0")
    } catch {}
  }, [])

  return { voiceId, setVoiceId, readAloud, setReadAloud }
}
