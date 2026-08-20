"use client"

// Capture a real-life gap: "I couldn't say X". The Spanish is generated
// immediately, so the capture becomes a usable library phrase on the spot —
// no waiting for a daily pack to teach it back.

import { useState } from "react"
import { Loader2, Zap } from "lucide-react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
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
    <div className="mb-5 rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium text-foreground">¿Qué no pudiste decir hoy?</p>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="En cualquier idioma…"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={busy || !value.trim()}
          className="flex h-10 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-all active:scale-[0.97] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dale"}
        </button>
      </div>
    </div>
  )
}
