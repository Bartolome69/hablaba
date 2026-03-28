import type { Message, SavedPhrase, DailyPrompt, Session, UserProfile } from "./types"

export const mockUser: UserProfile = {
  id: "1",
  name: "You",
  streak: 7,
  savedPhraseCount: 12,
}

export const dailyPrompt: DailyPrompt = {
  id: "1",
  spanish: "Planifica tus vacaciones soñadas",
  english: "Plan your dream holiday",
  date: new Date().toISOString().split("T")[0],
}

export const savedPhrases: SavedPhrase[] = [
  {
    id: "1",
    spanish: "¿Qué te parece?",
    english: "What do you think?",
    savedAt: new Date(),
  },
  {
    id: "2",
    spanish: "Me encantaría",
    english: "I would love to",
    savedAt: new Date(),
  },
]

export const lastSession: Session = {
  id: "1",
  mode: "solo",
  topic: "Ordering food",
  messageCount: 3,
  lastMessageAt: new Date(Date.now() - 1000 * 60 * 30),
}

export const sampleMessages: Message[] = [
  {
    id: "1",
    type: "bot",
    text: "¡Hola! Hoy vamos a planificar unas vacaciones juntos. ¿A dónde te gustaría ir?",
    timestamp: new Date(),
    translation: "Hi! Today we're going to plan a vacation together. Where would you like to go?",
  },
  {
    id: "2",
    type: "user",
    text: "Yo quiero ir a la playa en España",
    timestamp: new Date(),
    correction: {
      original: "Yo quiero ir a la playa en España",
      corrected: "Me gustaría ir a una playa en España",
      explanation: "Using 'me gustaría' sounds more natural for expressing wishes",
    },
  },
  {
    id: "3",
    type: "bot",
    text: "¡Qué buena idea! España tiene playas increíbles. ¿Has pensado en alguna zona en particular? Por ejemplo, la Costa Brava, las Islas Canarias, o quizás Andalucía.",
    timestamp: new Date(),
    translation: "What a great idea! Spain has incredible beaches. Have you thought about any particular area? For example, Costa Brava, the Canary Islands, or maybe Andalusia.",
  },
  {
    id: "4",
    type: "user",
    text: "Me gusta mucho las Islas Canarias porque el clima es muy bueno",
    timestamp: new Date(),
    correction: {
      original: "Me gusta mucho las Islas Canarias",
      corrected: "Me gustan mucho las Islas Canarias",
      explanation: "'Islas' is plural, so use 'gustan' instead of 'gusta'",
    },
  },
  {
    id: "5",
    type: "bot",
    text: "¡Excelente elección! Las Canarias tienen un clima estupendo todo el año. ¿Preferirías Tenerife, Gran Canaria, o alguna isla más tranquila como La Palma?",
    timestamp: new Date(),
    translation: "Excellent choice! The Canaries have wonderful weather all year round. Would you prefer Tenerife, Gran Canaria, or a quieter island like La Palma?",
  },
]

export const suggestionChips = [
  "¿Cuántos días deberíamos quedarnos?",
  "¿Qué actividades hay?",
  "¿Cuánto cuesta?",
]
