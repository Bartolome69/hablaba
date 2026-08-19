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

export const DEFAULT_VOICE_TOPIC_ID = "dia"

export function getVoiceTopic(id: string | undefined): VoiceTopic {
  return (
    voiceTopics.find((t) => t.id === id) ??
    voiceTopics.find((t) => t.id === DEFAULT_VOICE_TOPIC_ID) ??
    voiceTopics[0]
  )
}
