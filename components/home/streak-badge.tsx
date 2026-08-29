import { DuoIcon } from "@/components/icons"

interface StreakBadgeProps {
  count: number
}

// The streak is one of the few sanctioned terracotta moments — a quiet pill,
// never a demand. Hidden entirely at zero: no guilt for missed days.
export function StreakBadge({ count }: StreakBadgeProps) {
  if (count === 0) return null

  return (
    <div
      className="flex h-[38px] items-center gap-1.5 rounded-full bg-terracotta-tint pl-[11px] pr-3.5"
      style={{ boxShadow: "0 2px 0 #E3C9B1" }}
    >
      <DuoIcon name="racha" size={17} className="text-ink" />
      <span className="text-sm font-semibold text-terracotta-ink">{count}</span>
    </div>
  )
}
