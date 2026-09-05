"use client"

import { useCallback, useEffect, useState } from "react"
import { type VoiceId, defaultVoiceId, resolveVoiceId } from "@/lib/voices"

const STORAGE_KEY = "hablaba_voice"

export function useVoicePreference() {
  const [voiceId, setVoiceIdState] = useState<VoiceId>(defaultVoiceId)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
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
  }, [])

  const setVoiceId = useCallback((id: VoiceId) => {
    setVoiceIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return { voiceId, setVoiceId }
}
