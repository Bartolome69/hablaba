"use client"

// Lock-screen controls for a live conversation.
//
// Two jobs, both aimed at the pram case. First, the parent can pause, resume or
// end the session from the lock screen without unlocking the phone — one thumb,
// no looking, which is exactly the situation where someone starts talking to
// them. Second, declaring this as active media tells Android the tab is doing
// something real, which makes a backgrounded session less likely to be
// reclaimed while the screen is off.

import { useEffect } from "react"

export function useMediaSession({
  active,
  paused,
  onPause,
  onResume,
  onStop,
}: {
  /** True for the whole conversation, paused or not. */
  active: boolean
  paused: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
}) {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return

    const session = navigator.mediaSession

    if (!active) {
      session.playbackState = "none"
      return
    }

    try {
      session.metadata = new MediaMetadata({
        title: paused ? "Charla en pausa" : "Charlando en español",
        artist: "Hablaba",
        artwork: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      })
      session.playbackState = paused ? "paused" : "playing"
    } catch {
      // MediaMetadata is unavailable on some builds — the action handlers below
      // are the part that actually matters, so keep going.
    }

    // Now that pausing is a real thing the session can do, these map to their
    // honest meanings: pause holds the conversation (mic released, resumable),
    // play resumes it, stop ends and saves it.
    const handlers: [MediaSessionAction, () => void][] = [
      ["pause", onPause],
      ["play", onResume],
      ["stop", onStop],
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
  }, [active, paused, onPause, onResume, onStop])
}
