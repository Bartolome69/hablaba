# App refresh: plan (Phase 0)

*November 2026. Status: **approved, with the decisions below.** Phases 1 to 3 shipped (PRs #50, #51, and the Phase 3 PR); Phase 4 is next.*

Built on the quick-wins batch, which has landed (PR #47, QW1 to QW8). This plan
assumes what that batch shipped:
- "¿Cómo se dice…?" is first on Frases, and saving is optional
  (`lookupCapture` / `saveCapture`).
- Words default to Tus palabras.
- The results-screen bridge is the green block.
- The contrast tokens are fixed and there's a 12px minimum.
- There is no streak.
- Spanish chrome labels in Ajustes and Frases por situación.
- Práctica sorts weakest first.

---

## 1. Map of the current code

| Area | Where | What it does today |
| --- | --- | --- |
| Tabs and nav | `app/app/layout.tsx`, `components/bottom-nav.tsx` | Five tabs. The nav hides on `/app/charla/` (threads, and Historial too, since it matches the prefix). Pages pad `pb-32` to clear it. |
| Hoy | `app/app/today/page.tsx`, `components/home/app-header.tsx` | A green resume/start hero, "Elegir otro tema", two phrases (practicando, then nueva), a "Repasá tus palabras" row when words are due, and a Tu semana row. Settings disc in the header. |
| Ajustes | `components/settings-sheet.tsx`, `lib/profile/store.ts` | `profile` record: dialect (rioplatense, neutral), correctionLevel (mucho, normal, poco), child {name, birthdate}. `describeAge()` already turns a birthdate into "6 months". |
| "How do I say" | `components/phrases/capture-card.tsx`, `lib/phrases/pack.ts` (`lookupCapture`, `saveCapture`), `POST /api/phrases/generate` (capture mode) | English or Spanish in, one natural phrase out, plus a moment classification. Spanish input is kept as the learner's own construction. |
| Add a word | `components/vocab/add-word-card.tsx`, `lib/vocab/add.ts` (`addOwnWord`), `POST /api/vocab/translate` | One word in, Spanish with article, gender and an example out. Stored as `vocab_words` (source `propia`). Lives at the bottom of each pack. |
| Phrase library | `lib/phrases/store.ts` (`phrases`), `types.ts`, `starter.ts` (84 read-only starters, 7 moments), `pack.ts` | Moments: despertar, comida, juego, paseo, baño, calmar, dormir. State is nueva → practicando (`markSeeded`) → usada (`markUsedByText`). |
| Routines | `lib/routines.ts` | 15 routines × 12 phrases in 4 categories (Con el bebé, Charla, Café, Para moverse). Separate from the moments; this is the second phrase taxonomy. |
| Words | `lib/vocab/store.ts` (`vocab_words`, `vocab_hidden`), `catalog.ts`, `schedule.ts`, `content/*.json` | 11 packs (243 words) plus Tus palabras. Catalogue words are virtual until first review. Leitner boxes `[0, 1, 3, 7, 16, 35]` days. `buildReviewDeck()` covers due words across all packs. |
| Flashcards | `components/vocab/vocab-deck.tsx` | Inline (not an overlay): flip, "Otra vez" requeues, "Lo sabía" climbs a box. |
| Grammar | `lib/exercises/content.ts`, `taxonomy.json` (27 topics), `content/*.json`, `store.ts` (`exercises_attempts`, `topicMastery`), `grade.ts` | `Quiz` is a private function inside `components/exercises/exercises-app.tsx`, rendered as a fixed `z-50` overlay. |
| Conversations | `lib/conversations/store.ts` (`conversations`, `conversation_turns`, `conversation_observations`), `use-conversation.ts` (text), `persistence.ts` (voice) | One thread, with turns of `modality: text \| voice`. |
| Thread screen | `app/app/charla/[id]/page.tsx`, `components/chat/chat-bubble.tsx`, `components/conversations/conversation-transcript.tsx` | **Tapping a bubble toggles the whole-turn translation** (`/api/translate`). There is no per-word interaction. |
| Seeding | `getConversationSeedPhrases()` → `VoiceSeedContext.packPhrases` / `captureLessons` → `lib/voice/prompts.ts` | **Voice only.** `/api/chat` receives no seed phrases, so text threads are never seeded, and `/api/analyze` never fires `target_phrase_used` for typed turns. |
| Analysis | `lib/conversations/analysis.ts`, `POST /api/analyze` | Taxonomy-tagged observations with a `turnId`. Calls `markUsedByText` for `target_phrase_used`. Cached via `analyzedAt`. |
| Tu semana | `app/app/semana/page.tsx`, `lib/conversations/weekly.ts`, `POST /api/analyze/weekly` | Stats (now `activeDays`), patterns grouped by tag, and celebrations (seeded phrases used), which are already rendered. |
| Voice | `lib/voice/*`, `components/voice/*` | `use-wake-lock.ts` **already requests a screen wake lock** while a session is live or paused, and re-acquires it on visibilitychange. `platform.ts` handles the iOS/Android forks. The iOS path ends the session when audio is suspended. |
| Voice topics | `lib/voice-topics.ts`, `lib/data.ts` | 12 curated topics (with `requiresChild`) plus 14 subject cards, and "Con tu peque" (`parent-child`, Elena plays the child). |
| Transcription | `POST /api/transcribe` | It exists, but **no client calls it today**. There is no recorder hook. |
| Sound | `lib/exercises/sound.ts` | `playCorrect` / `playFinish` chimes. |
| Validator | `scripts/validate-content.mjs` | **Grammar packs only:** shape, taxonomy ids and duplicates. It does not check vocab packs, routines or starters, and has **no tú-rule check** (the runtime guard is `lib/voseo.ts`, used on corrections). |
| Tooling | `package.json` | No test framework. `npm run lint` fails before running because there is no ESLint config in the repo. Checks today are `npx tsc --noEmit`, `npm run build` and `npm run validate:content`, plus Playwright scripts run ad hoc. |

---

## 2. Phases

### Phase 1: global "¿Cómo se dice?" sheet (jobs 1 to 3)

**Screens.** Every tab gets a bar; there's a new sheet; the Frases capture box and the pack add box change.

**New files**
- `components/ask/ask-bar.tsx`: a thumb-height bar above the bottom nav, rendered from `app/app/layout.tsx` next to `BottomNav`. It follows the nav's `HIDE_ON` rule and also hides while an *immersive* session is on.
- `components/ask/ask-sheet.tsx`: a bottom sheet (`components/ui/sheet`, as Ajustes uses), with a text field, hold-to-speak, the answer, and save actions.
- `components/ask/ask-answer.tsx`: the answer card, shared by the sheet and the inline boxes.
- `lib/ask/use-ask.ts`: one hook for lookup, save-as-word and save-as-phrase. The inline Frases box, the inline pack box and the sheet all use it.
- `lib/ui/immersive.ts`: a tiny context (`useImmersive(active)`) that Quiz, VocabDeck, the Repasar session and voice mode set. The bar and the nav read it. VocabDeck is inline today, so the nav currently stays visible during flashcards.
- `hooks/use-recorder.ts`: MediaRecorder → `POST /api/transcribe` (`language=auto`). Hold to talk, release to send. Mic permission copy reuses `micPermissionHelp()`.

**Modified files**
- `components/phrases/capture-card.tsx` and `components/vocab/add-word-card.tsx` become thin wrappers over `use-ask` and `ask-answer`. The pack version keeps its pack as the word target.
- Pages that pad `pb-32` move to one shared bottom-inset utility that accounts for the bar.

**AI route.** A new `POST /api/ask` returns:

```
{ kind: "word" | "phrase", spanish, gloss (en-GB), article?, gender?, example?, exampleGloss?, otherDialect?: { dialect, spanish }, moment? }
```

It is one call with one prompt that combines the two existing rules:
- From `/api/phrases/generate` capture mode: keep the learner's own Spanish construction, never a synonym swap.
- From `/api/vocab/translate`: article and gender as fields.

The prompt adds the `otherDialect` gloss (where Rioplatense and neutral differ, e.g. *remera* / *camiseta*) and en-GB glosses. The old routes stay until their callers have moved, then retire. Risk: one prompt doing both jobs can blur them. Mitigation: `kind` is decided first (a single lexical item vs anything longer), and the existing prompt rules are kept verbatim.

**Saving**

| Action | What it does | Table | Changes? |
| --- | --- | --- | --- |
| Guardar como palabra | `addWord({ set: target ?? "propias", source: "propia" })` | `vocab_words` | None. It joins `buildReviewDeck` on the ladder. |
| Guardar como frase | `saveCapture()`, `source: captured` | `phrases` | None. Appears in Recientes and is eligible for seeding. |
| Close | Saves nothing | | |

**Risks**
- The sheet over the keyboard on Android. Mitigation: the same `interactiveWidget: resizes-content` approach as the quiz.
- Hold-to-speak on iOS needs a user gesture to start MediaRecorder; the press itself provides it.
- The bar must never cover a page's last row. Mitigation: the shared inset utility.

### Phase 2: Hoy rebuilt on the five jobs

**Screen.** `app/app/today/page.tsx` is rewritten. New components go in `components/home/`:

| Component | Job | What it shows |
| --- | --- | --- |
| `chat-hero.tsx` | 4 | The one green block: resume the latest thread or start one, with the first-run copy from QW4. "Elegir otro tema" becomes a real secondary button (raised clay, 44px). |
| `repasar-card.tsx` | 5 | For example "6 tarjetas · verbos reflexivos", from the Phase 3 plan builder. When nothing is due, "Estás al día" with no nag. |
| `week-line.tsx` | Loop | One line naming this week's top pattern (`computeWeeklyData().patterns[0]`, taxonomy Spanish label, sentence case), linking to Tu semana. |
| `for-today.tsx` | Flavour | "Para hoy con Teo": two or three phrases by time of day (despertar in the morning, comida at midday, paseo/juego in the afternoon, baño/dormir in the evening). Age band is added in Phase 5. |

There are no store changes and no AI calls. The weekly narrative isn't fetched on Hoy; the pattern list is local.

**Risk.** The first four items must fit on 390 × 844 with the bar and the nav. The hero needs to shrink about 20%, so the subtitle moves into the button.

### Phase 3: one Repasar session

**New files**
- Route `app/app/repasar/page.tsx`: full-screen and immersive (hides the nav and the bar).
- `lib/review/session.ts`: `buildRepasarPlan(now)` returns `{ cards, questions, phrase }`.
- `components/review/repasar-session.tsx`: steps through the plan and ends with a calm summary (the same `ResultsSummary` tone as QW3) and the "Guardar las frases" bridge when a grammar topic has practice phrases.
- `components/review/phrase-recall.tsx`: shows the English; "¿Cómo lo dirías?"; flip to the Spanish; self-graded "Me salió" / "Otra vez".

**Extractions** (same behaviour, now reusable)
- `Quiz` moves out of `exercises-app.tsx` into `components/exercises/quiz.tsx`, gaining an `onComplete(results)` and an `embedded` prop.
- `VocabDeck` gains an `onDone` prop.

**The mix** (target about five minutes, see question 2)

| Part | Source | Rough time |
| --- | --- | --- |
| Up to 8 due cards | `buildReviewDeck(8)`. If none are due, the part is skipped (no new words forced in). | ~10s each |
| 3 grammar questions | This week's top pattern tag. If none, the weakest topic (`topicMastery`), client-gradable only. | ~30s each |
| 1 phrase recall | The oldest-touched `practicando` phrase, else `nueva`. | |

**Stores.** Results go through the existing writers: `recordReview` / `recordRelearned`, `recordAttempt`, and for phrases `updatePhrase({ timesPracticed, lastTouchedAt })`. There's an optional new table, `review_sessions` (id, startedAt, finishedAt, cardCount, questionCount, phraseId), only if you want history; it maps 1:1 to SQL. I recommend skipping it for now.

**Empty state.** When nothing is due and there's no pattern and no phrase: "Estás al día". The card on Hoy says so; the route is still reachable.

**Risk.** Extracting `Quiz` touches the most-used screen. Mitigation: a pure move first, verified against the existing quiz flow, before any new props.

### Phase 4: vocabulary from conversation, and a visible loop

**Interaction (question 5).** Tapping a bubble already toggles the whole-turn translation. I propose **long-press on a word** (the same 450ms `useLongPress` as rows) to open the ask sheet, pre-filled with the word and its sentence as context, with "Guardar como palabra" first. Tap keeps translating. A one-time hint ("Mantené apretada una palabra para guardarla") appears under the first assistant bubble. Bubbles are tokenised into word spans only after streaming ends.

**Seeded phrase used**
- After analysis, a `target_phrase_used` observation's `turnId` places a quiet inline note under that turn: "Te salió natural: “…”".
- It's rendered by `conversation-transcript.tsx` from observations, so there's no new turn row.
- It's never shown while voice is live: notes render only when `voice.state === "idle"`.
- Tu semana already lists these as celebrations. It gets a heading ("Te salieron solas") and the count moves into the narrative facts.

**Text threads get seeded too (a gap found during inspection)**
- `/api/chat` gains `seedPhrases` and `seedWords` and adds them to its system prompt, using the same block shape as `prompts.ts`.
- `createConversation` stores a `seedContext` for text threads, so `/api/analyze` can detect use in typed turns.

**Words into conversation**
- New `getConversationSeedWords(cap = 6)` in `lib/vocab/store.ts`: words reviewed in the last 7 days, boxes 1 to 3.
- `VoiceSeedContext` gains `seedWords: { spanish, english }[]`.
- `prompts.ts` adds them to the THIS WEEK'S MATERIAL block.
- Schema: one optional field on the existing `seedContext` JSON column. No new table.

**Risks**
- Long-press inside a scrolling transcript. Mitigation: the 8px move tolerance in `useLongPress`.
- Seeding text chat lengthens its prompt. Mitigation: cap at 8 phrases and 6 words.

### Phase 5: age-aware parent content and one phrase taxonomy

**Age band**
- `lib/profile/age.ts`: `ageBand(birthdate)` returns `0-6m | 6-12m | 12-18m | 18-36m | 3y+ | unknown`. It is derived, never stored, like `describeAge`.
- Content gains an optional `ages?: AgeBand[]` (or `minMonths` / `maxMonths`) on:
  - starters and routines
  - voice topics (in place of the `requiresChild` boolean)
  - `parentChildThemes`
- Gating is a query filter: ordered by fit and hidden only when clearly toddler-only (jardín roleplay, "Con tu peque", sandpit lines) until about 18 months. With no birthdate, today's behaviour is unchanged.

**One phrase taxonomy (question 3)**
- The 7 moments and the 15 routines become **one set of moments**. Each moment holds built-in phrases (today's starters plus the routine phrases for it) and the learner's own phrases.
- Proposed moments: despertar, cambiar el pañal, comida, juego, paseo, baño, calmar, dormir.
- The adult situations (saludos, café, panadería, taxi, preguntar el camino, el tiempo, la plaza con otros padres) sit in their own section below, "Para ti".
- Bath appears once.
- `lib/routines.ts` and `lib/phrases/starter.ts` merge into `lib/phrases/moments.ts`, with English names kept for the `/frases/*` SEO pages, whose URLs stay.
- No store migration is needed: phrases already carry `moment`. Two new moment ids (`panal`, and splitting `juego` if wanted) widen the closed vocabulary that `/api/phrases/generate` classifies into.

**New content (drafts, flagged for your review)**

| Area | Draft phrases |
| --- | --- |
| Weaning | papilla, la cuchara, "abre grande" |
| Teething | "te duelen los dientitos", el mordillo |
| Sleep at 6 to 12 months | naps, night feeds |
| Tummy time | |
| Babbling back | "¿ah, sí? ¿y qué más?" |

There's also a "Bebé" word pack addition (babero, sonajero, mordillo, cuna de viaje).

**Validator.** It extends to vocab packs, routines/moments and starters (shape and duplicates), plus a **tú-rule check** using the `lib/voseo.ts` blocklist (mirrored in the .mjs, as the schema already is).

**Prompts.** Elena's prompts get the age band: "a 6-month-old: naps, feeds, babbling", not the playground. `describeAge` already reaches voice. `/api/chat` gains it too.

**Risk.** The taxonomy merge touches Frases, the pills, the SEO pages and `/api/phrases/generate`. It's the largest change in the plan, so it ships after the age gating, as its own step.

### Phase 6: voice on iOS

The wake lock already exists, so this phase is smaller than briefed.

**Pocket view.** A new `components/voice/pocket-view.tsx`: a dark full-screen view while voice is live. It has large **Pausa** and **Terminar** (≥56px, labelled) and a caption line. It's entered automatically when the wake lock is held on iOS, and by a "Bolsillo" button elsewhere.

**iOS messaging**
- `platform.ts` gains `wakeLockSupported()`.
- On iOS with support, the thread says plainly: "En iPhone la pantalla tiene que quedar prendida. La dejamos prendida por vos."
- Without support (iOS < 16.4), the honest fallback: the session pauses when the screen locks, as it does today.

**Corrections.** Still held back during voice. With "Corrígeme: mucho", the prompt's `mucho` block already recasts inside her reply, so nothing new is needed beyond confirming it.

**Testing.** In the installed PWA on an iPhone (iOS 17/18) and an Android phone: a 10-minute session with the screen on, plus lock and unlock behaviour. I can't run real devices from here, so this needs you, and I'll write the checklist.

**Risk.** iOS can still kill audio when another app takes the audio session (a call, Maps). That lands as the existing connection-lost state.

### Phase 7: onboarding

**New files.** `app/app/bienvenida/page.tsx` and `components/onboarding/*`.

**Steps**
1. Child's name and birthdate (skippable).
2. Dialect (Rioplatense or neutral, with one example word each).
3. If approved, a rough level (question 4).

Then land on Hoy, which now shows the five jobs. It isn't a chat.

**Store.** `profile` gains `onboardedAt?: string`. Old devices with any activity are treated as onboarded. Everything stays editable in Ajustes. No streak and no score.

### Phase 8 (later, only if asked): night mode

- A warm dark palette mirroring the tokens, as a `:root[data-theme=night]` set. Contrast is re-audited with the same script as QW5.
- Silent by default: the chime and audio buttons need a tap.
- Swipe on flashcards, and an optional auto-on by time of day.

---

## 3. Wireframes (390 × 844)

### Hoy

```
┌──────────────────────────────────────┐
│ Hoy                              (⚙) │
│ Un rato de español, cuando puedas    │
│                                      │
│ ┌──────────────── GREEN ───────────┐ │  job 4
│ │ 🎙 SEGUÍ TU CHARLA               │ │
│ │ Tu día con Teo                   │ │
│ │ [ Continuar → ]                  │ │
│ └──────────────────────────────────┘ │
│ [ Elegir otro tema ]                 │
│                                      │
│ ┌ Repasar ─────────────────────────┐ │  job 5
│ │ 6 tarjetas · verbos reflexivos  ›│ │
│ └──────────────────────────────────┘ │
│ Esta semana: pretérito o imperfecto ›│  loop
│                                      │
│ Para hoy con Teo                     │  flavour
│  ¿Tienes hambre, mi amor?        🔊  │
│  Vamos a cambiar el pañal.       🔊  │
├──────────────────────────────────────┤
│ ( 🔍 ¿Cómo se dice…?             🎙 )│  jobs 1–3 (global bar)
├──────────────────────────────────────┤
│  Hoy  Charlar  Frases  Palabras  Práctica │
└──────────────────────────────────────┘
```

### Ask sheet (after an answer)

```
┌──────────────────────────────────────┐
│ ¿Cómo se dice…?                   ✕  │
│ ( teething ring              )(🎙)   │
│                                      │
│  el mordillo                     🔊  │  serif, article included
│  teething ring                       │  en-GB gloss
│  En neutro: el anillo de dentición   │  other-dialect gloss
│  “Toma tu mordillo, mi amor.”        │  example
│                                      │
│ ┌───────── GREEN ──────────────────┐ │
│ │      Guardar como palabra        │ │  → Tus palabras, review ladder
│ └──────────────────────────────────┘ │
│ [ Guardar la frase de ejemplo ]      │  → Frases (Recientes)
│              Cerrar                  │
└──────────────────────────────────────┘
```

For a phrase result, the green action is "Guardar como frase" and there's no word action.

---

## 4. Decisions (answered November 2026)

| # | Question | Decision |
| --- | --- | --- |
| 1 | Chrome register | **Tú.** The UI chrome moves from vos to tú, done as its own change before Phase 1. CLAUDE.md and DESIGN.md are updated to match. |
| 2 | Repasar length | **Top up with new words** when fewer than 8 cards are due, up to 8 cards, then 3 grammar questions and 1 phrase. |
| 3 | 0–12 month content | **No native-speaker review.** All five areas are drafted and flagged for Bart's review. |
| 4 | Onboarding level question | **No.** Onboarding is child, then dialect. |
| 5 | Word lookup in chat | **Long-press a word.** Tap stays translate. |
| 6 | Ask bar on Hoy | **One global bar** above the nav on every tab, Hoy included; no second copy. |
| 7 | Phrase taxonomy | **Merge** into one set of moments, plus a "Para ti" section for adult situations. `/frases/*` URLs stay. |
| 8 | `review_sessions` table | **Skip for now.** |
| 9 | Lint | **Add the ESLint config** as a small separate commit. |

The original questions are kept below for context.

## 4a. Open questions as asked

1. **Chrome register: vos to tú?** The review recommends moving the UI chrome to tú so learners aren't reading vos all day. Size: a grep for the common vos forms ("Tocá", "Probá", "Escribí", "Elegí", "Guardá", "Repasá", "Contame", "podés", "sabés", "Vos elegís"…) finds about 35 strings in 13 files; with forms the grep misses, expect 40 to 60 strings across about 15 files. It's mechanical but needs a full read-through, because some strings sit on the line between chrome and taught Spanish (Elena's topic blurbs such as "Contame algo que pasó" and "Vos elegís el tema"). About two hours plus review. CLAUDE.md and DESIGN.md currently document the split as deliberate, so this reverses a recorded decision.
2. **Repasar mix and length.** I propose up to 8 due cards, 3 grammar questions and 1 phrase recall, about 5 minutes. Should new words top it up when fewer than 8 are due, or should it stay "due only" so it ends fast?
3. **Content for 0 to 12 months.** Which first: weaning, teething, sleep, tummy time, babbling back? I'd draft all five at about 12 phrases each, plus 10 to 15 words. Should a native Rioplatense speaker review them before they ship?
4. **Onboarding level question.** Do you want "¿Cómo va tu español?" (empezando / me defiendo / B1+)? It would only set the starting quiz difficulty and Elena's pace. My lean is no for now: everything adapts already, and it's one more step.
5. **Word lookup in chat: long-press, or tap after translating?** I recommend long-press (tap stays translate).
6. **The ask bar on Hoy.** One global bar above the nav (my recommendation, thumb zone), or a second copy at the top of Hoy as item 1? Doing both shows the same control twice.
7. **The phrase taxonomy merge (Phase 5).** Are the moment list and the separate "Para ti" adult section right? Should `/frases/*` SEO pages keep their current routine URLs (my recommendation) even though the app regroups?
8. **`review_sessions` table.** Skip for now (my recommendation), or keep a history of Repasar sessions?
9. **Lint.** `npm run lint` has no ESLint config. Should I add the Next.js flat config (a small separate commit) so "run lint" means something in later phases?

---

## 5. Test plan

The repo has no test framework, and this plan doesn't add one. Each phase runs:
- `npx tsc --noEmit` and `npm run build`
- `npm run validate:content` when content changes
- `npm run lint` once question 9 is settled

It then runs a Playwright script at 390 × 844 (en-GB, seeded device, AI routes mocked) in the style of the QW pass. That script includes the **contrast and minimum-size audit**, which walks every visible text node and fails anything under 4.5:1 or 12px. Screenshots go in the phase report. If you'd like, the scripts can live in `scripts/smoke/` so they're repeatable; they'd need no new dependency.

| Phase | Checks |
| --- | --- |
| 1 | From each of the five tabs, open the sheet in one tap. Type a word: the answer shows its article, and "Guardar como palabra" writes `vocab_words` with `set: propias`, box 0, due now (verified in localStorage), and it appears in `buildReviewDeck`. Type a phrase: "Guardar como frase" lands in Recientes. Close saves nothing. The bar is hidden in a quiz, a flashcard deck and voice mode. Hold-to-speak runs with a mocked `/api/transcribe`. The pack box still targets its pack. |
| 2 | Each job starts from Hoy in one tap. Exactly one green block (same count method as QW). The first four items sit above the bar on 390 × 844. First run shows "Empezá una charla" and "Estás al día". |
| 3 | Seed due words, a weekly pattern and a practicando phrase; the session shows 8 + 3 + 1. A miss requeues a card. The stores update (box changes, attempt rows, phrase timesPracticed). The end shows no score numeral. With nothing due, "Estás al día". Quiz regression: the Práctica flow is unchanged after the extraction. |
| 4 | Long-press a word in an assistant bubble: the sheet opens pre-filled; save, then the word is in review. A mocked `/api/analyze` returning `target_phrase_used` with a `turnId` shows the inline note under that turn, but not while voice is live. Seeded words appear in the session request body (mocked mint) and in `/api/chat`'s request. |
| 5 | 6-month-old profile: no toddler-only item leads on Hoy, Frases, Charlar starters or Elena's prompt. No birthdate: same output as today (snapshot the lists before and after). Bath appears once. The validator passes and fails a planted voseo line. |
| 6 | Unit-level: `wakeLockSupported()` branches. Real devices (by you, from my checklist): a 10-minute session on iPhone with the screen on doesn't pause; lock behaviour is reported; controls are ≥56px; the fallback copy shows where the wake lock is unsupported. |
| 7 | Fresh device: onboarding shows; each step skips; values land in `profile` and show in Ajustes. An existing device with activity skips onboarding. |
