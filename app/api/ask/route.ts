import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"
import { posthog } from "@/lib/posthog-server"

// "¿Cómo se dice…?": the one lookup behind jobs 1 to 3 (how do I say this,
// what's the word for this, add it to my words). Stateless; the client decides
// whether to keep the answer, as a word (vocab_words) or a phrase (phrases).
//
// It folds the two older lookups into one call and keeps their rules verbatim:
// - from /api/vocab/translate: a word comes back with its article and gender as
//   FIELDS (the part a B1 learner gets wrong), plus an example sentence;
// - from /api/phrases/generate capture mode: Spanish input is the learner's
//   own construction, kept and minimally corrected, never swapped for a synonym.
// New here: the model decides word vs phrase, glosses are en-GB, and where the
// other dialect says it differently that word comes back as a second gloss.

export const runtime = "nodejs"
export const maxDuration = 25

const MODEL = "gpt-4o"
const MAX_CHARS = 300

const MOMENTS: Record<string, string> = {
  cambiar: "nappy changes and getting dressed",
  baño: "bath time",
  comida: "feeding and meals",
  dormir: "bedtime and naps",
  juego: "play time on the floor",
  paseo: "out on a walk with the pram",
  despertar: "waking up in the morning",
  calmar: "soothing a crying or fussy baby",
}

const DIALECT_BLOCK: Record<string, string> = {
  rioplatense:
    'Vocabulary is Argentine/Rioplatense: frutilla not fresa, palta not aguacate, banana not plátano, pañal, chupete, mamadera, cochecito, remera. Peninsular words are errors ("vale", "guay", "coger", "ordenador", "zumo").',
  neutral:
    'Vocabulary is neutral Latin American: clear and widely understood (fresa, aguacate, biberón, carriola or cochecito, camiseta). Peninsular words are errors ("vale", "guay", "coger", "ordenador", "zumo").',
}

const OTHER: Record<string, string> = { rioplatense: "neutral", neutral: "rioplatense" }

interface AskRequest {
  query?: string
  /** "word" forces a single-word answer (a pack's add box); default lets the model decide. */
  want?: "auto" | "word"
  /** The sentence the word was met in (looking up a word from a chat bubble). */
  context?: string
  dialect?: "rioplatense" | "neutral"
  childName?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AskRequest
    const query = body.query?.trim()
    if (!query) return NextResponse.json({ error: "query is required" }, { status: 400 })
    const dialect = body.dialect === "neutral" ? "neutral" : "rioplatense"
    const other = OTHER[dialect]
    const forceWord = body.want === "word"
    const context = body.context?.trim().slice(0, 400)

    const system = `You answer "¿Cómo se dice…?" for a B1-level parent who is learning Spanish while raising a bilingual baby${body.childName ? ` (${body.childName})` : ""}. They typed (or said) what they want in English, Spanish, or a mix.

${DIALECT_BLOCK[dialect]}
Grammar is tú, always: never voseo (vos, tenés, querés, contame), never vosotros.
English glosses are British English (nappy, cot, pram, pushchair, dummy, jumper, trousers, nursery).

First decide "kind":
- "word" when they want ONE lexical item: a thing, an action, a quality, or a fixed expression ("pushchair", "teething", "averiguar", "hacer falta").${forceWord ? "\n  For this request kind MUST be \"word\"." : ""}
- "phrase" when they want something to SAY: a sentence, a request, a feeling, a reply ("he's got hiccups again", "can you watch him a second").

If the input is already Spanish (fully or partly), it is exactly what they want to learn: keep their word or construction, fix only spelling and missing accents (they type on a phone with no accent keys: "averigue" → "averigüé"), and for a phrase complete it minimally into one short natural sentence from daily life with a little one. NEVER swap in a synonym or a different construction ("enfrentar" stays "enfrentar"; "Me hace falta" → "Me hace falta dormir un poco más", never "Te extraño").

For kind "word":
- "spanish": the bare word with NO article ("rodilla", not "la rodilla"); verbs in the infinitive; adjectives masculine singular.
- "article": el, la, los or las for nouns ("agua" takes "el" with gender "f"); "" for anything else.
- "gender": "m", "f", or "invariable" (verbs, adjectives, adverbs, expressions).
- "example": one short sentence a parent would really say using it; "exampleGloss": its English.
For kind "phrase":
- "spanish": the one most natural way to say it, short enough to say while holding a baby.
- "moment": which daily moment it belongs to, one of ${Object.entries(MOMENTS)
      .map(([id, d]) => `"${id}" (${d})`)
      .join(", ")}, or null.
For both:
- "gloss": a clean British English gloss of YOUR Spanish (it may differ from the input if that was vague).
- "otherDialect": if speakers of ${other === "neutral" ? "neutral Latin American Spanish" : "Rioplatense (Argentine) Spanish"} would normally use a DIFFERENT word for the key item, that word (bare, no article), else null. Only for real vocabulary differences (frutilla/fresa, remera/camiseta, mamadera/biberón), never for spelling.

Respond with a JSON object: {"kind": "word"|"phrase", "spanish": "...", "gloss": "...", "article": "...", "gender": "...", "example": "...", "exampleGloss": "...", "moment": "...", "otherDialect": "..."}`

    const user = context
      ? `They met it in this sentence: "${context}". They want: ${query.slice(0, MAX_CHARS)}`
      : query.slice(0, MAX_CHARS)

    const response = await getOpenAI().chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    })
    const raw = response.choices[0]?.message?.content
    if (!raw) throw new Error("Empty response from ask model")
    const data = JSON.parse(raw) as Record<string, unknown>
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "")

    const spanish = str(data.spanish)
    if (!spanish) throw new Error("Answer missing")
    // Everything is narrowed to a closed vocabulary before it reaches the
    // client: the stores trust these fields.
    const kind = forceWord ? "word" : str(data.kind) === "word" ? "word" : "phrase"
    const article = ["el", "la", "los", "las"].includes(str(data.article).toLowerCase())
      ? str(data.article).toLowerCase()
      : ""
    const gender = (["m", "f", "invariable"] as const).includes(str(data.gender) as "m")
      ? (str(data.gender) as "m" | "f" | "invariable")
      : "invariable"
    const otherWord = str(data.otherDialect)
    const moment = str(data.moment) in MOMENTS ? str(data.moment) : undefined

    posthog?.capture({
      distinctId: "server",
      event: "llm_call",
      properties: {
        type: "ask",
        kind,
        model: MODEL,
        with_context: !!context,
        input_tokens: response.usage?.prompt_tokens ?? null,
        output_tokens: response.usage?.completion_tokens ?? null,
        total_tokens: response.usage?.total_tokens ?? null,
      },
    })

    return NextResponse.json(
      {
        answer: {
          kind,
          spanish,
          gloss: str(data.gloss) || query,
          ...(kind === "word"
            ? {
                article,
                gender,
                example: str(data.example) || undefined,
                exampleGloss: str(data.exampleGloss) || undefined,
              }
            : { moment }),
          otherDialect:
            otherWord && otherWord.toLowerCase() !== spanish.toLowerCase()
              ? { dialect: other, spanish: otherWord }
              : undefined,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    console.error("[/api/ask]", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
