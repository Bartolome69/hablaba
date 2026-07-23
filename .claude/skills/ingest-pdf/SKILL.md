---
name: ingest-pdf
description: Turn a teacher's Spanish grammar PDF into an Exercises content pack. Use when the user drops a PDF in content/sources/ and wants to ingest it, generate practice questions from a handout, or add grammar exercise content. Reads the PDF, maps it onto the canonical taxonomy, generates a question bank, validates, and presents a diff to review.
---

# Ingest a grammar PDF into an Exercises content pack

Turns one teacher PDF (`content/sources/*.pdf`) into one validated JSON content
pack (`lib/exercises/content/*.json`). The generated pack is the durable
artifact; it's reviewed as a git diff before committing. Read
`lib/exercises/README.md` first if you haven't — it explains the data model.

## Before you start

1. Read `lib/exercises/README.md`, `lib/exercises/schema.ts` (the canonical
   shape), and `lib/exercises/taxonomy.json` (the fixed topic list).
2. Identify the target PDF. If the user didn't name one, list
   `content/sources/*.pdf` and ask which one (or confirm if there's exactly one
   new/unpacked file).

## Steps

1. **Read the PDF.** Use the Read tool on the PDF path (it handles scanned pages
   too). If it's over 10 pages, read it in page ranges.

2. **Map onto the taxonomy — do not invent topics.** Decide which existing
   `taxonomy.json` topic ids the PDF covers. If the PDF clearly teaches a grammar
   point with no matching topic, STOP and ask the user whether to add it to
   `taxonomy.json` first — don't silently drop content or coin a topic id.

3. **Extract lessons, in the teacher's framing.** For each covered topic write a
   `summary` (the rule as this teacher explains it — keep their emphasis and any
   memory tricks) and 3–5 `examples` (spanish + english, optional note) drawn
   from or faithful to the PDF. This is what gets shown on a wrong answer, so it
   must be correct and grounded in the source.

4. **Generate the question bank.** Aim for ~8–15 items per covered topic,
   spanning the exercise types in ascending difficulty:
   - `choice` and `cloze` for the fundamentals (difficulty 1–2),
   - `conjugation` where the topic is morphological (tenses, commands),
   - `transform` and `open` for production (difficulty 3).
   Every item needs a grounded `explanation`. Build `choice` distractors from the
   *classic confusion* for that topic (e.g. the wrong preposition, the indicative
   where the subjunctive belongs) — that's what makes a miss diagnostic.
   Write blanks as `___`. Keep Spanish register neutral B1 unless the PDF is
   dialect-specific.

5. **Write the pack** to `lib/exercises/content/<slug>.json` where `<slug>`
   describes the source (e.g. `prof-marta-por-para`). Fill `id`, `title`,
   `teacher`, `date`, `description`, `topicIds`, `lessons`, `items`. Set
   `ingestedAt` to today (ask the user or use the known current date — do not
   guess). Match `lib/exercises/content/por-vs-para-example.json` exactly for
   shape.

6. **Validate.** Run `npm run validate:content`. Fix any reported issues and
   re-run until it passes. A pack that fails validation is not done.

7. **Hand off for review.** Show the user a summary (topics covered, item count
   per topic, a couple of sample items) and tell them to review the diff before
   committing — call out that distractor quality and example accuracy are the
   things worth a human eye. Do not commit unless asked.

## Rules

- Never invent taxonomy topics — map onto the fixed list or ask.
- Never retain or commit the PDF's content verbatim beyond short example
  sentences; the pack is a derived study aid, not a copy of the handout.
- One PDF → one pack file. If a PDF covers several topics, that's fine — they all
  go in the one source pack under `topicIds`/`lessons`/`items`.
- The example pack (`por-vs-para-example.json`) is a reference; leave it in place
  unless the user asks to remove it.
