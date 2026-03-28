export type PracticeMode = "solo" | "together"

export interface UserProfile {
  id: string
  name: string
  streak: number
  savedPhraseCount: number
}

export interface Message {
  id: string
  type: "user" | "bot"
  text: string
  timestamp: Date
  correction?: Correction
  translation?: string
}

export interface Correction {
  original: string
  corrected: string
  explanation?: string
}

export interface SavedPhrase {
  id: string
  spanish: string
  english: string
  savedAt: Date
}

export interface DailyPrompt {
  id: string
  spanish: string
  english: string
  date: string
}

export interface Session {
  id: string
  mode: PracticeMode
  topic: string
  messageCount: number
  lastMessageAt: Date
}
