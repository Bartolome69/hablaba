import { Card, CardContent } from "@/components/ui/card"
import { User, Users } from "lucide-react"
import type { PracticeMode } from "@/lib/types"

interface PracticeModeCardProps {
  mode: PracticeMode
  onClick: () => void
}

export function PracticeModeCard({ mode, onClick }: PracticeModeCardProps) {
  const config = {
    solo: {
      title: "Solo",
      description: "Practice on your own",
      icon: User,
      className: "bg-primary text-primary-foreground",
      iconBg: "bg-primary-foreground/20",
    },
    together: {
      title: "Together",
      description: "With your partner",
      icon: Users,
      className: "bg-accent text-accent-foreground",
      iconBg: "bg-accent-foreground/10",
    },
  }

  const { title, description, icon: Icon, className, iconBg } = config[mode]

  return (
    <Card
      className={`${className} cursor-pointer hover:opacity-95 active:scale-[0.98] transition-all h-36`}
      onClick={onClick}
    >
      <CardContent className="p-4 h-full flex flex-col justify-between">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-0.5">{title}</h3>
          <p className="text-xs opacity-80">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
