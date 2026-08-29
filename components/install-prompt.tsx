"use client"

import { useEffect, useState } from "react"
import { usePostHog } from "posthog-js/react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISSED_KEY = "hablaba-install-dismissed"

export function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const posthog = usePostHog()

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem(DISMISSED_KEY)) return
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
      setVisible(true)
      posthog?.capture("pwa_install_prompt_shown")
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [posthog])

  if (!visible || !event) return null

  async function onInstall() {
    if (!event) return
    await event.prompt()
    const choice = await event.userChoice
    posthog?.capture("pwa_install_choice", { outcome: choice.outcome })
    setVisible(false)
    setEvent(null)
    if (choice.outcome === "dismissed") {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    }
  }

  function onDismiss() {
    posthog?.capture("pwa_install_prompt_dismissed")
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <div className="clay-static fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-[20px] p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-serif text-[17px] leading-snug text-ink">Add Hablaba to your home screen</p>
          <p className="mt-1 text-[13px] text-ink-soft">Open it in one tap, build a daily routine.</p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="press-disc -mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:text-ink"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onInstall}
          className="clay-green h-10 flex-1 rounded-full text-sm font-semibold text-cream"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="press-chip h-10 rounded-full bg-sunken px-4 text-sm font-medium text-ink"
        >
          Not now
        </button>
      </div>
    </div>
  )
}
