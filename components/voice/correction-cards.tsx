"use client"

// "Repasá tus correcciones": the week's grammar corrections as tap-to-reveal
// cards — your own sentence shown first, the natural version revealed on tap.
// Active recall over your OWN errors, which is the material no generic
// exercise pack can offer.

import { useState } from "react"
import { DuoIcon } from "@/components/icons"
import type { VoiceObservationRecord } from "@/lib/voice/types"

export function CorrectionCards({ corrections }: { corrections: VoiceObservationRecord[] }) {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())

  if (corrections.length === 0) return null

  const reveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <section className="mb-6">
      <h2 className="px-1 font-serif text-[19px] text-ink">Repasá tus correcciones</h2>
      <p className="mt-1 px-1 text-[12.5px] text-ink-soft">
        Lo que dijiste esta semana — tocá para ver la forma natural.
      </p>
      <ul className="mt-3 space-y-2">
        {corrections.map((c) => {
          const open = revealed.has(c.id)
          return (
            <li key={c.id}>
              <button
                onClick={() => reveal(c.id)}
                aria-expanded={open}
                className="clay-card w-full rounded-[18px] px-4 py-3.5 text-left"
              >
                <p className="font-serif text-[17px] leading-[1.4] text-ink">
                  «{c.detail.original}»
                </p>
                {open ? (
                  <div className="anim-settle mt-2.5 border-t border-rule-soft pt-2.5">
                    <p className="text-sm font-semibold text-terracotta-ink">
                      Mejor: «{c.detail.corrected?.trim().replace(/\.$/, "")}».
                    </p>
                    {c.detail.note && (
                      <p className="mt-1 text-xs leading-relaxed text-ink-muted text-pretty">
                        {c.detail.note}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                    <DuoIcon name="pista" size={14} />
                    ¿Cómo lo dirías mejor?
                  </p>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
