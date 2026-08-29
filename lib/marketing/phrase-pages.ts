// SEO copy for the /frases/[routine] pages — one entry per routine in
// lib/routines.ts. The phrases themselves come from the routine; this file
// carries the search-facing framing: titles, intros, and the one practical
// tip that makes each page worth landing on.

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
    metaTitle: "Spanish phrases for nappy & diaper changes — talk to your baby in Spanish",
    metaDescription:
      "The Spanish parents actually say at the changing table — simple, warm phrases with English translations, for raising a bilingual baby one routine at a time.",
    intro:
      "The changing table is the easiest place to start speaking Spanish with your baby: you do it several times a day, you're face to face, and nobody is judging your grammar. Narrate what you're doing with the same handful of phrases each time — repetition is exactly what a baby's brain wants.",
    tip: "Pick just two of these and say them at every single change for a week. When they come out without thinking, add the next two.",
  },
  feeding: {
    title: "Spanish phrases for feeding your baby",
    metaTitle: "Spanish phrases for feeding time — bottles, purée and first foods",
    metaDescription:
      "Warm, natural Spanish for bottles and mealtimes, with English translations. The phrases bilingual parents really use, not textbook lines.",
    intro:
      "Mealtimes are full of natural repetition — every spoonful is another chance to say the same warm phrase. That's why feeding vocabulary sticks faster than almost anything else you'll learn.",
    tip: "«Abre la boquita» and «qué rico» will carry you through the first month. The -ita/-ito endings aren't baby talk gone wrong — Spanish-speaking parents genuinely talk this way.",
  },
  bath: {
    title: "Spanish phrases for bath time",
    metaTitle: "Spanish phrases for bath time — bathing your baby in Spanish",
    metaDescription:
      "From «¿vamos a la bañera?» to «ya estás limpito»: the Spanish phrases for bathing your little one, with English translations for learning parents.",
    intro:
      "Bath time has a fixed script — water on, clothes off, wash, splash, out, towel — which makes it perfect for Spanish. Say the same phrases at the same moments and within weeks they'll be the furniture of the routine, for both of you.",
    tip: "Body parts come free here: name them as you wash — el pelito, la pancita, los piecitos. Water play buys you more repetitions per minute than any flashcard.",
  },
  bedtime: {
    title: "Spanish phrases for bedtime",
    metaTitle: "Spanish phrases for bedtime — putting your baby to sleep in Spanish",
    metaDescription:
      "Soft, quiet Spanish for winding down: story time, lights out and goodnight phrases with English translations, for parents raising bilingual kids.",
    intro:
      "The end of the day is when consistency pays most: a bedtime that always sounds the same — same phrases, same order, same soft voice — signals sleep in any language. These are the lines Spanish-speaking parents murmur every night.",
    tip: "«Duerme, mi cielo» is worth learning for the sound alone. Whisper the Spanish even on the nights you're too tired for anything else — tone carries more than vocabulary.",
  },
  wakeup: {
    title: "Spanish phrases for waking up",
    metaTitle: "Good morning in Spanish — wake-up phrases for your baby",
    metaDescription:
      "Start the day in Spanish: gentle good-morning phrases for your little one, with English translations and pronunciation-friendly wording.",
    intro:
      "Mornings are the friendliest doorway into Spanish: your baby wakes up delighted to see you, and «¡buenos días, mi amor!» lands the same in any language. Starting the day in Spanish also makes it easier to keep going in Spanish.",
    tip: "Make the first sentence of the day Spanish, every day. One fixed morning line («¿Dormiste bien, mi amor?») builds the habit faster than an hour of study.",
  },
  outside: {
    title: "Spanish phrases for going outside",
    metaTitle: "Spanish phrases for walks and the park — out and about with your baby",
    metaDescription:
      "Getting dressed, into the pram and out the door — the Spanish phrases for leaving the house with a little one, with English translations.",
    intro:
      "The walk is where Hablaba parents practise most: one hand on the pram, nobody listening, and a running commentary to give — the dog, the bus, the trees. Narrating the world is the classic bilingual-parenting technique, and these phrases get you out the door.",
    tip: "Outside, point and name three things in Spanish on every walk. Same route, same words — the repetition is the point, not the variety.",
  },
  greetings: {
    title: "Spanish greetings and small talk",
    metaTitle: "Spanish greetings & small talk — meeting people at the park",
    metaDescription:
      "«¿Qué tal?», «encantado de conocerte» and the other lines that open conversations — natural Spanish greetings with English translations.",
    intro:
      "Most conversations die in the first ten seconds — not from bad grammar, but from not having an opener ready. These five lines start almost any playground or playdate conversation, and every one of them invites an answer.",
    tip: "Learn the answers too: «bien, ¿y tú?» after ¿qué tal? keeps the ball in the air, which is where the real practice starts.",
  },
  playground: {
    title: "Spanish phrases for the playground",
    metaTitle: "Spanish for the playground — chatting with other parents",
    metaDescription:
      "The lines parents trade at the swings: how old, how sweet, be careful — natural playground Spanish with English translations.",
    intro:
      "Playground chat is wonderfully predictable: how old is yours, careful on the slide, we should get going. Predictable is good news for a learner — you can genuinely prepare for these conversations, and other parents are the most forgiving audience you'll find.",
    tip: "«¿Cuántos años tiene?» plus a compliment covers 80% of swing-side conversations. Have both loaded before you leave the house.",
  },
  weather: {
    title: "Spanish small talk about the weather",
    metaTitle: "Weather small talk in Spanish — easy conversation openers",
    metaDescription:
      "«Qué calor», «parece que va a llover» — the weather lines that keep Spanish conversations alive, with English translations.",
    intro:
      "Weather talk is the training wheels of conversation: zero stakes, always relevant, and everyone plays along. If a longer chat feels intimidating, this is where to start speaking Spanish to strangers.",
    tip: "Add «¿no?» to the end («Qué calor, ¿no?») and any statement becomes a conversation — it invites agreement, and agreement invites more Spanish.",
  },
  "cafe-ordering": {
    title: "Spanish phrases for ordering at a café",
    metaTitle: "Ordering coffee in Spanish — café phrases that sound natural",
    metaDescription:
      "From «¿me traes la carta?» to «la cuenta, por favor» — the café Spanish that sounds like a local, with English translations.",
    intro:
      "The café order is the classic first real-world Spanish win: short, scripted, and repeated every day if you want it to be. These are the natural phrasings — «para mí, un café con leche» rather than the textbook's stiff constructions.",
    tip: "Order in Spanish even when the barista answers in English. The rep counts either way, and the second attempt usually stays in Spanish.",
  },
  bakery: {
    title: "Spanish phrases for the bakery",
    metaTitle: "Bakery Spanish — ordering bread and pastries like a local",
    metaDescription:
      "«¿Qué me recomiendas?», «me llevo dos» — the Spanish for pointing at pastries with confidence, with English translations.",
    intro:
      "Bakeries are generous places to practise: the things you want are right there to point at, quantities are small numbers, and the whole exchange takes thirty seconds. Perfect reps for a learning parent with a pram parked outside.",
    tip: "«Me llevo…» (I'll take…) is the bakery's magic verb — it works for everything in the glass case and sounds far more natural than «quiero comprar».",
  },
  "cafe-baby": {
    title: "Spanish for the café with a baby",
    metaTitle: "Café with a baby in Spanish — high chairs, prams and warm bottles",
    metaDescription:
      "Asking for a high chair, space for the pram, warming a bottle — the Spanish parents need at cafés, with English translations.",
    intro:
      "Cafés with a baby come with their own vocabulary — the high chair, somewhere for the pram, could you warm this bottle. Ask in Spanish and you'll usually get a smile along with the sillita; staff meet very few foreign parents who try.",
    tip: "«¿Tienen sillita para bebé?» is the phrase that opens every café door. Learn it as one chunk of sound, not word by word.",
  },
  "travel-basics": {
    title: "Spanish travel basics for families",
    metaTitle: "Family travel Spanish — the basics for getting around",
    metaDescription:
      "Tickets, times and «¿dónde está…?» — the core Spanish for getting a family around town, with English translations.",
    intro:
      "Travelling with kids compresses your Spanish needs into a shortlist: where is it, when does it leave, how much, two of those please. These phrases cover the logistics so your attention can stay on the small person holding your hand.",
    tip: "Numbers and times are the hidden boss of travel Spanish. Rehearse «a las tres y media» style answers, because understanding the reply matters more than asking the question.",
  },
  taxi: {
    title: "Spanish phrases for taxis and rideshares",
    metaTitle: "Taxi Spanish — getting a cab with the family",
    metaDescription:
      "Addresses, car seats and «pare aquí, por favor» — the Spanish for taxis and rideshares with kids, with English translations.",
    intro:
      "The taxi is a five-minute Spanish exam with one question: where to. Nail the address, ask about the car seat, and the rest of the ride is free listening practice with a captive native speaker who usually loves to chat.",
    tip: "Say the address before the greeting settles: «Buenas — a la calle Mitre 1200, por favor.» Front-loading it saves the awkward pause while you build the sentence.",
  },
  directions: {
    title: "Asking for directions in Spanish",
    metaTitle: "Asking directions in Spanish — and understanding the answer",
    metaDescription:
      "«¿Dónde está…?», left, right, straight on — the Spanish for finding your way, with the answers you'll actually hear.",
    intro:
      "Asking for directions is easy; surviving the answer is the skill. These phrases pair each question with the vocabulary that comes back at you — derecha, izquierda, derecho — so the reply doesn't wash over you.",
    tip: "Derecha (right) and derecho (straight on) are one letter apart and completely different directions. Drill that pair before you need it.",
  },
}
