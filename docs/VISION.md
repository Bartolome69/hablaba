# Hablaba: the app and the vision

*November 2026. What Hablaba is, who it's for, how it works today, and where it's going.*

---

## In one paragraph

Hablaba is a Spanish companion for parents raising a bilingual child who are still
learning Spanish themselves. It isn't a course and it isn't an app for the baby. It
gives the parent three things: a warm conversation partner to practise with (typed,
or out loud on a walk with the pram), the exact phrases and words for the moments
their day is made of (the bath, the nappy change, bedtime, the playground), and short
grammar practice aimed at the mistakes they actually make. The goal is a parent who
reaches for Spanish without thinking during ordinary routines, not a parent who
finishes lessons.

---

## Who it's for

The core user is a parent of a baby or toddler, usually around B1 level. They can
read a menu and get through small talk, but they freeze in a real conversation and
default back to English at home. Often their partner or family are native speakers
and they're trying to catch up. In practice:

- **They have one hand free.** The other is holding a child, a bottle or a pram.
- **They have five minutes, not fifty.** Practice happens in the gaps: nap time, the
  walk to nursery, after bedtime.
- **They need confidence and vocabulary, not grammar tables.** What stops them is not
  knowing the word for *bib*, or not being sure whether it's *se despertó* or
  *despertó*, at the exact moment they need it.
- **They feel guilty already.** Anything that nags, scores or shames them gets
  deleted.

The first real user is the founder: a dad raising a son, Teo, in an Argentine
family. Much of the product has been shaped by him using it daily and saying what
felt wrong.

### Positioning (decided November 2026)

Hablaba is **marketed only to bilingual parents**, and the app keeps every general
learning feature as **the parent's own practice**. The parent is a Spanish learner in
their own right: they want the nursery phrases *and* the Spanish to talk with the
abuela, the pediatrician and the other parents at the park. So:

- **The website** speaks to parents only. The audience pages are parents, toddlers,
  new parents and parents at B1. The travel and expat pages were removed and
  redirect to `/for/parents`.
- **The app** keeps everything: open conversation topics (work, films, travel), the
  adult routines (café, taxi, directions), all grammar topics and every word pack.
  Nothing is cut for being "not about the baby"; it's framed as growing your own
  Spanish alongside your kid.
- **Why:** general Spanish apps are a crowded market with big budgets. "What do I
  say to my kid at bath time, right now" is a problem nobody else solves, and it
  makes the copy specific.

---

## The idea underneath it

Children acquire a language through massive repetition of words attached to real
situations, said by people they love. A baby doesn't need a curriculum. They need to
hear "vamos a cambiar el pañal" at every nappy change for months.

So the parent doesn't need to be fluent. They need:

1. **The right words for the right moments.** Not a vocabulary list, but what you
   say *while* you're doing the thing.
2. **Repetition.** The same phrases, every time, until they come out on their own.
3. **Enough confidence to actually say them.** That comes from speaking, and from
   being corrected kindly rather than marked wrong.

There is no "one parent, one language" rule here. Hablaba supports a looser,
whole-home approach: Spanish woven into the routines, as much as the parent can
manage, getting better over time.

---

## The loop

Everything in the app is a slice of one loop:

> **Speak → get your patterns back → practise the exact gap → speak again.**

1. **Speak.** The parent talks with Elena, the app's conversation partner, typing at
   the kitchen table or hands-free on a walk. Both go into the same conversation
   thread.
2. **Patterns come back.** After a spoken session, the conversation is analysed.
   Each mistake is tagged with a grammar topic (for example *preterite vs imperfect*
   or *reflexive verbs*). "Tu semana", the weekly report, groups those tags into the
   patterns that keep recurring.
3. **Practise the gap.** Every pattern links straight to the quiz for that rule in
   Práctica.
4. **Speak again.** Finishing a quiz offers to save conversation-ready phrases that
   use the rule. Those phrases are quietly seeded into the next conversation, so
   Elena uses them herself and makes room for the parent to say them. When the
   parent does, the analysis notices, and the phrase moves from *nueva* to
   *practicando* to *usada*.

The phrase library and the word packs feed the same loop from the other side: what
the parent captures or saves becomes material for the next conversation.

---

## The app, screen by screen

The app has five tabs: **Hoy, Charlar, Frases, Palabras, Práctica.**

### Hoy (Today)
The daily landing screen. One big green card picks up the last conversation (or
starts one). Below it are a couple of phrases to use today, how many flashcards are
waiting, and a link to the weekly report. It's the only screen with the streak count
and the settings button. The streak is a quiet number that hides at zero; it never
threatens.

**Settings** holds the child's name and birthday (so Elena can talk about them by
name), the dialect (Rioplatense or neutral Latin American vocabulary), how much to
be corrected (*mucho, normal, poco*), and whether written replies are read aloud.

