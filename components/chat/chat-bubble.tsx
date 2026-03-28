"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, ChevronDown, Languages } from "lucide-react"
import type { Message } from "@/lib/types"

interface ChatBubbleProps {
  message: Message
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const [showCorrection, setShowCorrection] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const isUser = message.type === "user"
  const isBot = message.type === "bot"

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
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`mt-1 p-1.5 rounded-full transition-colors ${
              showTranslation
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            aria-label="Translate"
          >
            <Languages className="w-4 h-4" />
          </button>
        )}
      </div>

      {message.correction && (
        <>
          <div className={`flex ${isUser ? "justify-end" : "justify-start"} mt-1.5`}>
            <button
              onClick={() => setShowCorrection(!showCorrection)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <span>See improvement</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showCorrection ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showCorrection && (
            <div className={`flex ${isUser ? "justify-end" : "justify-start"} mt-2`}>
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
                  </div>
                  {message.correction.explanation && (
                    <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                      {message.correction.explanation}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                  <Bookmark className="w-3 h-3 mr-1" />
                  Save phrase
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
