"use client"

// Keeps the screen awake while a conversation is running — the parent has one
// hand on a pram and is not going to tap the screen every 30 seconds to stop it
// sleeping.
//
// Mobile Safari notes: the Screen Wake Lock API landed in iOS 16.4, so this is
// feature-detected and degrades silently on older phones. The lock is also
// released by the system whenever the page is hidden, and is NOT restored
// automatically — hence the visibilitychange re-acquire.

import { useEffect, useRef, useState } from "react"
import { wakeLockSupported } from "@/lib/voice/platform"

/**
 * Whether the screen is being held on: "held", "unsupported" (no Screen Wake
 * Lock API, e.g. iOS before 16.4), "denied" (the browser refused, e.g. low
 * battery) or "off" (not asked). Phase 6 shows the iPhone note from this, so
 * the app only promises what's actually true.
 */
export type WakeLockStatus = "held" | "unsupported" | "denied" | "off"

export function useWakeLock(active: boolean): WakeLockStatus {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  const [status, setStatus] = useState<WakeLockStatus>("off")

  useEffect(() => {
    if (!active) return
    if (!wakeLockSupported()) return
    let cancelled = false
    const acquire = async () => {
      if (cancelled || document.visibilityState !== "visible") return
      try {
        sentinelRef.current = await navigator.wakeLock.request("screen")
        if (!cancelled) setStatus("held")
        sentinelRef.current.addEventListener?.("release", () => {
          if (!cancelled && document.visibilityState === "visible") setStatus("denied")
        })
      } catch {
        // Denied (low battery, no user activation): say so, don't pretend.
        if (!cancelled) setStatus("denied")
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
      setStatus("off")
    }
  }, [active])

  // "off" and "unsupported" are derived, not stored: nothing to wait for.
  if (!active) return "off"
  if (!wakeLockSupported()) return "unsupported"
  return status
}
