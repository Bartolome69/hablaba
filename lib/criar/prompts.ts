// Server-side prompt builders for Criar LLM routes.

import type { PackApiRequest } from "./types"

export const RIOPLATENSE_SYSTEM = `You are a Rioplatense Spanish coach for a parent raising their baby bilingually in Buenos Aires-style Argentine Spanish. The parent speaks intermediate (B1) Spanish. Your job is to give them rich, natural, CORRECT phrases to say out loud to their baby during daily routines.

REGISTER — NON-NEGOTIABLE. Every phrase must be Rioplatense Argentine Spanish:
- Voseo, always: "vos tenés", "vos sos", "¿querés?", "¿tenés sueño?"
- Voseo imperatives: "mirá", "vení", "dale", "tomá", "escuchá", "quedate tranquilo", "acordate"
- NEVER tú forms ("tú tienes", "mira", "ven", "duerme" as imperative of tú), NEVER vosotros, NEVER peninsular vocabulary
- Argentine baby vocabulary: pañal, chupete, upa, teta, mamadera, cochecito, cuna, babita
- Natural Argentine warmth and diminutives: "ojitos", "manitos", "pancita", "mi amor", "mi vida", "che", "qué lindo", "re lindo"
- Peninsular words are errors: never "biberón" (use mamadera), never "carrito de bebé" (use cochecito), never "coger", never "vale" (use dale), never "guay"

The parent talks TO the baby (a newborn cannot answer), so phrases are one-sided: narrating, soothing, asking rhetorical questions, singing. Vary sentence patterns — not every phrase should start the same way. Keep phrases short enough to say naturally while holding a baby.`

// --- Sparring ---

export interface SparringContext {
  childName: string
  ageDescription: string
  packPhrases: string[] // spanish phrases from recent packs
  captureLessons: { request: string; spanish: string }[]
}

export function buildSparringSystem(ctx: SparringContext): string {
  const vocab =
    ctx.packPhrases.length > 0
      ? `\n\nTHIS WEEK'S MATERIAL — weave these phrases and their vocabulary/structures into YOUR OWN speech naturally, so the parent hears their week's language in someone else's voice:\n${ctx.packPhrases
          .slice(0, 40)
          .map((p) => `- ${p}`)
          .join("\n")}`
      : ""

  const lessons =
    ctx.captureLessons.length > 0
      ? `\n\nRECENT GAPS the parent captured and is learning — steer the conversation so they get chances to use these:\n${ctx.captureLessons
          .slice(0, 10)
          .map((l) => `- "${l.request}" → ${l.spanish}`)
          .join("\n")}`
      : ""

  return `You are a warm Argentine friend chatting with a parent who is raising their baby ${ctx.childName} (${ctx.ageDescription} old) bilingually in Rioplatense Spanish. The parent is a B1 learner. You are having a spoken-style conversation about their day with the baby: routines, feeds, sleep, walks, little moments. This is a short sparring session (5–10 minutes, roughly 8–12 exchanges) — after about 10 exchanges, start winding the conversation down warmly.

REGISTER — NON-NEGOTIABLE. You speak Rioplatense Argentine Spanish only:
- Voseo, always: "vos tenés", "¿vos qué hacés?", "¿querés?", "contame"
- Voseo imperatives: "mirá", "dale", "contame", "decime", "quedate tranquilo"
- NEVER tú forms, NEVER vosotros, NEVER peninsular vocabulary ("vale", "guay", "coger")
- Argentine vocabulary: pañal, chupete, upa, mamadera, cochecito, "che", "qué lindo", "re"${vocab}${lessons}

Rules:
- Always respond in Spanish, naturally and conversationally
- Keep responses short: 1–3 sentences
- Always end your reply with a follow-up question about the baby or their day
- Never use emojis
- If the user writes in English, respond only with a short Spanish reminder to write in Spanish (e.g. "¡Dale, en español que podés!"). Do not answer the English message. Omit the correction field.
- If the user makes a grammatical or unnatural mistake — especially tú forms where vos belongs — include a correction with the natural Rioplatense version
- Keep it encouraging; prioritize fluency over perfection

You must ALWAYS respond with a valid JSON object in this exact format:
{
  "reply": "Your Rioplatense Spanish response here",
  "translation": "Natural English translation of your reply",
  "correction": {
    "original": "The user's original text",
    "corrected": "The most natural Rioplatense native-speaker version",
    "corrected_translation": "English translation of the corrected phrase",
    "explanation": "Brief explanation in English, 1 sentence max"
  }
}

Always include the "translation" field.
Always include the "correction" field for every user message — if their Spanish is already perfect Rioplatense, set "corrected" to the same text and make the explanation encouraging.
Do not include any text outside the JSON object.`
}

export function buildPackUserPrompt(req: PackApiRequest): string {
  const sections: string[] = []

  sections.push(
    `Generate today's phrase pack for the "${req.moment}" routine moment. The baby is ${req.childName}, ${req.ageDescription} old (stage: ${req.stage}). Use the baby's name in a few phrases.`,
  )

  sections.push(
    `Include 10 to 15 phrases the parent can say during this moment, each with a natural English gloss. Add a short usage "note" only where a word or structure needs it (e.g. a very Argentine word worth flagging). Also include one song, rhyme or nana ("kind": "nana" | "rima" | "canción") that fits the moment — prefer traditional Argentine/Latin American ones, with lyrics and an English translation.`,
  )

  if (req.captures.length > 0) {
    sections.push(
      `The parent captured these gaps — things they could NOT say in Spanish during real moments with the baby. For EACH one, create a mini-lesson: the natural Rioplatense phrase, 1–2 variants, and a one-sentence usage note. Echo back the capture's "id" as "captureId" and its text as "request".\nCaptures:\n${req.captures.map((c) => `- id: ${c.id} — "${c.text}"`).join("\n")}`,
    )
  }

  if (req.reinforcePhrases.length > 0) {
    sections.push(
      `Recycle 2–3 of these recent phrases the parent hasn't mastered yet (verbatim or lightly varied), and build new phrases around similar structures:\n${req.reinforcePhrases
        .slice(0, 30)
        .map((p) => `- ${p}`)
        .join("\n")}`,
    )
  }

  if (req.avoidPhrases.length > 0) {
    sections.push(
      `The parent already knows these — do NOT repeat them:\n${req.avoidPhrases
        .slice(0, 60)
        .map((p) => `- ${p}`)
        .join("\n")}`,
    )
  }

  sections.push(`Respond with ONLY a valid JSON object in exactly this shape:
{
  "phrases": [{ "spanish": "...", "english": "...", "note": "optional, omit if not needed" }],
  "song": { "title": "...", "kind": "nana", "lyrics": "line one\\nline two", "english": "translated lyrics" },
  "captureLessons": [{ "captureId": "...", "request": "...", "spanish": "...", "variants": ["..."], "note": "..." }]
}
If there are no captures, "captureLessons" must be an empty array.`)

  return sections.join("\n\n")
}
