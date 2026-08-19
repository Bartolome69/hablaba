---
name: voice-topic
description: Add or edit a conversation topic for voice mode (Charlar), including roleplay scenes. Use when the user wants a new thing to talk about in voice mode, says the partner only ever talks about one subject, asks for a scenario or roleplay (café, doctor, phone call), or wants to change what an existing topic covers or which grammar it targets.
---

# Add a voice-mode conversation topic

Topics are what a spoken session is *about*. They live in one shared file,
`lib/voice-topics.ts`, and feed both voice surfaces: Grow's `/grow/voice` and
the main app's `/app/charla`.

A topic is not just a subject label — **topic choice is grammar targeting**.
Asking someone to reminisce forces past tenses; asking their opinion forces the
subjunctive and conditional. A topic with no grammatical intent is a wasted
slot. Decide what a topic *makes the learner produce* before writing it.

## Before you start

1. Read `lib/voice-topics.ts` — the `VoiceTopic` interface and the existing
   entries. Match their voice and length; don't restructure the file.
2. Read the **Voice mode** section of `CLAUDE.md` and the voice section of
   `lib/criar/README.md` for the decisions you must not quietly reverse.
3. Have `lib/exercises/taxonomy.json` open — you need real topic ids for
   `practises`.

## Steps

1. **Decide the grammar intent first.** What should this conversation drag out
   of the learner? Pick the exercises-taxonomy ids for it. If the answer is
   "nothing in particular", either give the topic a grammatical angle or don't
   add it.

2. **Verify every `practises` id exists.** They must be exact ids from
   `lib/exercises/taxonomy.json` — never invent one, never guess the spelling
   (`comparatives`, not `comparison`). Grep the file to confirm.

   Also check whether each id has a content pack in
   `lib/exercises/content/*.json`. Ids with no pack still work as grouping
   keys, but a session review's "Practicar esto" link for them lands on the
   topic map instead of a quiz. That's acceptable — just don't build a topic
   whose *entire* grammatical point is an id with no practice content, and
   mention the gap to the user.

3. **Write the fields.**
   - `id` — kebab-case, stable (it's persisted on every session's seed
     context; renaming it orphans past sessions' labels). Roleplay ids are
     prefixed `rol-`.
   - `label` — the chip. Spanish, 1–3 words, fits a phone chip. Roleplay
     labels start `"Rol: "`.
   - `emoji` — one. Roleplay scenes use 🎭 so they're visually a set.
   - `blurb` — one short Spanish line under the picker, tú register.
   - `prompt` — **model-facing instructions, in English, imperative.** This is
     the biggest mistake to avoid: it is not user-facing copy. Tell the partner
     what to ask about, what to follow up on, and how to keep the learner
     talking. Say explicitly what NOT to drift into if that's a risk. 2–4
     sentences.
   - `practises` — the ids from step 2.
   - `requiresChild: true` — only if the topic is meaningless without a baby in
     context. This hides it from `/app/charla`, which has no child. Most topics
     should NOT set this.

4. **Roleplay only — write `personaPrompt`.** This replaces *who the partner
   is* for the scene. Rules:
   - State the character, the setting, and that the learner is the customer /
     patient / caller. End with "Stay in character for the whole scene."
   - The chip MUST be labelled `"Rol: …"` with 🎭. Slipping into a character is
     always the user's explicit choice — never a surprise swap of the partner
     they know.
   - Don't restate register, correction, or turn-length rules; those still
     apply to the character automatically (`buildVoiceInstructions` appends
     them below the persona).
   - Give the scene *beats* in `prompt` so it doesn't stall: a complication,
     something to decide, a way to extend if the learner finishes fast.

5. **Do not touch the persona or register.** The default partner (warm
   Argentine, tú, voice `marin`) is the same on every surface — an explicit
   product decision. Adding a topic must not edit
   `buildVoiceInstructions`'s persona branch, `VOICE_REGISTER`, or the register
   blocks in `lib/criar/prompts.ts`. If a request seems to need that, ask first.

6. **Verify.** `npx tsc --noEmit` (expect only the two pre-existing
   `app/manifest.ts` errors) and `npm run build`. Then confirm by reading, not
   by running: the chip row is horizontally scrollable, so a new topic doesn't
   break layout, but check the label is short enough to scan.

## Where the topic shows up

Adding to `voiceTopics` is enough — everything else reads the array:

- Both pickers (`components/voice/topic-picker.tsx`), with `requiresChild`
  filtering `/app/charla`.
- The chosen id is stored on `seedContext.topicId`, so history lists and
  transcript headers show the emoji and label automatically.
- `/api/voice/session` resolves it server-side via `getVoiceTopic` and injects
  `prompt` into the instructions.

## Checklist before you hand back

- [ ] Every `practises` id verified against `taxonomy.json`
- [ ] `prompt` is model-facing English imperative, not user-facing copy
- [ ] `label`/`blurb` are Spanish, tú register, chip-length
- [ ] Roleplay: `"Rol: "` label + 🎭 + `personaPrompt` ending in stay-in-character
- [ ] `requiresChild` set only if genuinely baby-dependent
- [ ] Persona, register and correction blocks untouched
- [ ] `tsc` + `build` clean
- [ ] Told the user which new topics have no exercise content behind their tags
