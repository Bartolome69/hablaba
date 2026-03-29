import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { PracticeMode } from "@/lib/types"

interface ChatHeaderProps {
  mode: PracticeMode
  topic: string
}

export function ChatHeader({ mode, topic }: ChatHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <Link
          href="/practice"
          className="flex items-center gap-1 text-muted-foreground active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {mode === "solo" ? "Solo Practice" : "Together"}
          </p>
          <p className="text-xs text-muted-foreground">{topic}</p>
        </div>
        <div className="w-16" />
      </div>
    </header>
  )
}
