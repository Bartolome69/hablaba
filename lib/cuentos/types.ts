// Cuentos: picture books the parent photographed, read aloud in Spanish.
// See docs/cuentos-plan.md.
//
// Text lives in localStorage like every other store here, table-shaped so each
// key maps 1:1 to a future SQL table (`books`, `book_pages`,
// `book_translations`). Photos and audio are binary and too big for
// localStorage, so they live in IndexedDB (lib/cuentos/blobs.ts), referenced
// by id. Timestamps are ISO strings, as in every other table in the app.

import type { SpanishDialect } from "@/lib/profile/store"

export type { SpanishDialect }

export interface Book {
  id: string
  title: string
  /** Vocabulary flavour for this book's Spanish. From Ajustes at creation. */
  dialect: SpanishDialect
  coverPageId?: string
  /** Where the parent left off, so the book reopens on that page. */
  lastPageIndex: number
  createdAt: string
  updatedAt: string
  lastOpenedAt: string
}

/** How the English got onto the page. */
export type OcrSource = "vision" | "device" | "pasted"

export interface BookPage {
  id: string
  bookId: string
  /** Reading order, 0-based and contiguous within a book. */
  index: number
  /** IndexedDB `photos` key for the full photo (device only, never uploaded for storage). */
  photoId: string
  /** IndexedDB `photos` key for the small shelf thumbnail. */
  thumbId: string
  /** The English, as the parent last edited it. */
  sourceText: string
  /** What OCR first returned, before any edit. */
  sourceTextRaw?: string
  ocrSource: OcrSource
  createdAt: string
  updatedAt: string
}

/** One row per page and dialect, so switching dialect never loses the other. */
export interface BookTranslation {
  pageId: string
  dialect: SpanishDialect
  text: string
  /** Hash of the English it was made from: if the English changes, this is stale. */
  sourceHash: string
  /** e.g. a rhyme that couldn't be kept. English, shown quietly. */
  notes?: string
  /** The parent changed the Spanish by hand: never replace without asking. */
  edited: boolean
  updatedAt: string
}

/** none: never translated in this dialect. stale: the English changed since. */
export type TranslationStatus = "none" | "current" | "stale"

export interface CuentosPrefs {
  size: "m" | "l" | "xl" | "xxl"
  dim: boolean
  showEnglish: boolean
}
