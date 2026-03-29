"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, ChevronDown, Languages, Volume2, Loader2 } from "lucide-react"
import type { Message } from "@/lib/types"

interface ChatBubbleProps {
  message: Message
  isPlaying?: boolean
  onPlayRequest?: () => void
  onSavePhrase?: (spanish: string, english: string) => void
}

export function ChatBubble({ message, isPlaying = false, onPlayRequest, onSavePhrase }: ChatBubbleProps) {
  const [showCorrection, setShowCorrection] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [saved, setSaved] = useState(false)
  const isUser = message.type === "user"
  const isBot = message.type === "bot"

  const handleSave = () => {
    if (!message.correction) return
    const spanish = message.correction.corrected
    const english = message.correction.corrected_translation ?? message.correction.explanation ?? ""
    onSavePhrase?.(spanish, english)
    setSaved(true)
  }

  return (
    <div>
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          }`}
        >
          <p className="text-sm leading-relaxed">{message.text}</p>
          {showTranslation && message.translation && (
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50 italic">
              {message.translation}
            </p>
          )}
        </div>
        {isBot && (
          <div className="flex flex-col gap-1 ml-1">
            <button
              onClick={onPlayRequest}
              disabled={isPlaying}
              className="p-1.5 rounded-full transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50"
              aria-label="Play audio"
            >
              {isPlaying
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Volume2 className="w-4 h-4" />
              }
            </button>
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`p-1.5 rounded-full transition-colors ${
                showTranslation
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              aria-label="Translate"
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isUser && message.correction && (
        <>
          <div className="flex justify-end mt-1.5">
            {(() => {
              const hasImprovement = message.correction.original.trim().toLowerCase() !== message.correction.corrected.trim().toLowerCase()
              return (
                <button
                  onClick={() => setShowCorrection(!showCorrection)}
                  className={`flex items-center gap-1 text-xs hover:underline ${hasImprovement ? "text-red-500" : "text-green-600"}`}
                >
                  <span>{hasImprovement ? "See improvement" : "Native tip"}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showCorrection ? "rotate-180" : ""}`} />
                </button>
              )
            })()}
          </div>

          {showCorrection && (
            <div className="flex justify-end mt-2">
              <div className="max-w-[85%] bg-primary/5 border border-primary/20 rounded-xl p-3">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">You said:</p>
                    <p className="text-sm text-foreground line-through opacity-60">
                      {message.correction.original}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">More natural:</p>
                    <p className="text-sm text-primary font-medium">
                      {message.correction.corrected}
                    </p>
                    {message.correction.corrected_translation && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">
                        {message.correction.corrected_translation}
                      </p>
                    )}
                  </div>
                  {message.correction.explanation && (
                    <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                      {message.correction.explanation}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs" onClick={handleSave} disabled={saved}>
                  <Bookmark className={`w-3 h-3 mr-1 ${saved ? "fill-current" : ""}`} />
                  {saved ? "Saved!" : "Save phrase"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
