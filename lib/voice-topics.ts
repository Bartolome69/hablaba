// What a voice conversation is ABOUT.
//
// Deliberately shared (main-app `lib/`, not `lib/criar/`): Grow's voice mode
// uses these today, and when voice comes to Speak it uses the same list rather
// than growing a divergent copy. Grow imports this by permission — see the
// boundary list in lib/criar/README.md.
//
// Topic choice is quietly also GRAMMAR TARGETING, which is the point: asking
// someone to reminisce forces past tenses, asking their opinion forces the
// subjunctive and conditional. `practises` records that intent using
// exercises-taxonomy topic ids (lib/exercises/taxonomy.json), so a future
// "your weak areas suggest this topic" nudge can read it — and so the weekly
// report can tell whether a structure was avoided in a conversation that was
// actively fishing for it.

export interface VoiceTopic {
  id: string
  /** Chip label, Spanish. */
  label: string
  emoji: string
  /** One line under the picker, Spanish. */
  blurb: string
  /** Injected into the partner's instructions as what to talk about. */
  prompt: string
  /**
   * Exercises-taxonomy topic ids this conversation naturally exercises.
   * Informational for now (see module note above); nothing branches on it yet.
   */
  practises: string[]
  /** Only offered where a child is in context (i.e. inside Grow). */
  requiresChild?: boolean
  /**
   * Roleplay only: replaces the partner's DEFAULT PERSONA with a character
   * for the scene. Everything else (register, corrections-by-recast, short
   * turns, patience with half-built sentences) stays in force. Chips for
   * these are labelled "Rol:" so slipping into a scene is always a choice —
   * never a surprise swap of the partner the user knows.
   */
  personaPrompt?: string
}

export const voiceTopics: VoiceTopic[] = [
  {
    id: "dia",
    label: "Mi día",
    emoji: "👶",
    blurb: "Cómo viene el día con el bebé",
    prompt:
      "Talk about the parent's day with their baby and how THEY are doing: routines, feeds, sleep, walks, little moments, how tired they are, what surprised them. Ask about the baby, but remember the parent is the person you are talking to — how they're holding up matters as much as what the baby did.",
    practises: ["present-perfect", "reflexive-verbs"],
    requiresChild: true,
  },
  {
    id: "charla",
    label: "Charla suelta",
    emoji: "☕",
    blurb: "Lo que se te cruce",
    prompt:
      "Open, everyday small talk — whatever the parent feels like. Their week, plans for the weekend, food, the weather, the neighbourhood, what they're watching or reading, how work is going. Follow whatever they show energy about rather than steering. The baby can come up naturally but is NOT the subject.",
    practises: ["ser-vs-estar", "future-tense"],
  },
  {
    id: "mandados",
    label: "Mandados",
    emoji: "🛒",
    blurb: "La vida práctica: kiosco, café, trámites",
    prompt:
      "Practical daily life in Buenos Aires: the kiosco, the verdulería, the café, the farmacia, the portero, a delivery that didn't arrive, a trámite that's driving them mad. Ask how they handled it and what they had to say. Stay yourself — do NOT roleplay as a shopkeeper unless they ask you to.",
    practises: ["por-vs-para", "direct-object-pronouns"],
  },
  {
    id: "recuerdos",
    label: "Recuerdos",
    emoji: "📸",
    blurb: "Contame algo que pasó",
    prompt:
      "Get the parent telling STORIES about the past: how they met their partner, a trip that went wrong, their own childhood, the day the baby was born, the best meal they've had. Ask for details that need narration — what happened next, what it was like, what they were thinking. This is deliberately past-tense practice, so keep pulling them into recounting rather than summarising.",
    practises: ["preterite-vs-imperfect", "preterite", "imperfect", "pluperfect"],
  },
  {
    id: "opiniones",
    label: "Opiniones",
    emoji: "💭",
    blurb: "Qué pensás de…",
    prompt:
      "Draw out the parent's OPINIONS and hypotheticals — light and warm, never an interrogation. What they'd change about their neighbourhood, whether they'd move back home, what they hope for the baby, what they'd do with a free weekend, whether they think something is worth it. Use openers that invite doubt and wishing ('¿te parece que…?', '¿qué harías si…?', '¿ojalá que…?'), which is deliberately subjunctive and conditional practice.",
    practises: ["present-subjunctive", "subjunctive-triggers", "conditional"],
  },
  {
    id: "sorpresa",
    label: "Sorpréndeme",
    emoji: "🎲",
    blurb: "Vos elegís el tema",
    prompt:
      "YOU pick the topic. Choose something specific and a bit unexpected that a parent in Buenos Aires would have something to say about — a neighbourhood argument, a food opinion, a small daily annoyance, a memory, a what-would-you-do. Commit to it: open with the topic already chosen rather than asking what they want to talk about.",
    practises: [],
  },
  {
    id: "rol-cafe",
    label: "Rol: café",
    emoji: "🎭",
    blurb: "Vos pedís, yo soy el mozo",
    prompt:
      "Run the café scene from start to finish: greet them, take the order, and keep the visit alive with realistic beats — a question about how they want the coffee, something that's run out (no hay medialunas today, offer an alternative), bringing the bill, taking payment. If they finish fast, extend naturally: recommend something, ask if they want anything else. Keep the customer talking.",
    practises: ["direct-object-pronouns", "conditional"],
    personaPrompt:
      "For this session you are ROLEPLAYING: you are a friendly porteño waiter (mozo) in a Buenos Aires café, and the learner is your customer. Stay in character for the whole scene.",
  },
  {
    id: "rol-verduleria",
    label: "Rol: verdulería",
    emoji: "🎭",
    blurb: "Comprá fruta y verdura",
    prompt:
      "Run the shop scene: greet them, ask what they need, weigh things, quote prices, suggest what's good today (está de estación), handle quantities (un kilo, medio kilo, una docena), give a total, take payment and say goodbye warmly. Push gently on quantities and prices so numbers get real practice. If they finish fast, tell them what's coming in nice next week.",
    practises: ["direct-object-pronouns", "comparatives"],
    personaPrompt:
      "For this session you are ROLEPLAYING: you are the chatty owner of a Buenos Aires verdulería, and the learner is a regular customer doing their shopping. Stay in character for the whole scene.",
  },
]


