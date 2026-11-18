"use client"

// The thumb-height "¿Cómo se dice?" bar, just above the bottom nav on every
// tab. One tap opens the sheet with the keyboard up. Rendered inside the nav
// so it always sits exactly above the tabs, whatever the safe-area inset.

import { usePostHog } from "posthog-js/react"
import { DuoIcon } from "@/components/icons"
import { openAskSheet } from "@/lib/ask/sheet"

export function AskBar() {
  const posthog = usePostHog()
  return (
    <div className="mx-auto max-w-lg px-[22px] pt-2.5">
      <button
        onClick={() => {
          posthog.capture("ask_opened", { from: "bar" })
          openAskSheet()
        }}
        className="clay-recessed flex h-12 w-full items-center gap-2.5 rounded-full pl-4 pr-1.5 text-left"
      >
        <DuoIcon name="rayo" size={17} />
        <span className="flex-1 text-[15px] text-ink-muted">¿Cómo se dice…?</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink" aria-hidden>
          <DuoIcon name="micro" size={17} />
        </span>
      </button>
    </div>
  )
}
