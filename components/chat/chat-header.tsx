import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { PracticeMode } from "@/lib/types"

interface ChatHeaderProps {
  mode: PracticeMode
  topic: string
}

export function ChatHeader({ mode, topic }: ChatHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-background border-b border-border">
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3">
        <Link
          href="/practice"
          className="flex items-center gap-1 text-muted-foreground active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </Link>
        <div className="text-center">
          <p className="font-serif text-sm text-foreground">
            {topic}
          </p>
        </div>
        <div />
      </div>
    </header>
  )
}
