"use client"

import { useState } from "react"
import { MessageCircle, ArrowRight, X } from "lucide-react"
import type { Session } from "@/lib/types"

interface ContinueSessionProps {
  session: Session
  onContinue: () => void
  onDelete: () => void
}

export function ContinueSession({ session, onContinue, onDelete }: ContinueSessionProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 1000 / 60)
    if (minutes < 60) return `${minutes} min ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`
  }

  if (confirmDelete) {
    return (
      <div className="w-full flex items-center justify-between gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl transition-all">
        <p className="text-sm text-foreground">Delete this conversation?</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmDelete(false)}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex items-center gap-3 p-4 bg-secondary/50 rounded-xl active:scale-[0.98] transition-all">
      <button
        className="flex-1 flex items-center gap-3 text-left min-w-0"
        onClick={onContinue}
      >
        <MessageCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
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
      <button
        onClick={() => setConfirmDelete(true)}
        className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
        aria-label="Close conversation"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
