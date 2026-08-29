// SEO copy for the /frases/[routine] pages — one entry per routine in
// lib/routines.ts. The phrases themselves come from the routine; this file
// carries the search-facing framing: titles, intros, and the one practical
// tip that makes each page worth landing on.
//
// Voice notes: written like a parent talking to another parent. No em dashes,
// no "not X, it's Y" reversals, no mic-drop fragments. Warm and plain.

export interface PhrasePageCopy {
  /** H1. */
  title: string
  metaTitle: string
  metaDescription: string
  /** 2–3 sentences of parent-voiced intro above the phrase list. */
  intro: string
  /** One practical tip, shown after the list. */
  tip: string
}

export const phrasePages: Record<string, PhrasePageCopy> = {
  diaper: {
    title: "Spanish phrases for nappy changes",
    metaTitle: "Spanish phrases for nappy changes",
    metaDescription:
      "Simple, warm Spanish for the changing table, with English translations. For parents raising a bilingual baby one routine at a time.",
    intro:
      "The changing table is the easiest place to start speaking Spanish with your baby. You're there several times a day, you're face to face, and nobody is judging your grammar. Narrate what you're doing with the same handful of phrases each time, because repetition is exactly what a baby's brain wants.",
    tip: "Pick just two of these and say them at every single change for a week. When they come out without thinking, add the next two.",
  },
  feeding: {
    title: "Spanish phrases for feeding your baby",
    metaTitle: "Spanish phrases for feeding time",
    metaDescription:
      "Warm, natural Spanish for bottles and mealtimes, with English translations. The phrases bilingual parents really use, not textbook lines.",
    intro:
      "Mealtimes are full of natural repetition. Every spoonful is another chance to say the same warm phrase, which is why feeding vocabulary sticks faster than almost anything else you'll learn.",
    tip: "«Abre la boquita» and «qué rico» will carry you through the first month. The -ita and -ito endings aren't baby talk gone wrong. Spanish-speaking parents genuinely talk this way.",
  },
  bath: {
    title: "Spanish phrases for bath time",
    metaTitle: "Spanish phrases for bath time",
    metaDescription:
      "From «¿vamos a la bañera?» to «ya estás limpito»: the Spanish phrases for bathing your little one, with English translations for learning parents.",
    intro:
      "Bath time follows the same script every night: water on, clothes off, wash, splash, out, towel. That fixed script makes it perfect for Spanish. Say the same phrases at the same moments and within weeks they'll be part of the routine for both of you.",
    tip: "Body parts come free here. Name them as you wash (el pelito, la pancita, los piecitos) and water play buys you more repetitions per minute than any flashcard.",
  },
  bedtime: {
    title: "Spanish phrases for bedtime",
    metaTitle: "Spanish phrases for bedtime",
    metaDescription:
      "Soft, quiet Spanish for winding down: story time, lights out and goodnight phrases with English translations, for parents raising bilingual kids.",
    intro:
      "The end of the day is when consistency pays most. A bedtime that always sounds the same, with the same phrases in the same order and the same soft voice, signals sleep in any language. These are the lines Spanish-speaking parents murmur every night.",
    tip: "«Duerme, mi cielo» is worth learning for the sound alone. Whisper the Spanish even on the nights you're too tired for anything else. Tone carries more than vocabulary.",
  },
  wakeup: {
    title: "Spanish phrases for waking up",
    metaTitle: "Good morning in Spanish for your baby",
    metaDescription:
      "Start the day in Spanish: gentle good-morning phrases for your little one, with English translations and pronunciation-friendly wording.",
    intro:
      "Mornings are the friendliest doorway into Spanish. Your baby wakes up delighted to see you, and «¡buenos días, mi amor!» lands just as well in any language. Starting the day in Spanish also makes it easier to keep going in Spanish.",
    tip: "Make the first sentence of the day Spanish, every day. One fixed morning line like «¿Dormiste bien, mi amor?» builds the habit faster than an hour of study.",
  },
  outside: {
    title: "Spanish phrases for going outside",
    metaTitle: "Spanish phrases for walks and the park",
    metaDescription:
      "Getting dressed, into the pram and out the door: the Spanish phrases for leaving the house with a little one, with English translations.",
    intro:
      "The walk is where Hablaba parents practise most. One hand on the pram, nobody listening, and a running commentary to give about the dog, the bus and the trees. Narrating the world is the classic bilingual-parenting technique, and these phrases get you out the door.",
    tip: "Point and name three things in Spanish on every walk. Same route, same words. The repetition is the point, not the variety.",
  },
  greetings: {
    title: "Spanish greetings and small talk",
    metaTitle: "Spanish greetings and small talk",
    metaDescription:
      "«¿Qué tal?», «encantado de conocerte» and the other lines that open conversations. Natural Spanish greetings with English translations.",
    intro:
      "Most conversations die in the first ten seconds, and it's rarely bad grammar that kills them. It's not having an opener ready. These five lines start almost any playground or playdate conversation, and every one of them invites an answer.",
    tip: "Learn the answers too. «Bien, ¿y tú?» after ¿qué tal? keeps the ball in the air, and that's where the real practice starts.",
  },
  playground: {
    title: "Spanish phrases for the playground",
    metaTitle: "Spanish for the playground",
    metaDescription:
      "The lines parents trade at the swings: how old, how sweet, be careful. Natural playground Spanish with English translations.",
    intro:
      "Playground chat is wonderfully predictable: how old is yours, careful on the slide, we should get going. Predictable is good news for a learner. You can genuinely prepare for these conversations, and other parents are the most forgiving audience you'll find.",
    tip: "«¿Cuántos años tiene?» plus a compliment covers most swing-side conversations. Have both loaded before you leave the house.",
  },
  weather: {
    title: "Spanish small talk about the weather",
    metaTitle: "Weather small talk in Spanish",
    metaDescription:
      "«Qué calor», «parece que va a llover» and the other weather lines that keep Spanish conversations alive, with English translations.",
    intro:
      "Weather talk is the training wheels of conversation: zero stakes, always relevant, and everyone plays along. If a longer chat feels intimidating, this is where to start speaking Spanish to strangers.",
    tip: "Add «¿no?» to the end, as in «Qué calor, ¿no?», and any statement becomes a conversation. It invites agreement, and agreement invites more Spanish.",
  },
  "cafe-ordering": {
    title: "Spanish phrases for ordering at a café",
    metaTitle: "Ordering coffee in Spanish",
    metaDescription:
      "From «¿me traes la carta?» to «la cuenta, por favor»: café Spanish that sounds like a local, with English translations.",
    intro:
      "The café order is the classic first real-world Spanish win: short, scripted, and repeated every day if you want it to be. These are the natural phrasings, like «para mí, un café con leche», rather than the textbook's stiff constructions.",
    tip: "Order in Spanish even when the barista answers in English. The rep counts either way, and the second attempt usually stays in Spanish.",
  },
  bakery: {
    title: "Spanish phrases for the bakery",
    metaTitle: "Bakery Spanish: ordering bread and pastries",
    metaDescription:
      "«¿Qué me recomiendas?», «me llevo dos» and the rest of the Spanish for pointing at pastries with confidence, with English translations.",
    intro:
      "Bakeries are generous places to practise. The things you want are right there to point at, quantities are small numbers, and the whole exchange takes thirty seconds. Perfect reps for a learning parent with a pram parked outside.",
    tip: "«Me llevo…» (I'll take…) is the bakery's magic verb. It works for everything in the glass case and sounds far more natural than «quiero comprar».",
  },
  "cafe-baby": {
    title: "Spanish for the café with a baby",
    metaTitle: "Café with a baby in Spanish",
    metaDescription:
      "Asking for a high chair, space for the pram, warming a bottle: the Spanish parents need at cafés, with English translations.",
    intro:
      "Cafés with a baby come with their own vocabulary: the high chair, somewhere for the pram, could you warm this bottle. Ask in Spanish and you'll usually get a smile along with the sillita, because staff meet very few foreign parents who try.",
    tip: "«¿Tienen sillita para bebé?» is the phrase that opens every café door. Learn it as one chunk of sound, not word by word.",
  },
  "travel-basics": {
    title: "Spanish travel basics for families",
    metaTitle: "Family travel Spanish basics",
    metaDescription:
      "Tickets, times and «¿dónde está…?»: the core Spanish for getting a family around town, with English translations.",
    intro:
      "Travelling with kids compresses your Spanish needs into a shortlist: where is it, when does it leave, how much, two of those please. These phrases cover the logistics so your attention can stay on the small person holding your hand.",
    tip: "Numbers and times are the hidden boss of travel Spanish. Rehearse answers like «a las tres y media», because understanding the reply matters more than asking the question.",
  },
  taxi: {
    title: "Spanish phrases for taxis and rideshares",
    metaTitle: "Taxi Spanish for families",
    metaDescription:
      "Addresses, car seats and «pare aquí, por favor»: the Spanish for taxis and rideshares with kids, with English translations.",
    intro:
      "The taxi is a five-minute Spanish exam with one question: where to. Nail the address, ask about the car seat, and the rest of the ride is free listening practice with a captive native speaker who usually loves to chat.",
    tip: "Say the address before the greeting settles: «Buenas, a la calle Mitre 1200, por favor.» Front-loading it saves the awkward pause while you build the sentence.",
  },
  directions: {
    title: "Asking for directions in Spanish",
    metaTitle: "Asking directions in Spanish",
    metaDescription:
      "«¿Dónde está…?», left, right, straight on: the Spanish for finding your way, plus the answers you'll actually hear back.",
    intro:
      "Asking for directions is easy. Surviving the answer is the skill. These phrases pair each question with the vocabulary that comes back at you (derecha, izquierda, derecho) so the reply doesn't wash over you.",
    tip: "Derecha (right) and derecho (straight on) are one letter apart and completely different directions. Drill that pair before you need it.",
  },
}
