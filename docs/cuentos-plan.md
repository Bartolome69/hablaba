# Cuentos: plan

*November 2026. Status: **draft for approval.** No app code has been written. Each phase stops for review.*

Cuentos lets the parent photograph a page or spread from an English picture book they own. The app reads the text, turns it into child-level Spanish that keeps the rhyme and the tone, and shows it in a calm, large-type view for **the parent** to read aloud. Books live on a shelf on the device and open with no network.

Contents:
1. What's in the repo today
2. Routes and entry points
3. Stores and blobs
4. Files per phase
5. Server routes: shapes, limits, cost
6. Wireframes
7. Test plan
8. Before and after: a rhyming fixture
9. Risks and iOS Safari gaps
10. Open questions
11. Conflicts between the brief and the repo

---

## 1. What's in the repo today

**Both earlier batches have landed** (`git log`):
- Quick wins QW1 to QW8 (#47): copy and locale sweep, AA contrast tokens, "¿Cómo se dice…?".
- Refresh Phases 1 to 6 (#50 to #55):
  - the global ask sheet with "Guardar como palabra / frase"
  - words from chat
  - Hoy on the five jobs
  - Repasar
  - age-aware content
  - voice on iOS
- Since then: #56 (ask mic, tap or hold), #57 (composer, voice patience) and #58 (Elena finishes her sentence).

| Area | Where | What Cuentos needs to know |
| --- | --- | --- |
| PWA manifest | `app/manifest.ts` | `start_url: /app/today`, scope `/`, standalone, portrait. Nothing to change. |
| Service worker | `public/sw.js`, registered by `components/pwa-register.tsx` (production only) | Very small. Cache `hablaba-shell-v1`. Precaches `/`, `/app/practice` (**retired, now a 301**) and the manifest. Navigations are network-first with a cache fallback to `/`. Scripts, styles, images and fonts are cache-first. **`/api/*` is never cached.** A page you've never opened is not available offline. |
| Local stores | `lib/phrases/store.ts`, `lib/vocab/store.ts`, `lib/conversations/store.ts`, `lib/profile/store.ts` | All **localStorage**, one key per table (`phrases`, `vocab_words`, `conversations`, `conversation_turns`…). Each is a JSON array of rows. Ids come from `crypto.randomUUID()`. Timestamps are **ISO strings**, not numbers. Writes swallow quota errors silently (`try { setItem } catch {}`). **There is no IndexedDB anywhere yet.** |
| OpenAI client | `lib/openai.ts` (`getOpenAI()`, lazy, `OPENAI_API_KEY`) | Server only. The routes use `gpt-4o`, `gpt-4o-mini`, `gpt-4o-mini-transcribe` and `gpt-4o-mini-tts`. |
| Route conventions | `app/api/*/route.ts` | `runtime = "nodejs"`, a `maxDuration` per route, a `MAX_CHARS` slice on input, JSON `response_format` where structured, and `posthog?.capture({ event: "llm_call" … })` with token counts only. Errors: `console.error("[/api/x]", err)` then a generic 500. **No rate limiting anywhere.** |
| Translation | `app/api/translate/route.ts` | Spanish to English, one chat turn, `gpt-4o-mini`. Wrong direction and wrong job for Cuentos, so Cuentos gets its own route. |
| TTS | `app/api/tts/route.ts`, `lib/audio.ts` (`ttsUrl`, `playAudio`), `hooks/use-tts.ts` | Elena's voice (`PARTNER_VOICE` in `lib/voices.ts`). `dialect` sets her accent. `manner`: `clear` is for study material. GET is cached `immutable` for a year, so the browser's HTTP cache helps, but **nothing guarantees audio offline**. POST also exists, for long text. |
| Read-aloud | `hooks/use-read-aloud.ts` (`hablaba_read_aloud`, off by default) | Sound is opt-in. Cuentos follows the same rule with its own play button. |
| Frases | `components/speak/speak-page.tsx` (route `app/app/speak/page.tsx`) | Order: the ask box (`CaptureCard`), the phrase of the day (**the green block**), `MomentPack` (Recientes plus the 8 moments, `dormir` among them), then "Para ti". |
| Ajustes | `components/settings-sheet.tsx` | Sections: Español (dialect, correction level, read-aloud), Tu peque, Elena. Dialect type: `SpanishDialect = "rioplatense" \| "neutral"` in `lib/profile/store.ts`. |
| Phrases | `lib/phrases/store.ts` (`addPhrase`, dedupe by normalised text), `lib/phrases/types.ts` (`PhraseMoment` includes `dormir`, `PhraseSource`), `lib/phrases/pack.ts` (`queryRecentPhrases`, `getConversationSeedPhrases(cap = 8)`) | Recientes is a query over the library, so a saved line shows up there with no extra work. |
| Words | `lib/vocab/store.ts` (`addWord`), `lib/ask/ask.ts` (`saveAnswerAsWord`, `saveAnswerAsPhrase`) | A saved word keeps its article, gender and example. `propias` is "Tus palabras". |
| Ask sheet | `lib/ask/sheet.ts` (`openAskSheet({ query, context, want })`), `components/ask/ask-sheet.tsx`, `app/api/ask/route.ts` | Already does "word in a sentence, give me the gloss and save it" for chat (`components/conversations/lookup-text.tsx`). Phase 2 reuses it as is. |
| Seeding Elena | `lib/conversations/seed.ts` (`buildSeed`, `chatSeedBody`) | Saved phrases reach chat and voice through `getConversationSeedPhrases`. A saved book line seeds with no new mechanism. |
| Immersive | `lib/ui/immersive.ts` (`useImmersive`) | Hides the bottom nav and the ask bar. The reading view uses it. |
| Wake lock | `lib/voice/use-wake-lock.ts` | Reusable. Useful in the reading view (see question 8). |
| tú guard | `lib/voseo.ts` (`containsVoseo`, whole-word blocklist) | Pure, and runs on the server. The translate route runs generated Spanish through it. |
| Validator | `scripts/validate-content.mjs` (`npm run validate:content`) | Covers repo content only: grammar, vocab, moments, the tú rule. Cuentos fixtures can join the tú check. |
| Word splitting | `components/conversations/lookup-text.tsx` (`TOKEN = /(\p{L}[\p{L}'’-]*)/u`) | Handles ¿¡, accents and punctuation. Lift it into a shared helper. |
| Analytics | `components/posthog-provider.tsx` | PostHog is initialised for everyone, with **no opt-in mechanism**. It sends a `$pageview` on every route with the full URL. See question 6. |
| Tests | `package.json` | **No test framework.** Scripts: dev, build, lint, validate:content. Phases so far were verified with ad-hoc Playwright scripts run outside the repo. See question 3. |
| Lint and types | `eslint.config.mjs` (0 errors expected), `npx tsc --noEmit` | `next.config.mjs` sets `ignoreBuildErrors`, so tsc has to run on its own. |

---

## 2. Routes and entry points

### Route: `/app/speak/cuentos` (one static route, views chosen by query string)

| URL | View |
| --- | --- |
| `/app/speak/cuentos` | Shelf |
| `/app/speak/cuentos?nuevo=1` | New book, then capture, then review |
| `/app/speak/cuentos?libro=<id>` | Book details |
| `/app/speak/cuentos?libro=<id>&leer=<n>` | Reading view at page n |
| `/app/speak/cuentos?libro=<id>&sumar=1` | Capture and review, adding to that book |

Why one route with query parameters, when Palabras uses `/app/palabras/[pack]`:
- **Offline.** Book ids only exist on the device, so a `[bookId]` segment can't be pre-rendered or precached. The service worker can only serve URLs it has seen, and an App Router client navigation to an uncached dynamic segment fails offline.
- A single static page can be precached once. The view then comes from `useSearchParams`, all client-side, with every view working on a reload with no network. This is the one deliberate departure from the `[pack]` convention.

It lives under `/app/speak` because it's part of Frases. `components/bottom-nav.tsx` currently marks Frases active only on an exact `/app/speak`, so that becomes `startsWith`.

### Entry points

- **Phase 1, Frases:** a Cuentos row after `MomentPack` and before "Para ti". It's a `clay-card`, not green, because the phrase of the day stays the screen's one green block.
  - It sits after the moments because bedtime is one of them, and before the adult section because it's about the child.
  - Copy: **Cuentos**, "Lee en español los libros que ya tienen en casa". It shows the count and the last book when there is one ("3 cuentos · Seguir: *El osito*").
- **Phase 3 only, if approved:**
  - Hoy's "Para hoy con [child]" section gets a quiet "Seguir leyendo: *título*" line in the evening. It's not green, because the chat card keeps Hoy's green block.
  - The ask sheet gets a "Foto de una página" link.

**My recommendation for Hoy: not now.** Hoy was just rebuilt around five jobs. Let Cuentos earn the entry by being used from Frases first.

---

## 3. Stores and blobs

**Text rows go in localStorage** in the repo's style. **Photos and audio go in IndexedDB**, because localStorage is about 5 MB and strings only, and photos must never be data URLs. IndexedDB is new to the repo, so it gets one small native wrapper (no Dexie, no new dependency).

### localStorage tables (`lib/cuentos/store.ts`)

```ts
// key "books"
interface Book {
  id: string              // crypto.randomUUID()
  title: string           // default "Cuento sin título"
  dialect: SpanishDialect // from Ajustes at creation; changeable per book
  coverPageId?: string
  lastPageIndex: number   // persist "where I was"
  createdAt: string       // ISO, like every other table here
  updatedAt: string
  lastOpenedAt: string
}

// key "book_pages"
interface BookPage {
  id: string
  bookId: string
  index: number           // reading order; reorder rewrites these
  photoId: string         // IndexedDB "photos" key
  thumbId: string         // IndexedDB "photos" key, about 240 px, for the shelf
  sourceText: string      // the English as edited
  sourceTextRaw?: string  // first OCR output
  ocrSource: "vision" | "device" | "pasted"
  createdAt: string
  updatedAt: string
}

// key "book_translations"  (one row per page and dialect)
interface BookTranslation {
  pageId: string
  dialect: SpanishDialect
  text: string
  sourceHash: string      // hash of the normalised sourceText it came from
  notes?: string          // e.g. "the 'wall' rhyme couldn't be kept"
  edited: boolean         // the parent changed the Spanish
  updatedAt: string
}
```

**Change from the brief:** translations are their own table, not a map inside the page. A nested map doesn't map 1:1 to SQL, and every other store here is flat rows. The cache key stays `(pageId, dialect, sourceHash)`.

**Stale and edited rules**
- A translation is **current** when `sourceHash` matches the hash of the page's current `sourceText`.
- Editing the English makes every translation of that page stale. The reading view shows "El inglés cambió" with "Traducir de nuevo".
- If the stale Spanish is `edited`, re-translating asks first: "Cambiaste el español a mano. ¿Traducir de nuevo y reemplazarlo?" with "Reemplazar" and "Dejar el mío". It never overwrites silently.
- Changing a book's dialect shows that dialect's current translation if one exists. Otherwise it translates on demand, which needs the network.

**Reading preferences:** key `cuentos_prefs` holding `{ size: "m" | "l" | "xl" | "xxl", dim: boolean, showEnglish: false }`. This is its own key, like `hablaba_read_aloud`, not part of `profile`. Profile is set-once configuration, and these are per-session knobs.

### IndexedDB (`lib/cuentos/blobs.ts`)

- Database `hablaba_media`, version 1, object stores:
  - `photos`: id → Blob (JPEG)
  - `audio`: key → Blob (MP3)
- Audio keys:
  - **page audio:** `page:<pageId>:<dialect>:<sourceHash>`, so editing the English or the Spanish produces a new key. The Spanish text hash is used, not the English.
  - **word audio:** `word:<dialect>:<normalised word>`, shared across books and capped at about 400 entries, least recently used.
- **Deleting a book** deletes its `books` row, its `book_pages` and `book_translations` rows, every photo and thumbnail, and every `page:` audio blob for those pages. Word audio is shared vocabulary, so it isn't tied to a book and ages out through the cap.
- **Quota:**
  - On the first save, call `navigator.storage.persist()`. Installed Android PWAs usually get it.
  - Every put is wrapped. A `QuotaExceededError` from IndexedDB or localStorage shows "No queda espacio en el teléfono. Borra un cuento para sumar otro." with a button to the shelf.
  - The shelf footer shows usage from `navigator.storage.estimate()` ("Cuentos usa 38 MB").
- **Size budget:** a photo at 1600 px and JPEG 0.82 is about 250 to 450 KB, and a thumbnail about 15 KB. Fifty spreads come to about 20 MB.

### Future SQL mapping

| Local | SQL table | Notes |
| --- | --- | --- |
| `books` | `books(id uuid pk, user_id, title, dialect, cover_page_id, last_page_index, created_at, updated_at, last_opened_at)` | |
| `book_pages` | `book_pages(id uuid pk, book_id fk, position int, photo_ref text null, thumb_ref text null, source_text, source_text_raw, ocr_source, created_at, updated_at)` | `photo_ref` stays a device-local id. Photos are never uploaded under the current rules. If sync ever happens, photos would need their own opt-in to storage. |
| `book_translations` | `book_translations(page_id fk, dialect, text, source_hash, notes, edited, updated_at, primary key (page_id, dialect))` | |
| `cuentos_prefs` | a column on a future `preferences` table | |
| IndexedDB `photos` and `audio` | none (device cache) | |

---

## 4. Files per phase

### Phase 1, MVP (commits prefixed `C1:`)

**New**
- Route and screens:
  - `app/app/speak/cuentos/page.tsx`: client page that picks the view from the query string and sets `useImmersive` in the reading view.
  - `components/cuentos/shelf.tsx`: covers, empty state, green "Escanear un cuento", privacy note on first open, storage line.
  - `components/cuentos/new-book.tsx`: title and dialect, then capture.
  - `components/cuentos/capture.tsx`:
    - `getUserMedia({ video: { facingMode: "environment" } })` with a frame guide and a large shutter
    - torch when `getCapabilities().torch` exists
    - retake and use
    - "Elegir de las fotos" through `<input type="file" accept="image/*" capture="environment">`, which is also the iOS path
  - `components/cuentos/review.tsx`: photo, editable English, editable Spanish, states, notes, "Guardar en el cuento" and "Sumar otra página".
  - `components/cuentos/reader.tsx`: the reading view (section 6).
  - `components/cuentos/book-details.tsx`: thumbnails, reorder (up and down buttons, no drag in Phase 1), delete page, rename, dialect.
  - `components/cuentos/spoken-text.tsx`: Spanish split into tappable words.
- Libraries:
  - `lib/cuentos/types.ts`, `lib/cuentos/store.ts`, `lib/cuentos/blobs.ts`
  - `lib/cuentos/image.ts`: decode with `createImageBitmap`, honour EXIF orientation, downscale to a 1600 px long edge, encode JPEG 0.82, make a 240 px thumbnail.
  - `lib/cuentos/text.ts`: normalise OCR text (join hyphenated line breaks, collapse whitespace, drop lone page numbers), the hash (FNV-1a over the normalised text), and the word splitter lifted from `lookup-text.tsx`.
  - `lib/cuentos/audio.ts`:
    - check the IndexedDB `audio` store first
    - else POST `/api/tts` (`manner: "clear"`, the book's dialect), store the blob and play it
    - offline with no cached clip, fall back to `speechSynthesis` with an `es-*` voice if one exists, otherwise stay silent with a toast
  - `lib/cuentos/api.ts`: client fetchers.
  - `lib/cuentos/ocr-device.ts`: the Tesseract.js fallback in a Worker, loaded with dynamic `import()` only on fallback (see question 5).
  - `lib/cuentos/prompts.ts`: the translation system prompt, verbatim, with the dialect line filled in.
- Server routes:
  - `app/api/cuentos/ocr/route.ts`
  - `app/api/cuentos/translate/route.ts`
- Icon: `components/icons.tsx` gains a `cuento` icon (open book with a moon), duotone like the rest.

**Modified**
- `components/speak/speak-page.tsx`: the Cuentos row.
- `components/bottom-nav.tsx`: Frases is active on `/app/speak` and below.
- `public/sw.js`:
  - bump to `hablaba-shell-v2`
  - precache `/app/speak/cuentos`
  - remove the retired `/app/practice`
  - everything else unchanged; `/api/*` is still never cached by the SW, because audio caching lives in IndexedDB
- `components/settings-sheet.tsx`: a "Cuentos y privacidad" line linking to the same note as the shelf.
- `app/app/layout.tsx`: only if the ask bar needs to know about the reader; `useImmersive` should already cover it.
- `package.json`: `tesseract.js` (if question 5 is yes), plus test devDependencies if question 3 is yes.
- `CLAUDE.md`, `README.md`, `DESIGN.md` (the reading view's dim palette), `docs/VISION.md` (one paragraph).

### Phase 2, learning loop (`C2:`)

- `components/cuentos/reader.tsx`:
  - a tap on a word plays it **and** shows a small sheet with "Ver significado". That calls `openAskSheet({ query: word, context: line, want: "word" })`, the same path as chat, and "Guardar como palabra" goes to Tus palabras by default.
  - a long press on a line opens the ask sheet with the whole line, so "Guardar como frase" puts it in Recientes.
- `app/api/ask/route.ts`: accepts an optional `momentHint` ("dormir") that the model may use for a bedtime book. This is one optional field.
- Elena: saved lines already seed through `getConversationSeedPhrases`, with no change.
  - **Optional (question 9):** `VoiceSeedContext` in `lib/voice/types.ts` gains `recentBook?: string`, filled by `buildSeed` from a book opened in the last 7 days. It goes into the `/api/chat` material block and the voice prompt as one line.
- No scores, streaks or "books read".

### Phase 3, extras (only those approved)

- `app/app/today/page.tsx`: "Seguir leyendo: *título*" after 6pm, inside "Para hoy".
- `components/ask/ask-panel.tsx`: a "Foto de una página" link that opens the capture view.
- OCR bounding boxes mapped onto the photo, so tapping a block of text highlights it.
- Export and delete all Cuentos data: a JSON export of the rows (photos as a zip is a stretch).
- Age-aware tips: one line in the reader drawn from `ageGuidance`.

---

## 5. Server routes: shapes, limits, cost

Both routes follow the house pattern:
- `runtime = "nodejs"`, `getOpenAI()`, JSON responses, `Cache-Control: no-store`
- a `posthog?.capture` `llm_call` event with token counts and **nothing else**
- `console.error` of the error object only

**Neither route logs the body, the image or the page text.** The image is held in memory for the one OpenAI call and never written anywhere.

### `POST /api/cuentos/ocr`

- **Request:** `multipart/form-data` with `image` (a JPEG, already downscaled on the device).
- **Limits:**
  - 3 MB maximum (Vercel's function body limit is 4.5 MB)
  - accepts `image/jpeg`, `image/png` or `image/webp`; anything else is a 415
  - `maxDuration = 30`
- **Model:** `gpt-4o` with vision, `detail: "high"`. The image goes as a base64 `image_url` in the request, which is the only place it exists.
- **Prompt (system):** "Extract the story text from this photo of a picture-book page or two-page spread, in reading order (left page before right; top to bottom). Include text set over illustrations. Ignore page numbers, logos, barcodes, publisher marks and illustrator credits unless they are part of the story. Keep the author's line breaks where a line clearly ends (verse). Return JSON."
- **Response:** `{ text: string, blocks?: { text: string, confidence?: number }[] }`
- **Errors:**
  - 400 for no image
  - 413 for too large
  - 422 `{ error: "no_text" }` when nothing is found, which the client shows as "No encontramos texto en la foto"
  - 500 for anything else
- **No key set:** the route returns 503 `{ error: "no_key" }` and the client goes straight to the device fallback.

### `POST /api/cuentos/translate`

- **Request:** `{ text: string, dialect: "rioplatense" | "neutral", title?: string }`, with `text` capped at 2,000 characters (a spread is usually under 600).
- **Model:** `gpt-4o`. Rhyme and metre are the hard part, which is not a job for mini.
- **Settings:** `response_format: json_object`, temperature 0.7.
- **System prompt:** the brief's text, **verbatim**, with the dialect line filled in from `lib/cuentos/prompts.ts`. JSON shape: `{"spanish": "...", "notes": "..."}`.
- **tú guard:** `containsVoseo(spanish)` runs on the result. On a hit, it retries once with "You used vos forms. Rewrite using tú only, same text otherwise." If the second try still fails, it returns 502 and the client offers "Traducir de nuevo".
- **Response:** `{ spanish: string, notes?: string }`
- `maxDuration = 30`.

### TTS

TTS uses the existing route, with POST for page text (too long for a URL) and GET for single words. The client stores every clip in IndexedDB, so a page or word costs once and then plays offline.

### Cost per page (estimated at the OpenAI list prices I know; check current pricing)

| Step | Tokens or units | Approximate cost |
| --- | --- | --- |
| OCR, gpt-4o vision | 1600×1200 at high detail is about 765 image tokens, plus about 150 prompt and about 150 output | about $0.004 |
| Translation, gpt-4o | about 450 in, about 150 out | about $0.003 |
| Page read-aloud, gpt-4o-mini-tts | about 25 s of audio, once | about $0.006 |
| Word taps | a few hundred characters each, cached | under $0.001 per word |

A page with no read-aloud is about **$0.007**; with read-aloud, about **$0.013**. A 12-spread book is about $0.10 to $0.16, paid once. Re-reading is free.

---

## 6. Wireframes (390 × 844)

### Shelf

```
┌──────────────────────────────────────┐
│ ←  Cuentos                           │
│    Tus libros, en español             │
│                                       │
│ ┌──────────────────────────────────┐ │
│ │  (green)  [+]  Escanear un cuento│ │  ← the one green block
│ └──────────────────────────────────┘ │
│                                       │
│ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │ thumb  │ │ thumb  │ │ thumb  │     │
│ │        │ │        │ │        │     │
│ └────────┘ └────────┘ └────────┘     │
│ El osito   Hora de   Cuento sin       │
│ 6 págs     dormir    título           │
│ ayer       4 págs    1 pág            │
│            hace 3 d  hoy              │
│                                       │
│ Fotos y textos quedan en este         │
│ teléfono · Cuentos usa 12 MB          │
└──────────────────────────────────────┘
Empty: "Saca una foto de una página y la leemos en español." + the green button.
First open: a sheet with the privacy and personal-use note, "Entendido".
```

### Review (after capture)

```
┌──────────────────────────────────────┐
│ ←  El osito · página 3                │
│ ┌──────────────────────────────────┐ │
│ │        photo (tap to enlarge)     │ │
│ └──────────────────────────────────┘ │
│ INGLÉS                     Editar     │
│ ┌──────────────────────────────────┐ │
│ │ Little Bear is sleepy,           │ │
│ │ little Bear is small. …          │ │
│ └──────────────────────────────────┘ │
│ ESPAÑOL · rioplatense      Editar     │
│ ┌──────────────────────────────────┐ │
│ │ Osito tiene sueño,               │ │
│ │ osito es chiquito. …             │ │
│ └──────────────────────────────────┘ │
│ Note: "yawns at the wall" became      │
│ "bosteza un poquito" to keep the rhyme│
│                                       │
│ ┌──────────────────────────────────┐ │
│ │ (green)   Guardar en el cuento    │ │
│ └──────────────────────────────────┘ │
│          Sumar otra página            │
└──────────────────────────────────────┘
States in place of the Spanish box:
  "Leyendo la página…" → "Traduciendo…" → done
  Error: "No pudimos leer la foto." [Intentar de nuevo] [Leer en el teléfono] [Escribir el texto]
  Device OCR: "Leyendo en el teléfono (puede tardar)"
```

### Reading view (immersive: no nav, no ask bar)

```
┌──────────────────────────────────────┐
│ ✕  El osito              3 / 6   📷  │  ← peek at the photo
│                                       │
│                                       │
│   Osito tiene sueño,                  │
│   osito es chiquito.                  │  Newsreader, 30 px by default
│   Abraza su mantita azul              │  line-height 1.5, about 22 characters
│   y bosteza un poquito.               │  steady: no reflow on tap
│                                       │
│   Buenas noches, luna,                │
│   buenas noches, arbolito, …          │
│                                       │
│   (English hidden; "Ver en inglés")   │
│                                       │
├──────────────────────────────────────┤
│  ‹ Anterior   [ ▶ Leer ]   Siguiente ›│  ← bottom third, 56 px targets
│  Aa  Tamaño     ☾ Luz baja    EN      │
└──────────────────────────────────────┘
- Tap a word: it's underlined in terracotta and Elena says it (clear manner).
- "Leer" plays the page and becomes "Pausa". Nothing plays unasked. No auto-advance.
- Luz baja: green-press (#123C1F) surface, cream (#F7F3EC) text, green-on-dark (#A8D0B4)
  for secondary text. The same palette as the pocket view, scoped to this screen.
- Stale: a quiet line under the title, "El inglés cambió · Traducir de nuevo".
```

---

## 7. Test plan

There's no test framework in the repo, and the brief says to propose one and wait. **Recommendation (question 3):**
- **Vitest** for unit tests (fast, TypeScript, understands the `@/` alias).
- **`@playwright/test`** for e2e. Chromium is already in this environment, and the ad-hoc scripts from the refresh would become real tests.
- Both are devDependencies only, with scripts `test` and `test:e2e`, and nothing in the build.

**Every phase runs:**
- `npx tsc --noEmit`
- `npm run lint` (0 errors)
- `npm run build`
- `npm run validate:content`, which gains the tú check over `tests/fixtures/cuentos/*.es.txt`

**Unit (Vitest)**
- `lib/cuentos/text.ts`:
  - normalisation (hyphenated line breaks, page numbers, whitespace)
  - word splitting (¿¡, accents, apostrophes, "mamá,")
  - hash stability
- Stale logic: editing `sourceText` makes the translation stale. An edited translation isn't replaced without confirmation (a store-level test of `retranslate(page, { overwriteEdited: false })`).
- Dialect cache: `rioplatense` and `neutral` rows coexist, and switching reads the right one.
- Book and page CRUD against `lib/cuentos/store.ts`, using jsdom localStorage and `fake-indexeddb` for blobs. Deleting a book removes rows, photos and page audio.
- Prompt contract: with `getOpenAI` mocked, the translate request carries the verbatim rules, including "Use tú grammar only", the right dialect line and the rhyming fixture. A voseo response triggers exactly one retry.

**E2E (`@playwright/test`, 390 × 844, mocked OCR, translation and TTS)**
1. Add a book from a fixture image through the file input, edit one English word, save, and reach the reading view.
2. Tap a word: the mocked TTS is requested once, and a second tap is served from IndexedDB (no request).
3. Reload with the context offline: the shelf, the photo and the last translation are all there.
4. Edit the English: the Spanish shows as stale. Re-translate with edited Spanish: the confirmation appears.
5. Switch the book's dialect: the other translation is requested and shown, and switching back costs nothing.
6. Storage full (a stubbed quota error): the plain message appears with a way forward.
7. Audits from the refresh, carried over: one green block per screen, every text pair at AA, 44 px targets (56 px for the reader controls), and no em dashes in the new copy.

**Fixtures (`tests/fixtures/cuentos/`), made by us, never photographed from a real book (copyright):**
- `plain.jpg`: black type on cream
- `over-art.jpg`: white text over a dark illustration
- `spread.jpg`: two pages, text on both

Each has a matching `.en.txt` with the expected OCR, and the rhyming text from section 8 as `osito.en.txt` and `osito.es.txt`.

**Manual, on real phones** (a section added to `docs/voice-device-checklist.md`, or its own checklist):
- Android Chrome with a key: capture a spread and read the Spanish in under a minute.
- iOS through the file input and Add to Home Screen.

---

## 8. Before and after: a rhyming fixture

An original text, written for this plan (not from a real book):

> Little Bear is sleepy,
> Little Bear is small.
> He hugs his blue blanket
> and yawns at the wall.
>
> Goodnight to the moon,
> goodnight to the tree,
> goodnight, Little Bear,
> goodnight from me.

What I'd expect back (rioplatense; neutral is the same here, as no word on this page differs by dialect):

> Osito tiene sueño,
> osito es chiquito.
> Abraza su mantita azul
> y bosteza un poquito.
>
> Buenas noches, luna,
> buenas noches, arbolito,
> buenas noches, osito,
> un besito chiquitito.

`notes`: "‘Yawns at the wall’ became ‘bosteza un poquito’ and ‘goodnight from me’ became ‘un besito chiquitito’ to keep the rhyme."

What makes this the right answer and not a gloss:
- The repeated "goodnight" stays identical four times.
- Every line is short and sayable by a B1 adult.
- The diminutives sound like a bedtime voice.
- The picture's content stays: the moon, the tree, the blue blanket.

A flat gloss ("El Pequeño Oso tiene sueño, el Pequeño Oso es pequeño. Abraza su manta azul y bosteza a la pared…") is the failure the e2e prompt test guards against.

**Dialect check:** a line like "Time for your bottle" should come back as "Es hora de la mamadera" (rioplatense) and "Es hora del biberón" (neutral). That pair is the second fixture.

---

## 9. Risks and iOS Safari gaps

**Risks**
- **Copyright.** The parent photographs books they own, for reading at home. The first-open note says so, nothing is shared or published, and nothing is stored on our side. The fixtures are our own. Keep it a personal tool with no sharing features, ever.
- **Translation quality.** Rhyme is where models fail most. Mitigations:
  - gpt-4o rather than mini
  - the verbatim prompt
  - `notes` for honesty
  - full editing, with edits never overwritten
- **OCR on stylised type.** Picture books use hand lettering, curved text and text broken over art. Vision handles most of it. The escape hatches are editing and "Escribir el texto". OCR bounding boxes come in Phase 3.
- **Tesseract.js weight.** About 2 MB of WASM plus English language data (about 2 to 4 MB for the fast model). It must be **self-hosted** under `public/` and lazy-loaded, or it isn't offline and it calls a third-party CDN. It's also worse than vision on illustrated pages. See question 5.
- **Service worker.** The current SW is minimal, and its precache list still names the retired `/app/practice`. Adding `/app/speak/cuentos` is safe. The bigger risk is assets from a new deploy when offline, though hashed JS chunks are cache-first, so a page opened once online keeps working.
- **The `{ ignoreBuildErrors: true }` config** means TypeScript errors don't fail the deploy, so tsc runs separately on every phase.
- **Analytics.** PostHog sends a pageview with the full URL for every route, and there's no opt-in. See question 6.

**iOS Safari gaps (to document in the device checklist)**
- **Camera in an installed PWA:** `getUserMedia` works on iOS 16.4 and later in standalone mode, but has had freezes after backgrounding. The file input is the dependable path and is always offered.
- **Torch:** no torch constraint on iOS, so the button is hidden there.
- **HEIC:** `accept="image/*"` usually hands over a JPEG. If a HEIC arrives, `createImageBitmap` decodes it on iOS 17 and later; otherwise it says plainly "Esa foto no se pudo abrir. Prueba con otra."
- **Storage:**
  - Safari can evict IndexedDB for sites not used in 7 days when **not installed**. Installed home-screen apps are exempt.
  - The shelf's first-open note says: "Para que tus cuentos queden guardados, agrega Hablaba a la pantalla de inicio."
  - `navigator.storage.persist()` is weaker on iOS.
- **Audio:** playback needs a user gesture, and every play here is a tap, so it's fine. `speechSynthesis` Spanish voices on iOS are es-ES and es-MX, with no Argentine voice. It's a last resort only.
- **Wake lock:** iOS 16.4 and later, and in installed PWAs from 18.4. Without it, the screen may dim mid-page. Harmless, but noted.

---

## 10. Open questions

| # | Question | Your default | My recommendation |
| --- | --- | --- | --- |
| 1 | Castilian Spanish at all? | No | No. The dialect type stays `rioplatense \| neutral`. |
| 2 | Vos for Rioplatense books? | tú | tú, enforced by `containsVoseo` on every translation. |
| 3 | Add test tooling? | (yours) | **Yes: Vitest and `@playwright/test`, devDependencies only.** I'd add it as the first Phase 1 commit, so every later commit has tests. |
| 4 | Chrome register for new copy | follow the current chrome | **tú**, since the chrome moved to tú this month. So "Borra un cuento para sumar otro", not "Borrá". "Sumar" stays (Rioplatense vocabulary is allowed). |
| 5 | Tesseract fallback in Phase 1? | (brief: yes) | **Yes, but self-hosted and lazy, as its own commit at the end of Phase 1.** If it slips, typing or pasting English is the escape hatch for the no-key and offline cases. |
| 6 | Analytics in Cuentos | none unless there's opt-in | There is no opt-in, so: **no Cuentos events**, and the pageview for `/app/speak/cuentos` is sent **without the query string** (no book ids). The `llm_call` server events carry token counts only. An app-wide opt-in is a separate decision. |
| 7 | One static route with query parameters (`/app/speak/cuentos?libro=…`) rather than `/cuentos/[id]` | (not asked) | Yes. It's what makes reopening a book offline dependable. |
| 8 | Keep the screen on while reading? | (not asked) | Yes, using the existing `useWakeLock` while the reader is open. A dimming screen mid-page is exactly the bedtime annoyance to avoid. |
| 9 | Pass the title of a book read in the last 7 days to Elena (Phase 2)? | optional | Yes, as one optional seed field. Elena can then ask "¿Leyeron *El osito* anoche?", which is the loop working. |
| 10 | Hoy entry now or in Phase 3? | Phase 3 | Phase 3, once Cuentos is used from Frases. |

---

## 11. Conflicts between the brief and the repo

| Brief | Repo | Plan follows |
| --- | --- | --- |
| Timestamps as `number` | Every store uses ISO strings | ISO strings |
| Translations nested in `BookPage` | Every store is flat, table-shaped rows | A separate `book_translations` table |
| "Borrá un cuento…" (voseo) | Chrome is tú since November 2026 | "Borra un cuento…" |
| "No analytics unless opt-in exists" | PostHog is on with no opt-in | No Cuentos events, query string stripped from pageviews (question 6) |
| A dynamic sub-route per book | Palabras uses `[pack]` | One static route with query parameters, for offline reasons |
| "Reuse the translation route" | `/api/translate` is Spanish to English for chat turns | A new `/api/cuentos/translate`; `/api/translate` is untouched |
| "Existing tooling" for tests | There is none | Propose Vitest and Playwright Test, waiting for approval (question 3) |
| Dexie | No IndexedDB yet, and no wish to add a dependency for it | A native wrapper of about 80 lines |
