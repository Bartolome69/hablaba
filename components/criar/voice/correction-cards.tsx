"use client"

// "Repasá tus correcciones": the week's grammar corrections as tap-to-reveal
// cards — your own sentence shown first, the natural version revealed on tap.
// Active recall over your OWN errors, which is the material no generic
// exercise pack can offer. (A graded quiz version that plugs into the
// exercises engine is the designed next step; the observation shape already
// carries everything it needs.)

import { useState } from "react"
import { Eye } from "lucide-react"
import type { CriarVoiceObservation } from "@/lib/criar/voice/types"

export function CorrectionCards({ corrections }: { corrections: CriarVoiceObservation[] }) {
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
      <h2 className="mb-1 text-sm font-semibold text-foreground">Repasá tus correcciones</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Lo que dijiste esta semana — tocá para ver la forma natural.
      </p>
      <ul className="space-y-2">
        {corrections.map((c) => {
          const open = revealed.has(c.id)
          return (
            <li key={c.id}>
              <button
                onClick={() => reveal(c.id)}
                aria-expanded={open}
                className="w-full rounded-2xl bg-secondary/50 px-4 py-3 text-left transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <p className="text-sm leading-relaxed text-foreground">
                  &ldquo;{c.detail.original}&rdquo;
                </p>
                {open ? (
                  <>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed text-primary">
                      {c.detail.corrected}
                    </p>
                    {c.detail.note && (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
                        {c.detail.note}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
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
