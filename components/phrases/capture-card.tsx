"use client"

// "¿Cómo se dice…?": the app's "how do I say that?" box. The Spanish comes
// back immediately and is shown first; saving it to the library is a choice
// (one tap), not a side effect of asking. Spanish typed in is kept as the
// learner's own construction (see /api/phrases/generate).

import { useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { DuoIcon } from "@/components/icons"
import { isInLibrary, lookupCapture, saveCapture, type CaptureAnswer } from "@/lib/phrases/pack"
import { useTTS } from "@/hooks/use-tts"

export function CaptureCard({ onCaptured }: { onCaptured?: () => void }) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const [answer, setAnswer] = useState<CaptureAnswer | null>(null)
  const [saved, setSaved] = useState(false)
  const posthog = usePostHog()
  const { play, playingId } = useTTS("speak")

  const submit = async () => {
    const text = value.trim()
    if (!text || busy) return
    setBusy(true)
    try {
      const result = await lookupCapture(text)
      posthog.capture("phrase_looked_up", { ok: !!result })
      if (result) {
        setAnswer(result)
        setSaved(isInLibrary(result.text))
        setValue("")
      } else {
        toast.info("No encontré cómo decirlo", { description: "Probá con otras palabras." })
      }
    } catch {
      toast.error("No se pudo generar la frase", { description: "Probá de nuevo en un momento." })
    } finally {
      setBusy(false)
    }
  }

  const save = () => {
    if (!answer || saved) return
    const phrase = saveCapture(answer)
    posthog.capture("phrase_captured", { ok: !!phrase })
    setSaved(true)
    onCaptured?.()
  }

  const ready = !busy && !!value.trim()

  return (
    <div className="clay-static rounded-[22px] p-4">
      <div className="flex items-center gap-2">
        <DuoIcon name="rayo" size={17} />
        <p className="text-[14.5px] font-semibold text-ink">¿Cómo se dice…?</p>
      </div>
      <div className="mt-3 flex gap-[9px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="En inglés o en español…"
          aria-label="¿Cómo se dice…?"
          disabled={busy}
          className="clay-recessed h-11 min-w-0 flex-1 rounded-full px-4 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-1 focus:ring-green/40 disabled:opacity-60"
        />
        {/* Enabled: cream on green (8.9:1). Disabled: a flat recessed pill, not a faded green. */}
        <button
          onClick={submit}
          disabled={!ready}
          className={`flex h-11 flex-none items-center justify-center rounded-full px-5 text-[14.5px] font-semibold ${
            ready || busy ? "clay-green text-cream" : "bg-sunken-2 text-ink-muted"
          }`}
        >
          {busy ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-label="Buscando">
              <circle cx="12" cy="12" r="9" stroke="#F7F3EC" strokeOpacity=".3" strokeWidth="2.6" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="#F7F3EC" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
          ) : (
            "Dale"
          )}
        </button>
      </div>

      {answer && (
        <div className="mt-3.5 rounded-[18px] bg-sunken px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[21px] leading-[1.25] tracking-[-0.01em] text-ink">{answer.text}</p>
              <p className="mt-1 text-[13px] text-ink-muted">{answer.translation}</p>
            </div>
            <button
              onClick={() => play("capture-answer", answer.text)}
              aria-label="Escuchar"
              className="press-disc flex h-11 w-11 flex-none items-center justify-center rounded-full bg-surface"
            >
              <DuoIcon
                name="escuchar"
                size={19}
                className={playingId === "capture-answer" ? "animate-pulse" : ""}
              />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {saved ? (
              <span className="flex h-11 items-center gap-1.5 text-[13.5px] font-semibold text-green">
                <DuoIcon name="check" size={15} />
                En tus frases
              </span>
            ) : (
              <button
                onClick={save}
                className="clay-card flex h-11 items-center gap-1.5 rounded-full px-4 text-[13.5px] font-semibold text-ink"
              >
                <DuoIcon name="guardada" size={15} />
                Guardar
              </button>
            )}
            <button
              onClick={() => {
                setAnswer(null)
                setSaved(false)
              }}
              className="ml-auto flex h-11 items-center px-3 text-[13.5px] font-medium text-ink-muted"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
