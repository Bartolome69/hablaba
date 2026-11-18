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
    headline: "Speak Spanish with your little one, even if you're still learning.",
    subhead:
      "Hablaba gives you the exact phrases you need for nap time, snack time, tantrums and bedtime. Practice them out loud, get gentle corrections, and bring them home today.",
    metaTitle: "Spanish for parents: speak it with your kids",
    metaDescription:
      "Hablaba helps parents raise bilingual kids. Practice the daily phrases that matter, from bath time to bedtime, with a tutor that corrects you kindly.",
    keyword: "spanish for parents",
    features: [
      { emoji: "🍼", title: "Daily-life phrases", body: "Phrases for the moments that actually happen: diaper changes, dinner, the park, bedtime." },
      { emoji: "🎧", title: "Listen and repeat", body: "Hear native pronunciation, repeat out loud, and build muscle memory in five minutes a day." },
      { emoji: "💛", title: "Gentle corrections", body: "We won't shame your grammar. Hablaba nudges you forward, like a patient friend." },
    ],
    steps: [
      { title: "Pick a moment", body: "Bath time? Snack? Walking to nursery? Choose a routine you actually do every day." },
      { title: "Learn the phrases", body: "We give you the natural Spanish parents really say, not textbook lines." },
      { title: "Use them today", body: "Take the phrases home and try them tonight. Your kid won't judge you." },
    ],
    faq: [
      { q: "I only know a little Spanish. Is this for me?", a: "Yes. Hablaba is built for B1-ish learners: you can read a menu and survive a conversation, but you freeze with a toddler. We start where you are." },
      { q: "Does my child need to use it?", a: "No. Hablaba is for the parent. You learn the phrases, then bring them into your home naturally." },
      { q: "What dialect of Spanish?", a: "Rioplatense by default (Argentine vocabulary and a porteño accent) or neutral Latin American if you prefer, switchable in settings. Grammar is tú either way, never vosotros." },
    ],
  },
  toddlers: {
    slug: "toddlers",
    eyebrow: "For parents of toddlers",
    headline: "The Spanish phrases you actually need before bedtime.",
    subhead:
      "Tantrums, teeth-brushing, one more story. Hablaba teaches you the words for the moments that fill your day, not the ones in textbooks.",
    metaTitle: "Spanish for toddlers: phrases parents actually use",
    metaDescription:
      "Bath time, bedtime, tantrums, snacks. Hablaba gives parents the real Spanish phrases for life with a toddler, plus gentle pronunciation practice.",
    keyword: "spanish for toddlers",
    features: [
      { emoji: "🛁", title: "Real toddler routines", body: "Phrases mapped to bath, meals, getting dressed and the park, built around your day." },
      { emoji: "🗣️", title: "Practice out loud", body: "Speak the phrase before you live it, so it actually comes out when you need it." },
      { emoji: "📈", title: "Build a streak", body: "Five minutes a day adds up. Hablaba tracks your streak so the habit sticks." },
    ],
    steps: [
      { title: "Choose a routine", body: "Bath time tonight? Pick it." },
      { title: "Hear and repeat", body: "Listen to the phrase, repeat it, get a kind correction." },
      { title: "Bring it home", body: "Use one new phrase tonight. Tomorrow, two." },
    ],
    faq: [
      { q: "My toddler doesn't speak Spanish. Does this still work?", a: "Yes. The phrases are everyday parent-to-child Spanish. Even hearing them grows your child's ear." },
      { q: "How long per session?", a: "Around five minutes. Designed to fit between nap and pickup." },
    ],
  },
  "b1-learners": {
    slug: "b1-learners",
    eyebrow: "For parents at B1",
    headline: "Your Spanish got you to bedtime. Now take it further.",
    subhead:
      "You know the nursery phrases. Hablaba is where your own Spanish grows past them: real conversations about your day, gentle corrections, and grammar practice built from what you actually said, so you can talk with the abuela, the pediatrician and the other parents at the park.",
    metaTitle: "B1 Spanish practice for parents raising bilingual kids",
    metaDescription:
      "Stuck at B1 while raising a bilingual child? Hablaba holds real conversations with you, corrects your grammar in context, and turns your mistakes into short practice.",
    keyword: "b1 spanish practice",
    features: [
      { emoji: "💬", title: "Real conversation", body: "Talk about your week, your work, your kid. Type at the table or go hands-free on the walk to nursery." },
      { emoji: "🩹", title: "Grammar in context", body: "Corrections on what you actually said, with the why as well as the fix." },
      { emoji: "🔁", title: "Practice the exact gap", body: "Every slip you make links to a short quiz on that one rule, and the rule comes back in your next conversation." },
    ],
    steps: [
      { title: "Talk about your day", body: "The nap that didn't happen, the dinner that did. She keeps up and asks more." },
      { title: "Get your patterns back", body: "After the chat, see what you fumbled and what you nailed." },
      { title: "Close the gap", body: "Practise the one rule that tripped you, then use it with your kid tonight." },
    ],
    faq: [
      { q: "Is this only for talking to my child?", a: "No. The phrases for bath time and bedtime are one part. The rest is your own Spanish: conversation, grammar and vocabulary, so you keep growing alongside your kid." },
      { q: "How is this different from ChatGPT?", a: "Hablaba is tuned for B1. Corrections are scoped to your level, nothing gets flagged for a missing accent on a phone keyboard, and every mistake links to practice for that exact rule." },
      { q: "Can I speak, not just type?", a: "Yes. Voice conversations run hands-free, and the review comes after so she never interrupts you mid-sentence." },
    ],
  },
  "beginners-with-kids": {
    slug: "beginners-with-kids",
    eyebrow: "For new parents",
    headline: "You don't speak Spanish. Your partner does. Hablaba helps you catch up, kindly.",
    subhead:
      "Hablaba is built for parents starting from zero with a bilingual partner. Learn the phrases your kid will actually hear, without judgement, in five minutes a day.",
    metaTitle: "Learn Spanish as a parent, starting from zero",
    metaDescription:
      "New parent learning Spanish from zero so you can join your bilingual family? Hablaba teaches you daily phrases kindly, slowly, and at the moments they come up.",
    keyword: "learn spanish as a parent",
    features: [
      { emoji: "🌱", title: "Built for beginners", body: "We start at the start: short phrases you can use today, no shame, no homework." },
      { emoji: "👨‍👩‍👧", title: "Family-shaped", body: "Phrases your partner already says, so what your kid hears at home becomes what you say too." },
      { emoji: "🕯️", title: "Calm pacing", body: "Five minutes a day, ideally while the kid naps. Promise." },
    ],
    steps: [
      { title: "Start with a hello", body: "We begin with the phrases you'll use in the next 24 hours." },
      { title: "Repeat them out loud", body: "Hearing yourself say it is the only way it sticks." },
      { title: "Use one tonight", body: "Say good night in Spanish. That's it. That's the win." },
    ],
    faq: [
      { q: "I literally know zero Spanish. Is this for me?", a: "Yes. We're built for the parent starting at zero who wants to catch up to their partner, kindly." },
      { q: "Will I overwhelm my kid by mixing languages?", a: "No. Hearing two languages from two parents is a well-studied path to bilingualism. Your kid will be fine." },
    ],
  },
}

export const audienceSlugs = Object.keys(audiences)
