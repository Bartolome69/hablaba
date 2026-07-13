"use client"

// Shared "mute the reading-out" preference for the conversation screens
// (Practice chat + Grow Catch up). One toggle, persisted, so muting on one
// screen mutes auto-play everywhere. Tap-to-hear on a bubble still works.

import { useCallback, useEffect, useState } from "react"

const KEY = "hablaba_tts_muted"
const EVENT = "hablaba-tts-muted-change"

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export function useTtsMuted() {
  const [muted, setMutedState] = useState(false)

  useEffect(() => {
    const sync = () => setMutedState(read())
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const setMuted = useCallback((next: boolean) => {
    try {
      if (next) localStorage.setItem(KEY, "1")
      else localStorage.removeItem(KEY)
      window.dispatchEvent(new CustomEvent(EVENT))
    } catch {}
    setMutedState(next)
  }, [])

  const toggle = useCallback(() => setMuted(!read()), [setMuted])

  return { muted, setMuted, toggle }
}
