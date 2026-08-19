"use client"

// Keeps the screen awake while a conversation is running — the parent has one
// hand on a pram and is not going to tap the screen every 30 seconds to stop it
// sleeping.
//
// Mobile Safari notes: the Screen Wake Lock API landed in iOS 16.4, so this is
// feature-detected and degrades silently on older phones. The lock is also
// released by the system whenever the page is hidden, and is NOT restored
// automatically — hence the visibilitychange re-acquire.

import { useEffect, useRef } from "react"

export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return

    let cancelled = false

    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return
      try {
        sentinelRef.current = await navigator.wakeLock.request("screen")
      } catch {
        // Denied (low battery, unsupported) — not worth surfacing to the parent.
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire()
    }

    void acquire()
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisibility)
      void sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [active])
}