/**
 * The SUBJECT cards on the Charlar hub — "Intereses" and "Vida diaria" in
 * lib/data.ts. They predate voice mode and were never given a spoken prompt,
 * so getVoiceTopic couldn't resolve any of them and quietly fell back to
 * "dia": pick "Plan a Trip" and she'd ask about your day with the baby, while
 * the header showed the trip title above the baby blurb. Fourteen of the ~22
 * things you can tap were decorative in voice mode.
 *
 * They're kept in their own list rather than added to `voiceTopics` because
 * the hub already renders them from lib/data.ts — putting them in both would
 * show every one twice. This list exists so they RESOLVE, not so they're
 * offered again.
 *
 * `label` and `blurb` mirror lib/data.ts so the thread header names the
 * subject the parent actually chose.
 */
export const subjectVoiceTopics: VoiceTopic[] = [
  {
    id: "restaurant",
    label: "En el restaurante",
    emoji: "🍽️",
    blurb: "En el restaurante",
    prompt:
      "Talk about eating out: places they like, what they order, whether they still manage restaurants with a baby, takeaway nights, a meal that was worth it or a disaster. Follow whatever they actually order or remember.",
    practises: ["preterite-vs-imperfect", "gustar-verbs"],
  },
  {
    id: "travel",
    label: "Planifica un viaje",
    emoji: "✈️",
    blurb: "Planifica un viaje",
    prompt:
      "Plan or dream about a trip: where they'd go, what they'd need to organise, travelling with a small child, a trip they've already taken. Keep it practical and personal rather than a travel-guide monologue.",
    practises: ["future-tense", "conditional", "por-vs-para"],
  },
  {
    id: "family",
    label: "Familia y amigos",
    emoji: "👨‍👩‍👧",
    blurb: "Familia y amigos",
    prompt:
      "Talk about the people around them: family, close friends, who they see, who helps, who they miss, how relationships have shifted since the baby. Ask about the people, not just the logistics.",
    practises: ["present-perfect", "ser-vs-estar"],
  },
  {
    id: "work",
    label: "Trabajo y carrera",
    emoji: "💼",
    blurb: "Trabajo y carrera",
    prompt:
      "Talk about work: what they do, how the days are going, leave and going back, what they'd change, what they'd rather be doing. Follow their tone — this can be light or genuinely heavy.",
    practises: ["present-perfect", "conditional"],
  },
  {
    id: "weekend",
    label: "Planes del fin de semana",
    emoji: "🎉",
    blurb: "Planes del fin de semana",
    prompt:
      "Talk about the weekend just gone or the one coming: plans, who they'll see, what got cancelled, what a good weekend looks like now versus before. Keep it concrete.",
    practises: ["future-tense", "preterite-vs-imperfect"],
  },
  {
    id: "movies",
    label: "Películas y música",
    emoji: "🎬",
    blurb: "Películas y música",
    prompt:
      "Talk about films, series and music: what they're watching, what they gave up on, what they put on in the house, what they grew up with. Have opinions of your own and disagree warmly.",
    practises: ["gustar-verbs", "comparatives"],
  },
  {
    id: "food",
    label: "Comida y cocina",
    emoji: "🌮",
    blurb: "Comida y cocina",
    prompt:
      "Talk about cooking and eating at home: what they make, what they've stopped making, shortcuts, something they cook well, what they grew up eating. Ask for the actual method if they mention a dish.",
    practises: ["commands", "direct-object-pronouns"],
  },
  {
    id: "sports",
    label: "Deportes y ejercicio",
    emoji: "⚽",
    blurb: "Deportes y ejercicio",
    prompt:
      "Talk about sport and moving their body: what they follow, what they used to do, whether they've found any way back to it, walks that count as exercise. No lecturing about fitness.",
    practises: ["preterite-vs-imperfect", "reflexive-verbs"],
  },
  {
    id: "morning",
    label: "La mañana",
    emoji: "🌅",
    blurb: "¿Ya te duchaste?",
    prompt:
      "Talk about how the morning went: who woke first, whether they got to eat or shower, what the first hour looked like, how they feel about mornings now. Small and specific.",
    practises: ["reflexive-verbs", "present-perfect"],
  },
  {
    id: "dinner",
    label: "La cena",
    emoji: "🍳",
    blurb: "¿Qué hacemos de comer?",
    prompt:
      "Work out dinner together: what's in the fridge, what's quick, what everyone will actually eat, what they had last night. Make suggestions and react to theirs.",
    practises: ["commands", "direct-object-pronouns"],
  },
  {
    id: "shopping",
    label: "La compra",
    emoji: "🛒",
    blurb: "¿Qué nos falta?",
    prompt:
      "Go through what they need to buy: the list, what always runs out, where they shop, what they forgot last time. Practical back-and-forth, not a monologue.",
    practises: ["direct-object-pronouns", "commands"],
  },
  {
    id: "endofday",
    label: "El final del día",
    emoji: "😴",
    blurb: "¿Cómo estuvo tu día?",
    prompt:
      "Wind down together: how the day actually went, the best bit and the worst bit, what they're leaving until tomorrow, how tired they are. Gentle, unhurried, no fixing.",
    practises: ["preterite-vs-imperfect", "present-perfect"],
  },
  {
    id: "house",
    label: "La casa",
    emoji: "🏠",
    blurb: "¿Puedes limpiar esto?",
    prompt:
      "Talk about the house: what needs doing, what never gets done, how they split it, a job they've been avoiding, something they've fixed or want to change.",
    practises: ["commands", "haber-uses"],
  },
  {
    id: "coffee",
    label: "El café",
    emoji: "☕",
    blurb: "¿Quieres café?",
    prompt:
      "Easy coffee-in-hand chat: how they take it, how many today, where they go, whether they've had a hot one all week. Light and warm — this is the low-effort option.",
    practises: ["gustar-verbs", "ser-vs-estar"],
  },
]

export const DEFAULT_VOICE_TOPIC_ID = "dia"

/** Everything a conversation's starterId can legitimately be. */
const allVoiceTopics = [...voiceTopics, ...subjectVoiceTopics]

export function getVoiceTopic(id: string | undefined): VoiceTopic {
  return (
    allVoiceTopics.find((t) => t.id === id) ??
    voiceTopics.find((t) => t.id === DEFAULT_VOICE_TOPIC_ID) ??
    voiceTopics[0]
  )
}

/** Whether an id resolves at all — false means the fallback is being used. */
export function isKnownVoiceTopic(id: string | undefined): boolean {
  return !!id && allVoiceTopics.some((t) => t.id === id)
}
