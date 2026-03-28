import { Flame } from "lucide-react"

interface StreakBadgeProps {
  count: number
}

export function StreakBadge({ count }: StreakBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-full">
      <Flame className="w-4 h-4 text-accent" />
      <span className="text-sm font-semibold text-foreground">{count}</span>
    </div>
  )
}
