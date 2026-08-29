"use client"

// Capture a real-life gap: "I couldn't say X". The Spanish is generated
// immediately, so the capture becomes a usable library phrase on the spot —
// no waiting for a daily pack to teach it back.

import { useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { DuoIcon } from "@/components/icons"
import { capturePhrase } from "@/lib/phrases/pack"

export function CaptureCard({ onCaptured }: { onCaptured?: () => void }) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const posthog = usePostHog()

  const submit = async () => {
    const text = value.trim()
    if (!text || busy) return
    setBusy(true)
    try {
      const phrase = await capturePhrase(text)
      posthog.capture("phrase_captured", { ok: !!phrase })
      if (phrase) {
        setValue("")
        toast.success(phrase.text, { description: phrase.translation })
        onCaptured?.()
      } else {
        toast.info("Ya la tenías guardada")
        setValue("")
      }
    } catch {
      toast.error("No se pudo generar la frase", { description: "Probá de nuevo en un momento." })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="clay-static mt-3.5 rounded-[22px] p-4">
      <div className="flex items-center gap-2">
        <DuoIcon name="rayo" size={17} />
        <p className="text-[14.5px] font-semibold text-ink">¿Qué no pudiste decir hoy?</p>
      </div>
      <div className="mt-3 flex gap-[9px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="En cualquier idioma…"
          disabled={busy}
          className="clay-recessed h-11 min-w-0 flex-1 rounded-full px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-1 focus:ring-green/40 disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={busy || !value.trim()}
          className="clay-green flex h-11 flex-none items-center justify-center rounded-full px-5 text-[14.5px] font-semibold text-cream disabled:opacity-50"
        >
          {busy ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="#F7F3EC" strokeOpacity=".3" strokeWidth="2.6" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="#F7F3EC" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          ) : (
            "Dale"
          )}
        </button>
      </div>
    </div>
  )
}
