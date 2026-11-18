"use client"

// "¿Cómo se dice…?" at the top of Frases: the same panel as the global sheet
// (components/ask/ask-panel.tsx), inline. Asking stores nothing; keeping the
// answer as a word or a phrase is one tap.

import { AskPanel } from "@/components/ask/ask-panel"

export function CaptureCard({ onCaptured }: { onCaptured?: () => void }) {
  return <AskPanel variant="card" onSaved={() => onCaptured?.()} />
}
