// How far through a pack the learner is, as one proportional bar: sabidas in
// full green, practicando in green/55, the rest (new words) empty. The same
// grading as the Práctica mastery bars, so the two read as one language.

import type { PackStats } from "@/lib/vocab/store"

export function PackProgress({ stats, className }: { stats: PackStats; className?: string }) {
  const pct = (n: number) => (stats.total ? (n / stats.total) * 100 : 0)
  return (
    <div className={`flex h-[5px] overflow-hidden rounded-full bg-segment-empty ${className ?? ""}`} aria-hidden>
      <div className="h-full bg-green" style={{ width: `${pct(stats.sabidas)}%` }} />
      <div className="h-full bg-green/55" style={{ width: `${pct(stats.practicando)}%` }} />
    </div>
  )
}

/** The one-line status under a pack name: what to do next, not a score. */
export function packStatusLine(stats: PackStats): string {
  if (stats.total === 0) return "Vacío"
  if (stats.due > 0) return `${stats.due} para repasar`
  if (stats.sabidas + stats.practicando === 0) return "Sin empezar"
  if (stats.unseen > 0) return `${stats.unseen} ${stats.unseen === 1 ? "nueva" : "nuevas"}`
  return `${stats.sabidas} de ${stats.total} sabidas`
}
