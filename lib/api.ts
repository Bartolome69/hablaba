import type { Correction } from "./types"

// --- Shared history message shape (mirrors OpenAI roles) ---

export interface HistoryMessage {
  role: "user" | "assistant"
  content: string
}

// --- /api/chat ---

export interface ChatApiRequest {
  message: string
  history: HistoryMessage[]
}

export interface ChatApiResponse {
  reply: string
  translation?: string | null
  correction?: Correction | null
}

export async function sendChatMessage(req: ChatApiRequest): Promise<ChatApiResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`)
  }

  return res.json()
}

// --- /api/feedback (stub — wired up later) ---

export interface FeedbackRequest {
  messageId: string
  correctedText: string
}

export interface FeedbackResponse {
  saved: boolean
}

export async function submitFeedback(_req: FeedbackRequest): Promise<FeedbackResponse> {
  // TODO: POST /api/feedback
  throw new Error("Not implemented")
}
