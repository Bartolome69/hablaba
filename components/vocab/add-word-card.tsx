"use client"

// "¿Falta alguna?" at the bottom of a pack: the "¿Cómo se dice…?" panel
// (components/ask/ask-panel.tsx) with this pack as the word target. English or
// Spanish in; Spanish is kept as typed.

import { AskPanel } from "@/components/ask/ask-panel"
import { packLabelInline } from "@/lib/vocab/catalog"
import type { VocabSetId } from "@/lib/vocab/types"

interface AddWordCardProps {
  /** Target pack. Without a pack context, words go to Tus palabras. */
  set?: VocabSetId
  onAdded?: () => void
}

export function AddWordCard({ set = "propias", onAdded }: AddWordCardProps) {
  const own = set === "propias"
  return (
    <AskPanel
      variant="card"
      title={own ? "¿Qué palabra quieres aprender?" : "¿Falta alguna?"}
      icon="brote"
      target={{ set }}
      placeholder="En español o en inglés…"
      helper={`Escríbela como te salga. Te doy la palabra con su artículo y una frase, y la guardas en ${packLabelInline(set)}.`}
      onSaved={(kind) => kind === "word" && onAdded?.()}
    />
  )
}