### Charlar (Conversations)
Conversations with Elena, the one persona across the whole app: a warm Argentine
partner with one voice.

- **The hub** shows resume cards for recent threads (they expire after 14 days, so
  old half-finished chats don't pile up), 26 conversation starters (your day, errands,
  memories, opinions, roleplays: the café and the greengrocer, plus parent-life scenes at the
  pediatrician, the jardín, a video call with the abuela and the plaza), and the
  full history.
- **A conversation** is one thread with two ways in. Typing gets an inline
  correction: the mis-said part is underlined in terracotta, and tapping "Ver la
  mejora" shows the natural version with a one-line reason and an option to save it.
  Tapping the mic continues the *same* thread by voice, using OpenAI's real-time
  speech model.
- **Voice mode** is built for a walk with the pram: hands-free, screen off, one
  thumb. Corrections are deliberately held back until the session ends, because
  nobody can read a correction card with the phone in their pocket. Afterwards a
  review lists what to work on, each item linked to its quiz.
- **Tu semana** is the weekly report: how many conversations and minutes spoken, a
  short written summary, the phrases from your library you actually used, the
  recurring patterns (each with "Practicar esto"), and your corrections to revisit.

### Frases (Phrases)
Things to *say*.

- **Phrase of the day** at the top, with audio.
- **"¿Qué no pudiste decir hoy?"** The capture box. Type what you wanted to say and
  couldn't, in any language, and get the natural Spanish back immediately, filed
  under the right moment of the day. If you type Spanish, it keeps your construction
  rather than swapping in a synonym.
- **Tus frases.** "Recientes" shows what you captured, saved or generated. Then
  there's one pack per daily moment (*despertar, comida, juego, paseo, baño, calmar,
  dormir*), each with 12 built-in phrases you can extend with personalised ones.
  Press and hold a phrase to copy or remove it.
- **Frases por situación.** 15 routines of 12 phrases each: nappy change, feeding,
  bath, bedtime, the playground, plus adult situations (café, bakery, taxi,
  directions, small talk).

### Palabras (Words)
Things to *name*, studied as flashcards.

- **The shelf.** One green block, "Repaso de hoy", gathers the cards due today from
  every pack. When nothing is due it says "Estás al día" and leaves you alone.
- **Eleven preloaded packs, 243 words:** Cosas del bebé, La comida, El cuerpo, La
  ropa, La casa, Juguetes y juego, Los animales, En la calle, Colores y formas, Las
  emociones, Verbos de todos los días. Plus **Tus palabras** for your own.
- **A pack** shows its words under plain headings, one "Estudiar este pack" button,
  and an add box. Type a word in English *or* Spanish and you get it back with its
  article and an example sentence, straight into that pack. Press and hold a word for
  "Ya la sé" or "Quitar".
- **Flashcards** flip in 3D. New words show Spanish first; once you've known a word a
  couple of times it flips to English first, so you have to produce the Spanish with
  its article. A miss goes to the back of the deck so you end the session having got
  it. Words climb a spaced-repetition ladder (due now, then 1, 3, 7, 16, 35 days), so
  a known word rests for weeks and comes back to check it stuck.

### Práctica (Grammar)
Short, targeted quizzes.

- **27 topics, about 480 questions,** grouped by area (verbs, tenses, subjunctive and
  commands, prepositions, pronouns, comparisons, commonly confused words). They run
  from ser vs estar and por vs para to si-clauses, the imperfect subjunctive, the
  *hace/hacía* time expressions, demonstratives and a set of five workhorse verbs
  (enfrentar, averiguar, aprovechar, superar, alcanzar).
- Each topic has a three-segment mastery bar: green for confident, softer green for
  getting there, terracotta for "review this". Topics can be sorted by area, by
  weakest, or by how long it's been since you practised them.
- **"Ponerme a prueba"** mixes questions from your weakest topics.
- **Feedback never shows red.** A miss shows the right answer as "Mejor: …" with the
  rule. A right answer plays a soft two-note chime.
- **The bridge out.** The results screen offers to save phrases that use the rule
  into your library for the next conversation, and where a topic has a word pack,
  links to its flashcards.

---

## Elena, and how she speaks

Elena is the same person everywhere: the same name, the same voice (OpenAI's
`marin`), and the same warmth in text and voice. A few rules define her and are
enforced in code, not just in prompts, because prompts alone failed:

- **Grammar is *tú*, always.** No *vos*, no *vosotros*. The parent learns one system.
  The dialect setting changes vocabulary and accent only (*frutilla* or *fresa*,
  *cochecito*, *upa*), never grammar. A runtime guard blocks any correction that
  would put *vos* forms into the parent's mouth.
- **The app's own interface speaks porteño.** Buttons say "Tocá", "Probá" and
  "Repasá", because that's the local voice. That split is deliberate: the interface
  can be Argentine, but the Spanish being *taught* is always *tú*.
