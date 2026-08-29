// Starter phrases for the moment packs — the static floor under the library.
//
// Each moment ships with twelve authored phrases so the pack is never empty
// on a fresh device. They are read-only rows materialised at query time
// (see pack.ts), NOT written into the library: the learner's own captured,
// saved and generated phrases always outrank them, and they never leak into
// conversation seeding or the review deck.
//
// Register matches lib/routines.ts: clear, neutral Latin American Spanish
// using tú — parent-to-little-one talk, one moment at a time. Deliberately
// complements (does not repeat) the routine phrases for the same moments.

import type { Phrase, PhraseMoment } from "./types"

export const STARTER_ID_PREFIX = "starter-"

/** True for a pack row that came from the starter set, not the library. */
export function isStarterPhrase(p: Pick<Phrase, "id">): boolean {
  return p.id.startsWith(STARTER_ID_PREFIX)
}

interface StarterEntry {
  text: string
  translation: string
}

const STARTERS: Record<PhraseMoment, StarterEntry[]> = {
  despertar: [
    { text: "Ya es de día, mi amor.", translation: "It's daytime, my love." },
    { text: "¿Quién se despertó tan contento?", translation: "Who woke up so happy?" },
    { text: "Buen día, dormilón.", translation: "Good morning, sleepyhead." },
    { text: "Estira los bracitos.", translation: "Stretch your little arms." },
    { text: "Despacito, sin apuro.", translation: "Nice and slow, no rush." },
    { text: "Todavía tienes carita de sueño.", translation: "You've still got a sleepy little face." },
    { text: "Vamos a cambiarte, estás mojadito.", translation: "Let's get you changed, you're a bit wet." },
    { text: "Vamos a preparar el desayuno.", translation: "Let's make breakfast." },
    { text: "Hoy va a ser un lindo día.", translation: "Today's going to be a lovely day." },
    { text: "¿Dormiste toda la noche? ¡Qué campeón!", translation: "You slept all night? What a champ!" },
    { text: "¿Escuchaste? Ya cantan los pájaros.", translation: "Did you hear? The birds are already singing." },
    { text: "Vamos a vestirnos.", translation: "Let's get dressed." },
  ],
  comida: [
    { text: "A la sillita, es hora de comer.", translation: "Into the high chair, it's time to eat." },
    { text: "Prueba un poquito.", translation: "Try a little bit." },
    { text: "Está calentito, sopla.", translation: "It's warm, blow on it." },
    { text: "¿Te gusta? Es banana.", translation: "Do you like it? It's banana." },
    { text: "Toma la cuchara, prueba tú.", translation: "Take the spoon, you try." },
    { text: "Un poquito de agua.", translation: "A little bit of water." },
    { text: "No se tira la comida.", translation: "We don't throw food." },
    { text: "Qué bien comes solito.", translation: "You're eating so well by yourself." },
    { text: "¿Está rico el puré?", translation: "Is the purée yummy?" },
    { text: "Último bocado y listo.", translation: "Last bite and we're done." },
    { text: "Ahora las manitas, a lavarlas.", translation: "Now your little hands, let's wash them." },
    { text: "Buen provecho, mi amor.", translation: "Enjoy your food, my love." },
  ],
  juego: [
    { text: "¿A qué jugamos?", translation: "What shall we play?" },
    { text: "¿Dónde está la pelota?", translation: "Where's the ball?" },
    { text: "Pásamela. ¡Muy bien!", translation: "Pass it to me. Well done!" },
    { text: "Una torre más alta, ¿puedes?", translation: "An even taller tower, can you do it?" },
    { text: "¡Se cayó! No pasa nada.", translation: "It fell down! That's OK." },
    { text: "¿Dónde estás? ¡Aquí estás!", translation: "Where are you? There you are!" },
    { text: "Otra vez, ¿quieres?", translation: "Again? Do you want to?" },
    { text: "Este es el rojo, este es el azul.", translation: "This one's red, this one's blue." },
    { text: "¡Qué rápido corres!", translation: "How fast you run!" },
    { text: "Dame la mano, bailamos.", translation: "Give me your hand, let's dance." },
    { text: "Guardamos los juguetes juntos.", translation: "Let's put the toys away together." },
    { text: "Eso es, tú puedes.", translation: "That's it, you can do it." },
  ],
  paseo: [
    { text: "¿Vamos a la plaza?", translation: "Shall we go to the square?" },
    { text: "Mira las flores. ¿Las hueles?", translation: "Look at the flowers. Can you smell them?" },
    { text: "¿Oyes eso? Es un camión.", translation: "Do you hear that? It's a truck." },
    { text: "Vamos despacio, sin correr.", translation: "Let's go slowly, no running." },
    { text: "Dame la mano para cruzar.", translation: "Hold my hand to cross." },
    { text: "Mira, un gatito en la ventana.", translation: "Look, a little cat in the window." },
    { text: "¿Saludamos al vecino?", translation: "Shall we say hi to the neighbour?" },
    { text: "Qué viento hace hoy.", translation: "It's so windy today." },
    { text: "Una vuelta más a la manzana.", translation: "One more lap around the block." },
    { text: "¿Estás cansado? Te llevo.", translation: "Are you tired? I'll carry you." },
    { text: "Pisamos las hojas. ¡Crunch!", translation: "Let's step on the leaves. Crunch!" },
    { text: "Casi llegamos a casa.", translation: "We're almost home." },
  ],
  baño: [
    { text: "Vamos a preparar el agua.", translation: "Let's get the water ready." },
    { text: "A quitarse la ropa.", translation: "Let's take your clothes off." },
    { text: "¿Está rica el agua?", translation: "Is the water nice?" },
    { text: "¿Dónde está tu patito?", translation: "Where's your little duck?" },
    { text: "Un poquito de jabón.", translation: "A little bit of soap." },
    { text: "Cierra los ojos, viene el agua.", translation: "Close your eyes, here comes the water." },
    { text: "Lavamos los piecitos.", translation: "Let's wash your little feet." },
    { text: "No tires agua afuera, amor.", translation: "Don't splash water out, love." },
    { text: "Ya está, a salir.", translation: "All done, out you come." },
    { text: "Envuelto como un burrito.", translation: "Wrapped up like a little burrito." },
    { text: "Vamos a peinarte.", translation: "Let's comb your hair." },
    { text: "Crema para la pancita.", translation: "Cream for your tummy." },
  ],
  calmar: [
    { text: "Ya, ya, aquí estoy.", translation: "There, there, I'm here." },
    { text: "Tranquilo, mi amor.", translation: "Easy, my love." },
    { text: "¿Qué pasó, mi vida?", translation: "What happened, sweetheart?" },
    { text: "Ven, un abrazo fuerte.", translation: "Come here, a big hug." },
    { text: "Ya pasó, ya pasó.", translation: "It's over now, it's over." },
    { text: "Respira conmigo, despacito.", translation: "Breathe with me, nice and slow." },
    { text: "Estoy contigo, no te preocupes.", translation: "I'm with you, don't worry." },
    { text: "¿Te duele algo? Muéstrame.", translation: "Does something hurt? Show me." },
    { text: "Shh, shh, todo está bien.", translation: "Shh, shh, everything's OK." },
    { text: "Llora tranquilo, aquí te tengo.", translation: "It's OK to cry, I've got you." },
    { text: "¿Quieres tu peluche?", translation: "Do you want your cuddly toy?" },
    { text: "Un besito y se pasa.", translation: "A little kiss and it'll pass." },
  ],
  dormir: [
    { text: "Última canción y a la cama.", translation: "One last song and off to bed." },
    { text: "Busca tu mantita.", translation: "Find your little blanket." },
    { text: "Hoy jugaste muchísimo.", translation: "You played so much today." },
    { text: "Mañana seguimos jugando.", translation: "We'll play more tomorrow." },
    { text: "Despacito, a la cuna.", translation: "Gently now, into the cot." },
    { text: "Canto bajito, tú descansa.", translation: "I'll sing softly, you rest." },
    { text: "Los juguetes también duermen.", translation: "The toys are sleeping too." },
    { text: "Dejo la lucecita prendida.", translation: "I'll leave the little light on." },
    { text: "Mamá y papá están cerca.", translation: "Mummy and daddy are close by." },
    { text: "Sueña con cosas lindas.", translation: "Dream of lovely things." },
    { text: "Nos vemos cuando salga el sol.", translation: "See you when the sun comes up." },
    { text: "Un último besito.", translation: "One last little kiss." },
  ],
}

// Fixed timestamp so starter rows are stable and always sort behind anything
// the learner actually did (packOrder already puts them last by band).
const STARTER_DATE = "2026-01-01T00:00:00.000Z"

/** The starter set for a moment as read-only Phrase rows. */
export function getStarterPhrases(moment: PhraseMoment): Phrase[] {
  return STARTERS[moment].map((s, i) => ({
    id: `${STARTER_ID_PREFIX}${moment}-${i}`,
    text: s.text,
    translation: s.translation,
    moment,
    source: "generated",
    state: "nueva",
    timesUsed: 0,
    timesPracticed: 0,
    createdAt: STARTER_DATE,
    lastTouchedAt: STARTER_DATE,
  }))
}
