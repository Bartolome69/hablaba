"use client"

import { useCallback, useEffect, useState } from "react"
import { type VoiceId, defaultVoiceId } from "@/lib/voices"

const STORAGE_KEY = "hablaba_voice"

export function useVoicePreference() {
  const [voiceId, setVoiceIdState] = useState<VoiceId>(defaultVoiceId)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as VoiceId | null
    if (stored) setVoiceIdState(stored)
  }, [])

  const setVoiceId = useCallback((id: VoiceId) => {
    setVoiceIdState(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return { voiceId, setVoiceId }
}
