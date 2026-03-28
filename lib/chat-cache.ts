import type { Message } from "@/lib/types"

const key = (sessionId: string) => `hablaba_chat_${sessionId}`

export function saveChatMessages(sessionId: string, messages: Message[]) {
  try {
    localStorage.setItem(key(sessionId), JSON.stringify(messages))
  } catch {}
}

export function loadChatMessages(sessionId: string): Message[] | null {
  try {
    const stored = localStorage.getItem(key(sessionId))
    if (!stored) return null
    const parsed = JSON.parse(stored) as (Omit<Message, "timestamp"> & { timestamp: string })[]
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return null
  }
}
