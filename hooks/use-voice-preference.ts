"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "hablaba_voice_gender"

export type VoiceGender = "male" | "female"

export function useVoicePreference() {
  const [gender, setGenderState] = useState<VoiceGender>("female")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "male" || stored === "female") setGenderState(stored)
  }, [])

  const setGender = useCallback((g: VoiceGender) => {
    setGenderState(g)
    localStorage.setItem(STORAGE_KEY, g)
  }, [])

  return { gender, setGender }
}
