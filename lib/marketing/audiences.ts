import type { FaqItem } from "@/components/marketing/faq"

export interface Audience {
  slug: string
  eyebrow: string
  headline: string
  subhead: string
  metaTitle: string
  metaDescription: string
  keyword: string
  features: { emoji: string; title: string; body: string }[]
  steps: { title: string; body: string }[]
  faq: FaqItem[]
}

export const audiences: Record<string, Audience> = {
  parents: {
    slug: "parents",
    eyebrow: "For parents",
    headline: "Speak Spanish with your little one — even if you're still learning.",
    subhead:
      "Hablaba gives you the exact phrases you need for nap time, snack time, tantrums and bedtime. Practice them out loud, get gentle corrections, and bring them home today.",
    metaTitle: "Spanish for parents — speak Spanish with your kids",
    metaDescription:
      "Hablaba helps parents raise bilingual kids. Practice the daily phrases that matter — bath time, meal time, bedtime — with an AI tutor that corrects you kindly.",
    keyword: "spanish for parents",
    features: [
      { emoji: "🍼", title: "Daily-life phrases", body: "Phrases for the moments that actually happen — diaper changes, dinner, the park, bedtime." },
      { emoji: "🎧", title: "Listen and repeat", body: "Hear native pronunciation, repeat out loud, and build muscle memory in five minutes a day." },
      { emoji: "💛", title: "Gentle corrections", body: "We won't shame your grammar. Hablaba nudges you forward, like a patient friend." },
    ],
    steps: [
      { title: "Pick a moment", body: "Bath time? Snack? Walking to nursery? Choose a routine you actually do every day." },
      { title: "Learn the phrases", body: "We give you the natural Spanish parents really say — not textbook lines." },
      { title: "Use them today", body: "Take the phrases home and try them tonight. Your kid won't judge you." },
    ],
    faq: [
      { q: "I only know a little Spanish. Is this for me?", a: "Yes. Hablaba is built for B1-ish learners — you can read a menu and survive a conversation, but you freeze with a toddler. We start where you are." },
      { q: "Does my child need to use it?", a: "No. Hablaba is for the parent. You learn the phrases, then bring them into your home naturally." },
      { q: "What dialect of Spanish?", a: "Neutral Latin American Spanish by default, with optional Castilian voices. You can switch anytime." },
    ],
  },
  toddlers: {
    slug: "toddlers",
    eyebrow: "For parents of toddlers",
    headline: "The Spanish phrases you actually need before bedtime.",
    subhead:
      "Tantrums, teeth-brushing, ‘one more story’ — Hablaba teaches you the words for the moments that fill your day, not the ones in textbooks.",
    metaTitle: "Spanish for toddlers — phrases parents actually use",
    metaDescription:
      "Bath time, bedtime, tantrums, snacks. Hablaba gives parents the real Spanish phrases for life with a toddler, plus gentle pronunciation practice.",
    keyword: "spanish for toddlers",
    features: [
      { emoji: "🛁", title: "Real toddler routines", body: "Phrases mapped to bath, meals, getting dressed, the park — built around your day." },
      { emoji: "🗣️", title: "Practice out loud", body: "Speak the phrase before you live it, so it actually comes out when you need it." },
      { emoji: "📈", title: "Build a streak", body: "Five minutes a day adds up. Hablaba tracks your streak so the habit sticks." },
    ],
    steps: [
      { title: "Choose a routine", body: "Bath time tonight? Pick it." },
      { title: "Hear and repeat", body: "Listen to the phrase, repeat it, get a kind correction." },
      { title: "Bring it home", body: "Use one new phrase tonight. Tomorrow, two." },
    ],
    faq: [
      { q: "My toddler doesn't speak Spanish — does this still work?", a: "Yes. The phrases are everyday parent-to-child Spanish. Even hearing them grows your child's ear." },
      { q: "How long per session?", a: "Around five minutes. Designed to fit between nap and pickup." },
    ],
  },
  "b1-learners": {
    slug: "b1-learners",
    eyebrow: "For B1 learners",
    headline: "You're past Duolingo. You need real conversation.",
    subhead:
      "Hablaba is the conversation partner for learners stuck at B1. Talk about anything, get corrections in context, and finally feel confident in real Spanish.",
    metaTitle: "B1 Spanish practice — conversation with an AI tutor",
    metaDescription:
      "Stuck at B1? Hablaba is an AI Spanish tutor that holds real conversations, corrects your grammar in context, and explains why — so you finally break through.",
    keyword: "b1 spanish practice",
    features: [
      { emoji: "💬", title: "Real conversation", body: "Talk about your week, your job, your weekend. The AI keeps up and pushes you." },
      { emoji: "🩹", title: "Grammar in context", body: "Get corrections inline — with the why, not just the fix." },
      { emoji: "🔁", title: "Spaced repetition", body: "Phrases you stumble on come back tomorrow, until they stop tripping you up." },
    ],
    steps: [
      { title: "Pick a topic", body: "Something you care about — your job, your hobby, last weekend." },
      { title: "Just talk", body: "Type or speak. The AI responds in Spanish at your level." },
      { title: "Review corrections", body: "After the chat, review what you got wrong and why." },
    ],
    faq: [
      { q: "How is this different from ChatGPT?", a: "Hablaba is tuned for B1 specifically — corrections are scoped to your level, and the tutor never overloads you with vocabulary you don't have yet." },
      { q: "Can I speak, not just type?", a: "Yes — voice in and out, with native-quality TTS." },
    ],
  },
  travelers: {
    slug: "travelers",
    eyebrow: "For travelers",
    headline: "Real Spanish for your trip — not phrasebook Spanish.",
    subhead:
      "Headed to Mexico, Spain or Argentina? Hablaba teaches you the phrases that actually come up — ordering, asking for directions, small talk with your host — and corrects you kindly along the way.",
    metaTitle: "Spanish for travel — phrases you'll actually use",
    metaDescription:
      "Travel-ready Spanish for Mexico, Spain, Argentina and beyond. Hablaba teaches you the phrases that come up at the border, the bar and the taxi, with gentle corrections.",
    keyword: "spanish for travel",
    features: [
      { emoji: "✈️", title: "Trip-shaped lessons", body: "Phrases mapped to airports, restaurants, taxis, hotels — the real flow of a trip." },
      { emoji: "🌎", title: "Region-aware", body: "Choose Mexico, Spain or Latin America. We adjust slang and pronunciation." },
      { emoji: "⏱️", title: "Five minutes a day", body: "Two weeks before your flight is enough to feel the difference." },
    ],
    steps: [
      { title: "Pick your destination", body: "Mexico? Spain? Argentina? Each has its own phrases." },
      { title: "Run the routines", body: "Order food, ask for the bill, find the bus, make a friend." },
      { title: "Land prepared", body: "You'll surprise yourself in the first taxi." },
    ],
    faq: [
      { q: "I leave in a week. Is it too late?", a: "No. Even a few sessions will help with the basics — ordering, directions, polite chat." },
      { q: "Do you cover Spain and Latin America?", a: "Yes — pick your region and we adjust accent and vocabulary." },
    ],
  },
  expats: {
    slug: "expats",
    eyebrow: "For expats",
    headline: "Move to a Spanish-speaking country with the language you actually need.",
    subhead:
      "Renting a flat, talking to the doctor, ordering groceries, making friends. Hablaba teaches you the real-life Spanish that gets you settled — fast.",
    metaTitle: "Spanish for expats — settle into life in Spanish",
    metaDescription:
      "Moving to Spain, Mexico or Latin America? Hablaba teaches expats the practical Spanish for housing, healthcare, banking and friendships. Real life, real conversations.",
    keyword: "spanish for expats",
    features: [
      { emoji: "🏠", title: "Practical scenarios", body: "Renting, banking, doctor visits, paperwork — the conversations you'll actually have." },
      { emoji: "🤝", title: "Friendship Spanish", body: "Move past transactions. Practice small talk, jokes, plans." },
      { emoji: "🇪🇸", title: "Pick your country", body: "Spain, Mexico, Argentina, Colombia — each has its own version of right." },
    ],
    steps: [
      { title: "Tell us where you live", body: "We tailor the Spanish to your country and city." },
      { title: "Run the scenarios", body: "Practice the conversations coming up this week." },
      { title: "Live in Spanish", body: "Replace the English fallback, one routine at a time." },
    ],
    faq: [
      { q: "I'm already at intermediate. Will I be bored?", a: "No — Hablaba meets you where you are and pushes you. Most expats plateau at B1; we help break through." },
      { q: "Can I practice for a specific situation?", a: "Yes. Tell the AI what's coming up — a doctor's visit, a viewing, a dinner — and run it as a scenario." },
    ],
  },
  "beginners-with-kids": {
    slug: "beginners-with-kids",
    eyebrow: "For new parents",
    headline: "You don't speak Spanish. Your partner does. Catch up — kindly.",
    subhead:
      "Hablaba is built for parents starting from zero with a bilingual partner. Learn the phrases your kid will actually hear, without judgement, in five minutes a day.",
    metaTitle: "Learn Spanish as a parent — start from zero",
    metaDescription:
      "New parent learning Spanish from zero so you can join your bilingual family? Hablaba teaches you daily phrases — kindly, slowly, and at the moments that matter.",
    keyword: "learn spanish as a parent",
    features: [
      { emoji: "🌱", title: "Built for beginners", body: "We start at the start. No grammar drills, no shame, no flashcards." },
      { emoji: "👨‍👩‍👧", title: "Family-shaped", body: "Phrases your partner already says — so what your kid hears at home becomes what you say too." },
      { emoji: "🕯️", title: "Calm pacing", body: "Five minutes a day, ideally while the kid naps. Promise." },
    ],
    steps: [
      { title: "Start with a hello", body: "We begin with the phrases you'll use in the next 24 hours." },
      { title: "Repeat them out loud", body: "Hearing yourself say it is the only way it sticks." },
      { title: "Use one tonight", body: "Say good night in Spanish. That's it. That's the win." },
    ],
    faq: [
      { q: "I literally know zero Spanish. Is this for me?", a: "Yes. We're built for the parent starting at zero who wants to catch up to their partner — kindly." },
      { q: "Will I overwhelm my kid by mixing languages?", a: "No. Hearing two languages from two parents is a well-studied path to bilingualism. Your kid will be fine." },
    ],
  },
}

export const audienceSlugs = Object.keys(audiences)
