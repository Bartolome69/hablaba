import { MessageCircle, ArrowRight } from "lucide-react"
import type { Session } from "@/lib/types"

interface ContinueSessionProps {
  session: Session
  onContinue: () => void
}

export function ContinueSession({ session, onContinue }: ContinueSessionProps) {
  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`
  }

  return (
    <button
      className="w-full flex items-center gap-3 p-4 bg-secondary/50 rounded-xl text-left active:bg-secondary/70 transition-colors"
      onClick={onContinue}
    >
      <MessageCircle className="w-5 h-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          Continue: {session.topic}
        </p>
        <p className="text-xs text-muted-foreground">
          {session.messageCount} messages, {getTimeAgo(session.lastMessageAt)}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  )
}
