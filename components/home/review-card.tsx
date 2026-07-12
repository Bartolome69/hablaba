"use client"

import { useRouter } from "next/navigation"
import { GraduationCap, ChevronRight } from "lucide-react"

interface ReviewCardProps {
  count: number
}

export function ReviewCard({ count }: ReviewCardProps) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push("/app/review")}
      className="w-full flex items-center gap-3 p-4 bg-card border border-border rounded-2xl text-left hover:bg-secondary/50 active:scale-[0.98] transition-all"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <GraduationCap className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Review phrases</p>
        <p className="text-xs text-muted-foreground">
          Practise the {count} {count === 1 ? "phrase" : "phrases"} you&apos;ve saved
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  )
}
