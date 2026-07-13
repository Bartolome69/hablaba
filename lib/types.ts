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
  // True while the bot reply is still streaming in — drives the typed-out reveal.
  streaming?: boolean
}

export interface Correction {
  original: string
  corrected: string
  corrected_translation?: string
  explanation?: string
}

export interface SavedPhrase {
  id: string
  spanish: string
  english: string
  savedAt: Date
  source?: "correction" | "bot" | "user"
  timesPracticed?: number
  lastPracticedAt?: string // ISO string
  box?: number // reserved for future spaced-repetition scheduling
}

export type PracticeResult = "again" | "got_it"

export interface DailyPrompt {
  id: string
  spanish: string
  english: string
  date: string
}

export interface ConversationTopic {
  id: string
  emoji: string
  title: string
  spanish: string
}

export interface StoredSession {
  id: string
  topicId: string
  topicTitle: string
  topicEmoji: string
  messageCount: number
  lastMessageAt: string // ISO string
}

export interface Session {
  id: string
  mode: PracticeMode
  topic: string
  messageCount: number
  lastMessageAt: Date
}
