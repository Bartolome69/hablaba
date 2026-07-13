import Link from "next/link"
import { ChevronLeft, Volume2, VolumeX } from "lucide-react"
import type { PracticeMode } from "@/lib/types"

interface ChatHeaderProps {
  mode: PracticeMode
  topic: string
  muted: boolean
  onToggleMute: () => void
}

export function ChatHeader({ mode: _mode, topic, muted, onToggleMute }: ChatHeaderProps) {
  return (
    <header className="flex-shrink-0 bg-background border-b border-border">
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-3">
        <Link
          href="/app/practice"
          aria-label="Back"
          className="flex items-center justify-center w-9 h-9 -ml-1.5 text-muted-foreground active:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="text-center">
          <p className="font-serif text-sm text-foreground">
            {topic}
          </p>
        </div>
        <button
          onClick={onToggleMute}
          aria-label={muted ? "Turn voice on" : "Mute voice"}
          aria-pressed={muted}
          className="flex items-center justify-center w-9 h-9 -mr-1.5 text-muted-foreground active:opacity-70 transition-opacity"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
