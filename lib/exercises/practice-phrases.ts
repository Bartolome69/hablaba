// The bridge from a finished quiz into the speaking loop. Some topics carry a
// small set of conversation-ready phrases; on the results screen the learner
// can save them into the phrase library (state "nueva"). From there the
// existing machinery takes over: getConversationSeedPhrases feeds them into
// the next charla as "this week's material", the partner weaves them in, and
// a target_phrase_used observation moves them to "usada" when they're really
// said. Drilling proves recognition; this is how a topic becomes production.
//
// Phrases are first-person things a parent would actually say about their own
// day, so they fit any conversation the seeding drops them into.

export interface PracticePhrase {
  text: string
  translation: string
}

export const PRACTICE_PHRASES: Record<string, PracticePhrase[]> = {
  "key-verbs": [
    {
      text: "Quiero aprovechar la siesta para descansar un rato.",
      translation: "I want to make the most of nap time to rest a bit.",
    },
    {
      text: "Tengo que averiguar a qué hora abre la guardería.",
      translation: "I have to find out what time the nursery opens.",
    },
    {
      text: "Hoy no me alcanzó el tiempo para nada.",
      translation: "Today I didn't have time for anything.",
    },
    {
      text: "Por fin superamos las noches sin dormir.",
      translation: "We finally got past the sleepless nights.",
    },
    {
      text: "Todavía no sé cómo enfrentar los berrinches.",
      translation: "I still don't know how to deal with the tantrums.",
    },
    {
      text: "No alcancé a sacarle una foto.",
      translation: "I didn't manage to get a photo of him in time.",
    },
  ],
}

/** The saveable phrases for a quiz spanning these topics (deduped, in order). */
export function practicePhrasesForTopics(topicIds: string[]): PracticePhrase[] {
  const seen = new Set<string>()
  const out: PracticePhrase[] = []
  for (const id of topicIds) {
    for (const p of PRACTICE_PHRASES[id] ?? []) {
      if (seen.has(p.text)) continue
      seen.add(p.text)
      out.push(p)
    }
  }
  return out
}
