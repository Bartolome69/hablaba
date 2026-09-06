"use client"

// Whether she reads her replies aloud in TEXT chat. The only voice setting
// left — she has one voice now (lib/voices.ts), so there's nothing to pick.

import { useCallback, useEffect, useState } from "react"

const KEY = "hablaba_read_aloud"
const LEGACY_VOICE_KEY = "hablaba_voice"

export function useReadAloud() {
  /**
   * Off by default and staying that way: this app is used one-handed on a bus
   * and next to a sleeping baby, so sound is something you ask for, never
   * something that happens to you. Voice mode is unaffected — it speaks either
   * way, that being the point of it.
   */
  const [readAloud, setReadAloudState] = useState(false)

  useEffect(() => {
    setReadAloudState(localStorage.getItem(KEY) === "1")
    // The voice pick is gone; clear the key rather than leave dead state on
    // the device pointing at a voice nothing reads any more.
    try {
      localStorage.removeItem(LEGACY_VOICE_KEY)
    } catch {}
  }, [])

  const setReadAloud = useCallback((on: boolean) => {
    setReadAloudState(on)
    try {
      localStorage.setItem(KEY, on ? "1" : "0")
    } catch {}
  }, [])

  return { readAloud, setReadAloud }
}
