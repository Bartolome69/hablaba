"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

interface ChatInputProps {
  onSend: (message: string) => void
  suggestions?: string[]
}

export function ChatInput({ onSend, suggestions = [] }: ChatInputProps) {
  const [value, setValue] = useState("")

  const handleSubmit = () => {
    if (value.trim()) {
      onSend(value.trim())
      setValue("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="bg-background border-t border-border">
      {suggestions.length > 0 && (
        <div className="px-4 py-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="flex-shrink-0 text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full hover:bg-secondary/80 active:bg-secondary/70 transition-colors"
                onClick={() => setValue(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 pb-safe">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe en español..."
            className="flex-1 bg-secondary rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
          />
          <Button
            size="icon"
            className="rounded-full flex-shrink-0 h-10 w-10"
            onClick={handleSubmit}
            disabled={!value.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