- **Accents are never corrected in typing.** The parent types on a phone without
  easy accents. Elena reads "Que decimos?" as "¿Qué decimos?" and answers it.
  Spoken mistakes in tense and person are still caught, because *hablo* and *habló*
  sound different out loud.
- **Corrections only when there's a real mistake,** and only ever a rewrite of the
  parent's own words.
- **Sound is opt-in.** Text replies aren't read aloud unless you ask. Nothing plays
  on a bus by surprise.

---

## How it looks and feels

The visual system is called **Clay + calm**: the restraint of an editorial layout
combined with gentle tactile press physics. Every pressable surface sits on a small
hard "lip" that collapses when you press it. The palette is fixed: cream background,
deep forest green, and terracotta used as the single accent. Spanish is set in a
serif (Newsreader), the interface in a rounded sans (Outfit), and icons are a bespoke
two-tone set with no emoji.

Rules that hold across the app:

- **One green block per screen.** It marks the thing to do now.
- **Terracotta marks the state that matters,** usually one per screen: a correction,
  a new phrase, a weak topic.
- **No red, no amber, no scores that shame.** A wrong answer is "Mejor: …", not an
  X.
- **One hand, two seconds.** Touch targets of at least 44 px (56 px in voice mode),
  scannable at a glance.
- **Calm over clever.** If something can be removed, it is.

The full system is documented in `DESIGN.md`, with the design-and-handoff PDF as the
companion.

---

## The website

The marketing site has one job: **collect email addresses for early access.** The
app itself isn't linked from the site.

- **The homepage** says above the fold who it's for, what it is, what it costs (free
  in early access) and how to get in. Email capture is the only call to action. An
  app preview built from real components shows a correction and a saved phrase.
- **The free exercises are the taste.** Every grammar topic has a public page
  (`/gramatica/...`) with the rule, examples, and a three-question quiz graded on the
  page that ends in email capture. Every phrase routine has one too (`/frases/...`).
  Both are generated from the app's own content, so they grow as the app does and
  give the site something real to rank for in search.
- **Audience pages** speak to four kinds of parent: parents, parents of toddlers,
  new parents starting from zero, and parents at B1. There are no pages for other
  audiences (see Positioning above).

---

## How it's built

- **Next.js 16** (App Router), React 19, TypeScript and Tailwind CSS 4, deployed on
  Vercel. Installable as a PWA. The primary platform is Chrome on Android, where
  screen-off voice sessions survive. iOS Safari pauses them.
- **No server database yet.** Everything the parent creates (conversations,
  phrases, word progress, quiz history, profile) lives on the device in
  table-shaped local storage. Each store is designed to map one-to-one onto a future
  SQL table.
- **Stateless AI routes.** The server never stores anything. It proxies requests to
  OpenAI for chat, real-time voice, phrase and word generation, transcript analysis,
  the weekly summary, translation, text-to-speech and transcription.
- **Content is versioned in the repo.** Grammar packs, word packs and phrase
  routines are JSON files reviewed like code, with a validator that checks shape,
  topic tags, duplicates and the *tú* rule.

---

## What it is not

- **Not a course.** There's no level 1 to level 10 and nothing to complete.
- **Not a baby app.** There are no screens for infants. The parent is the user.
- **Not gamified.** No mascot, leaderboard, badges or streak guilt. The anti-models
  are Duolingo (too loud, too gamified) and Busuu (too much like courseware).
- **Not a methodology enforcer.** Any amount of Spanish at home is a win.

---

## Where it's going

**Next, in rough order:**

1. **Accounts and sync.** Move the local stores to a real database (likely Supabase)
   so progress survives a new phone and works across devices. The stores were built
   for this.
2. **Two parents, one home.** Shared phrases, packs and routines, so both parents
   use the same words with the child. Consistency matters more than volume.
3. **Words into conversation.** Seed the next conversation with recently studied
   words the way phrases are already seeded, so a word gets *used*, not just
   reviewed.
4. **Content that grows with the child.** Age-aware phrases and packs, from newborn
   imperatives (*mira, ven, toma*) to toddler conversations and early questions.
5. **Measure the loop.** Check whether quiz-to-conversation bridges and capture
   actually lead to phrases being used, and tune the spacing intervals against real
   review history.
6. **Launch.** Turn the waitlist into invites, then work out pricing. The grammar and
   phrase pages stay free.

**Open questions:**

- How much should voice mode do on iOS, where the browser pauses it in the
  background? Is a native wrapper worth it?
- Should corrections in voice mode ever surface during the session, for parents who
  want them?
- When two parents share a home, whose dialect wins?
- What would the parent pay for: voice minutes, content, or the whole loop?

---

## Success looks like

A parent at the bath who says "Cuidado con los ojitos" without thinking about it.
Then, a few months later, a toddler who answers in Spanish.
