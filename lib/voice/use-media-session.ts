"use client"

// Lock-screen controls for a live conversation.
//
// Two jobs, both aimed at the pram case. First, the parent can end the session
// from the lock screen without unlocking the phone — one thumb, no looking.
// Second, declaring this as active media tells Android the tab is doing
// something real, which makes a backgrounded session less likely to be
// reclaimed while the screen is off.

import { useEffect } from "react"

export function useMediaSession(active: boolean, onStop: () => void) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return

    const session = navigator.mediaSession

    if (!active) {
      session.playbackState = "none"
      return
    }

    try {
      session.metadata = new MediaMetadata({
        title: "Charlando en español",
        artist: "Hablaba · Grow",
        artwork: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      })
      session.playbackState = "playing"
    } catch {
      // MediaMetadata is unavailable on some builds — the action handlers below
      // are the part that actually matters, so keep going.
    }

    // Android surfaces whichever of these the page registers. Both map to
    // ending the conversation: there is no meaningful "paused" state for a
    // live call, and offering one that silently deafens the mic would be worse
    // than not offering it.
    const handlers: [MediaSessionAction, () => void][] = [
      ["stop", onStop],
      ["pause", onStop],
    ]
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // Unsupported action on this browser — skip it.
      }
    }

    return () => {
      session.playbackState = "none"
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null)
        } catch {}
      }
    }
  }, [active, onStop])
}
