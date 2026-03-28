import { StreakBadge } from "@/components/home/streak-badge"
import type { UserProfile } from "@/lib/types"

interface AppHeaderProps {
  user: UserProfile
}

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Hablaba
        </h1>
        <p className="text-sm text-muted-foreground">Practice makes perfect</p>
      </div>
      <StreakBadge count={user.streak} />
    </header>
  )
}
