"use client"

import { useEffect, useState } from "react"
import { usePostHog } from "posthog-js/react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-border bg-background p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <p className="font-serif text-base font-semibold">Add Hablaba to your home screen</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open it in one tap, build a daily routine.
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={onInstall} size="sm" className="flex-1 rounded-full">
          Install
        </Button>
        <Button onClick={onDismiss} size="sm" variant="ghost" className="rounded-full">
          Not now
        </Button>
      </div>
    </div>
  )
}
