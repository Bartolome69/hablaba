import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"

// "I want to learn the word for pushchair" → la sillita de paseo (f), with a
// sentence a parent would actually say. Stateless, like every route here: the
// client owns the word list and decides what to keep.
//
// Distinct from /api/translate, which goes the other way (a whole Spanish turn
// → English) for tap-to-translate. This one is en→es, one word, and its job is
// mostly the GRAMMAR around the word: the article and gender are the part a
// B1 learner gets wrong, so the model must return them as fields rather than
// leaving them to be parsed back out of a string.

export const runtime = "nodejs"
export const maxDuration = 20

const MODEL = "gpt-4o"
const MAX_CHARS = 120

const SET_IDS = ["cuerpo", "animales", "comida", "propias"] as const
type SetId = (typeof SET_IDS)[number]

const DIALECT_BLOCK: Record<string, string> = {
  rioplatense:
    'Vocabulary is Argentine/Rioplatense: frutilla not fresa, palta not aguacate, papa not patata, banana not plátano, chancho not cerdo, pañal, chupete, mamadera, cochecito. Peninsular words are errors ("vale", "guay", "coger", "ordenador", "zumo").',
  neutral:
    'Vocabulary is neutral Latin American: clear and widely understood. Peninsular words are errors ("vale", "guay", "coger", "ordenador", "zumo").',
}

interface TranslateRequest {
  /** The English word or short phrase the learner wants. */
  term?: string
  dialect?: "rioplatense" | "neutral"
  childName?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TranslateRequest
    const term = body.term?.trim()
    if (!term) {
      return NextResponse.json({ error: "term is required" }, { status: 400 })
    }
    const dialect = body.dialect === "neutral" ? "neutral" : "rioplatense"

    const system = `You turn an English word into the Spanish word a B1-level parent should learn, for a parent raising a bilingual baby${body.childName ? ` (${body.childName})` : ""}.

${DIALECT_BLOCK[dialect]}

Rules:
- Give the single most useful everyday translation, not a list of synonyms.
- "spanish" is the bare word with NO article ("rodilla", not "la rodilla").
- "article" is the definite article that agrees with it: el, la, los or las. Nouns like "agua" that are feminine but take "el" in the singular get article "el" and gender "f".
- "gender" is "m", "f", or "invariable" for words that don't inflect (adjectives, verbs, adverbs).
- If the input is not a noun (a verb, an adjective), still translate it: give the infinitive or the masculine singular, article "", gender "invariable".
- "english" is a clean gloss of YOUR Spanish — it may differ from the input if the input was vague or misspelled.
- "example" is one short sentence a parent would really say to or about their baby, using the word. Grammar is tú, always — never voseo (vos/tenés/querés), never vosotros.
- "exampleTranslation" is a natural English gloss of that sentence.
- "set" is which group it belongs to: "cuerpo" (a body part), "animales" (an animal), "comida" (food or drink), or "propias" for anything else.

Respond with a JSON object: {"spanish": "...", "article": "...", "gender": "...", "english": "...", "example": "...", "exampleTranslation": "...", "set": "..."}`

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: term.slice(0, MAX_CHARS) },
      ],
      response_format: { type: "json_object" },
    })

    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from vocab model")
    const data = JSON.parse(raw) as Record<string, unknown>

    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")
    const spanish = str(data.spanish)
    if (!spanish) throw new Error("Translation missing")

    // Everything the model says is narrowed to a closed vocabulary before it
    // reaches the client — the store trusts these fields.
    const article = ["el", "la", "los", "las", ""].includes(str(data.article).toLowerCase())
      ? str(data.article).toLowerCase()
      : ""
    const gender = (["m", "f", "invariable"] as const).includes(str(data.gender) as "m")
      ? (str(data.gender) as "m" | "f" | "invariable")
      : "invariable"
    const set: SetId = (SET_IDS as readonly string[]).includes(str(data.set))
      ? (str(data.set) as SetId)
      : "propias"

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "vocab_translate",
        model: MODEL,
        set,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json(
      {
        word: {
          spanish,
          article,
          gender,
          english: str(data.english) || term,
          example: str(data.example) || undefined,
          exampleTranslation: str(data.exampleTranslation) || undefined,
          set,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[/api/vocab/translate]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
