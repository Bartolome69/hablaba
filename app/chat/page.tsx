"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"
import { ChatHeader } from "@/components/chat/chat-header"
import { ChatBubble } from "@/components/chat/chat-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { useChat } from "@/hooks/use-chat"
import { suggestionChips, dailyPrompt } from "@/lib/data"
import type { PracticeMode } from "@/lib/types"

function ChatContent() {
  const searchParams = useSearchParams()
  const mode = (searchParams.get("mode") as PracticeMode) || "solo"

  const { messages, isLoading, sendMessage } = useChat({ mode })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <ChatHeader mode={mode} topic={dailyPrompt.english} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0">
        <ChatInput onSend={sendMessage} suggestions={suggestionChips} />
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <ChatContent />
    </Suspense>
  )
}
