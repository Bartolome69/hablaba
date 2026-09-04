"use client"

// "The word I want is ___". English in, Spanish out, onto the list — the same
// move as CaptureCard on Frases, and deliberately the same shape so the two
// read as one habit: whatever you couldn't say, type it, keep it.

import { useState } from "react"
import { toast } from "sonner"
import { usePostHog } from "posthog-js/react"
import { DuoIcon } from "@/components/icons"
import { addOwnWord } from "@/lib/vocab/add"
import { withArticle } from "@/lib/vocab/types"

export function AddWordCard({ onAdded }: { onAdded?: () => void }) {
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const posthog = usePostHog()

  const submit = async () => {
    const term = value.trim()
    if (!term || busy) return
    setBusy(true)
    try {
      const outcome = await addOwnWord(term)
      posthog.capture("vocab_word_added", { status: outcome.status })
      setValue("")
      if (outcome.status === "added") {
        toast.success(withArticle(outcome.word), { description: outcome.word.english })
        onAdded?.()
      } else {
        toast.info(`Ya tenías «${outcome.spanish}»`)
      }
    } catch {
      toast.error("No se pudo traducir la palabra", {
        description: "Probá de nuevo en un momento.",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="clay-static mt-3.5 rounded-[22px] p-4">
      <div className="flex items-center gap-2">
        <DuoIcon name="brote" size={17} />
        <p className="text-[14.5px] font-semibold text-ink">¿Qué palabra querés aprender?</p>
      </div>
      <div className="mt-3 flex gap-[9px]">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="En inglés: pushchair, spoon…"
          disabled={busy}
          aria-label="Palabra en inglés"
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
      <p className="mt-2.5 px-1 text-[12px] leading-snug text-ink-soft">
        Te doy la palabra con su artículo y una frase para usarla. Va directo a tu lista.
      </p>
    </div>
  )
}
