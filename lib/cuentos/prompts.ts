// Prompts for the Cuentos routes. Server-side only (imported by app/api/cuentos/*).

import type { SpanishDialect } from "@/lib/profile/store"

// The dialect line is the only part filled in. Vocabulary only: the grammar
// is tú for both (CLAUDE.md: never let the dialect name become a grammar cue).
const DIALECT_LINE: Record<SpanishDialect, string> = {
  rioplatense: "Rioplatense: Argentine everyday words such as frutilla, mamadera, upa",
  neutral: "neutral: widely understood Latin American words",
}

/**
 * The translation system prompt, verbatim from the Cuentos brief, with the
 * chosen dialect filled into its {…|…} slot. Change only if tests need it.
 */
export function translationSystemPrompt(dialect: SpanishDialect): string {
  return `You are translating an English picture book page into Spanish so a parent, who is still learning Spanish, can read it aloud to a young child (from baby to about 6).

Rules:
- Use tú grammar only. Never use vos or vosotros.
- Vocabulary follows the chosen dialect: ${DIALECT_LINE[dialect]}. Avoid words that are vulgar or odd in that dialect.
- Write for a child's ear: short, spoken sentences, a natural bedtime rhythm, words a B1 adult can pronounce confidently.
- Preserve rhyme, metre and refrains where the English has them. Prefer a close natural rhyme over a literal line that no longer sings. Keep repeated phrases identical across the page.
- Keep character names unless a well-known official Spanish name exists in the source text itself; do not invent new names.
- Do not add moralising, explanations or anything that is not on the page.
- Skip illustrator credits, ISBNs and publisher text if they slipped through.
- Return only the Spanish page text, in reading order, with line breaks comfortable to read aloud. If a notable rhyme could not be kept, say so briefly in English in \`notes\`, not in the page text.`
}

/** The response shape, kept apart from the verbatim rules above. */
export const TRANSLATION_FORMAT =
  'Respond with a JSON object: {"spanish": "<the Spanish page text, with \\n line breaks>", "notes": "<short English note, or empty string>"}. Write notes in British English.'

/** Sent as a follow-up when the first answer slipped into vos or vosotros. */
export const TU_RETRY =
  "That used vos or vosotros forms. Rewrite the same Spanish with tú grammar only (tú tienes, mira, ven, ustedes for plural). Change nothing else. Same JSON shape."

export const OCR_SYSTEM_PROMPT = `Extract the story text from this photo of a picture-book page or two-page spread.
- Reading order: left page before right page; top to bottom within a page.
- Include text set over illustrations, speech bubbles and sound words that are part of the story.
- Ignore page numbers, logos, barcodes, prices, publisher marks and illustrator credits unless they are part of the story.
- Keep the author's line breaks where a line clearly ends (verse). Join a sentence that only wraps because the text block is narrow.
- Copy the words exactly as printed. Do not correct, translate or summarise.
Respond with a JSON object: {"text": "<all the story text>", "blocks": [{"text": "<one block of text, in reading order>"}]}. If there is no readable story text, respond {"text": "", "blocks": []}.`
