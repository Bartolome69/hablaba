export interface RoutinePhrase {
  spanish: string
  english: string
}

export interface Routine {
  id: string
  emoji: string
  name: string
  phrases: RoutinePhrase[]
}

export const routines: Routine[] = [
  {
    id: "diaper",
    emoji: "🧷",
    name: "Diaper change",
    phrases: [
      { spanish: "Vamos a cambiar el pañal.", english: "Let's change your diaper." },
      { spanish: "Aquí vamos, ya casi.", english: "Here we go, almost done." },
      { spanish: "Levanta las piernas.", english: "Lift your legs." },
      { spanish: "¡Muy bien! Qué limpio estás.", english: "Well done! You're so clean." },
      { spanish: "¿Listo? ¡Listo!", english: "Ready? Done!" },
    ],
  },
  {
    id: "feeding",
    emoji: "🍼",
    name: "Feeding",
    phrases: [
      { spanish: "¿Tienes hambre?", english: "Are you hungry?" },
      { spanish: "Aquí viene la leche.", english: "Here comes the milk." },
      { spanish: "Rico, ¿verdad?", english: "Yummy, right?" },
      { spanish: "Más despacio, tranquilo.", english: "Slow down, easy." },
      { spanish: "¿Ya terminaste?", english: "Are you done?" },
    ],
  },
  {
    id: "bath",
    emoji: "🛁",
    name: "Bath time",
    phrases: [
      { spanish: "Hora del baño.", english: "Bath time." },
      { spanish: "El agua está calentita.", english: "The water is warm." },
      { spanish: "Vamos a lavar la cabecita.", english: "Let's wash your little head." },
      { spanish: "¡Qué rico el baño!", english: "What a nice bath!" },
      { spanish: "Ya terminamos. ¡Qué limpio!", english: "All done. So clean!" },
    ],
  },
  {
    id: "bedtime",
    emoji: "🌙",
    name: "Bedtime",
    phrases: [
      { spanish: "Es hora de dormir.", english: "It's time to sleep." },
      { spanish: "Buenas noches, mi amor.", english: "Good night, my love." },
      { spanish: "Cierra los ojitos.", english: "Close your little eyes." },
      { spanish: "Dulces sueños.", english: "Sweet dreams." },
      { spanish: "Te quiero muchísimo.", english: "I love you so much." },
    ],
  },
  {
    id: "wakeup",
    emoji: "☀️",
    name: "Waking up",
    phrases: [
      { spanish: "¡Buenos días!", english: "Good morning!" },
      { spanish: "¿Dormiste bien?", english: "Did you sleep well?" },
      { spanish: "¡Ya despertaste!", english: "You woke up!" },
      { spanish: "Qué rico dormir, ¿verdad?", english: "Feels good to sleep, doesn't it?" },
      { spanish: "Hora de levantarse.", english: "Time to get up." },
    ],
  },
  {
    id: "outside",
    emoji: "🌿",
    name: "Going outside",
    phrases: [
      { spanish: "¡Vamos a salir!", english: "Let's go outside!" },
      { spanish: "Qué lindo día.", english: "What a beautiful day." },
      { spanish: "Mira el cielo.", english: "Look at the sky." },
      { spanish: "Siente el sol.", english: "Feel the sun." },
      { spanish: "¿Escuchas los pájaros?", english: "Do you hear the birds?" },
    ],
  },
]
