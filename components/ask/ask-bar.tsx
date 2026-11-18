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
      {/* Two targets in one pill: the text opens the sheet to type, the mic
          opens it already listening. The mic used to be decoration, so
          tapping it got you a keyboard instead of a microphone. */}
      <div className="clay-recessed flex h-12 w-full items-center rounded-full pr-0.5">
        <button
          onClick={() => {
            posthog.capture("ask_opened", { from: "bar" })
            openAskSheet()
          }}
          className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-l-full pl-4 text-left"
        >
          <DuoIcon name="rayo" size={17} />
          <span className="flex-1 text-[15px] text-ink-muted">¿Cómo se dice…?</span>
        </button>
        <button
          onClick={() => {
            posthog.capture("ask_opened", { from: "bar_mic" })
            openAskSheet({ listen: true })
          }}
          aria-label="Preguntar hablando"
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-surface text-ink"
        >
          <DuoIcon name="micro" size={17} />
        </button>
      </div>
    </div>
  )
}
