export interface RoutinePhrase {
  spanish: string
  english: string
}

export interface Routine {
  id: string
  category: string
  emoji: string
  name: string
  context: string
  phrases: RoutinePhrase[]
}

export interface Category {
  id: string
  label: string
  emoji: string
}

export const categories: Category[] = [
  { id: "baby", label: "With baby", emoji: "👶" },
  { id: "smalltalk", label: "Small talk", emoji: "👋" },
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "travel", label: "Getting around", emoji: "🚆" },
]

export const routines: Routine[] = [
  {
    id: "greetings",
    category: "smalltalk",
    emoji: "👋",
    name: "Greetings",
    context: "Meeting someone new at the park or a playdate",
    phrases: [
      { spanish: "¿Qué tal?", english: "How's it going?" },
      { spanish: "¿De dónde eres?", english: "Where are you from?" },
      { spanish: "¿A qué te dedicas?", english: "What do you do?" },
      { spanish: "Encantado de conocerte.", english: "Nice to meet you." },
      { spanish: "Hasta luego.", english: "See you later." },
    ],
  },
  {
    id: "cafe-ordering",
    category: "cafe",
    emoji: "☕",
    name: "At the café",
    context: "Ordering coffee with baby in the stroller",
    phrases: [
      { spanish: "¿Me trae la carta, por favor?", english: "Could I have the menu, please?" },
      { spanish: "Para mí, un café con leche.", english: "A café con leche for me." },
      { spanish: "¿Qué me recomienda?", english: "What do you recommend?" },
      { spanish: "¿Está incluida la propina?", english: "Is the tip included?" },
      { spanish: "La cuenta, por favor.", english: "The bill, please." },
    ],
  },
  {
    id: "travel-basics",
    category: "travel",
    emoji: "🚆",
    name: "Travel basics",
    context: "Getting around town with the family",
    phrases: [
      { spanish: "¿Dónde está la estación?", english: "Where's the station?" },
      { spanish: "Un billete a Madrid, por favor.", english: "A ticket to Madrid, please." },
      { spanish: "¿A qué hora sale el tren?", english: "What time does the train leave?" },
      { spanish: "¿Cuánto cuesta?", english: "How much does it cost?" },
      { spanish: "¿Está libre este asiento?", english: "Is this seat free?" },
    ],
  },
  {
    id: "diaper",
    category: "baby",
    emoji: "🧷",
    name: "Diaper change",
    context: "Use these while changing the diaper",
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
    category: "baby",
    emoji: "🍼",
    name: "Feeding",
    context: "During bottle or mealtime",
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
    category: "baby",
    emoji: "🛁",
    name: "Bath time",
    context: "While giving your little one a bath",
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
    category: "baby",
    emoji: "🌙",
    name: "Bedtime",
    context: "Winding down for the night",
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
    category: "baby",
    emoji: "☀️",
    name: "Waking up",
    context: "First thing in the morning",
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
    category: "baby",
    emoji: "🌿",
    name: "Going outside",
    context: "Heading out for a walk or to the park",
    phrases: [
      { spanish: "¡Vamos a salir!", english: "Let's go outside!" },
      { spanish: "Qué lindo día.", english: "What a beautiful day." },
      { spanish: "Mira el cielo.", english: "Look at the sky." },
      { spanish: "Siente el sol.", english: "Feel the sun." },
      { spanish: "¿Escuchas los pájaros?", english: "Do you hear the birds?" },
    ],
  },
  {
    id: "playground",
    category: "smalltalk",
    emoji: "🛝",
    name: "At the playground",
    context: "Chatting with other parents while the kids play",
    phrases: [
      { spanish: "¿Cuántos años tiene el tuyo?", english: "How old is yours?" },
      { spanish: "El mío tiene casi dos.", english: "Mine is almost two." },
      { spanish: "¿Vienen mucho por aquí?", english: "Do you come here a lot?" },
      { spanish: "Se llevan bien, ¿no?", english: "They get along well, don't they?" },
      { spanish: "Nos vemos la próxima.", english: "See you next time." },
    ],
  },
  {
    id: "weather",
    category: "smalltalk",
    emoji: "🌤️",
    name: "Weather & the day",
    context: "Easy small talk about the weather",
    phrases: [
      { spanish: "Qué buen día hace hoy.", english: "What a nice day it is today." },
      { spanish: "Parece que va a llover.", english: "It looks like it's going to rain." },
      { spanish: "Hace bastante calor, ¿no?", english: "It's pretty hot, isn't it?" },
      { spanish: "Mejor llevamos abrigo.", english: "We'd better bring a coat." },
      { spanish: "A ver si sale el sol.", english: "Let's hope the sun comes out." },
    ],
  },
  {
    id: "bakery",
    category: "cafe",
    emoji: "🥐",
    name: "At the bakery",
    context: "Grabbing something at the panadería",
    phrases: [
      { spanish: "¿Qué tienen recién hecho?", english: "What's freshly made?" },
      { spanish: "Me llevo dos medialunas.", english: "I'll take two croissants." },
      { spanish: "¿Tienen algo sin azúcar?", english: "Do you have anything without sugar?" },
      { spanish: "¿Me lo pone para llevar?", english: "Could you make it to go?" },
      { spanish: "¿Cuánto es todo?", english: "How much is it all?" },
    ],
  },
  {
    id: "cafe-baby",
    category: "cafe",
    emoji: "🍼",
    name: "Café with a baby",
    context: "Sorting out space for the stroller",
    phrases: [
      { spanish: "¿Hay lugar para el cochecito?", english: "Is there room for the stroller?" },
      { spanish: "¿Tienen sillita para bebé?", english: "Do you have a high chair?" },
      { spanish: "¿Me calienta esto, por favor?", english: "Could you warm this up, please?" },
      { spanish: "¿Dónde puedo cambiarlo?", english: "Where can I change him?" },
      { spanish: "Un vaso de agua, por favor.", english: "A glass of water, please." },
    ],
  },
  {
    id: "taxi",
    category: "travel",
    emoji: "🚕",
    name: "Taxi & rideshare",
    context: "Getting a cab with the family",
    phrases: [
      { spanish: "¿Me lleva a esta dirección?", english: "Can you take me to this address?" },
      { spanish: "¿Tiene sillita para niños?", english: "Do you have a child seat?" },
      { spanish: "¿Cuánto sale hasta el centro?", english: "How much is it to the centre?" },
      { spanish: "Puede dejarnos aquí, gracias.", english: "You can drop us here, thanks." },
      { spanish: "¿Acepta tarjeta?", english: "Do you take card?" },
    ],
  },
  {
    id: "directions",
    category: "travel",
    emoji: "🗺️",
    name: "Asking directions",
    context: "Finding your way around town",
    phrases: [
      { spanish: "¿Cómo llego al parque?", english: "How do I get to the park?" },
      { spanish: "¿Está lejos de aquí?", english: "Is it far from here?" },
      { spanish: "¿Puedo ir caminando?", english: "Can I walk there?" },
      { spanish: "¿Hay un baño cerca?", english: "Is there a bathroom nearby?" },
      { spanish: "Me perdí un poco.", english: "I'm a bit lost." },
    ],
  },
]
