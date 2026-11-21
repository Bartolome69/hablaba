"use client"

// Cuentos text tables: `books`, `book_pages`, `book_translations`. Same shape
// as every other store in the app (one localStorage key per table, an array of
// rows, uuid ids, ISO timestamps), so each maps 1:1 to a future SQL table.
//
// One difference: writes THROW StorageFullError instead of swallowing quota
// errors, because a page that silently failed to save is a page that's gone.
//
// Photos and audio are in IndexedDB (./blobs.ts). Deleting a book across both
// is `deleteBookEverywhere` in ./library.ts.

import { getProfile } from "@/lib/profile/store"
import { isQuotaError, StorageFullError } from "./errors"
import { hashText, normalizeSourceText } from "./text"
import type {
  Book,
  BookPage,
  BookTranslation,
  CuentosPrefs,
  OcrSource,
  SpanishDialect,
  TranslationStatus,
} from "./types"

const BOOKS = "books"
const PAGES = "book_pages"
const TRANSLATIONS = "book_translations"
const PREFS = "cuentos_prefs"

export const UNTITLED = "Cuento sin título"

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, rows: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(rows))
  } catch (err) {
    if (isQuotaError(err)) throw new StorageFullError()
    throw err
  }
}

const now = () => new Date().toISOString()

// --- books -------------------------------------------------------------------

/** Most recently opened first. */
export function listBooks(): Book[] {
  return read<Book>(BOOKS).sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))
}

export function getBook(id: string): Book | null {
  return read<Book>(BOOKS).find((b) => b.id === id) ?? null
}

export function createBook(input: { title?: string; dialect?: SpanishDialect } = {}): Book {
  const at = now()
  const book: Book = {
    id: crypto.randomUUID(),
    title: input.title?.trim() || UNTITLED,
    dialect: input.dialect ?? getProfile().dialect,
    lastPageIndex: 0,
    createdAt: at,
    updatedAt: at,
    lastOpenedAt: at,
  }
  write(BOOKS, [book, ...read<Book>(BOOKS)])
  return book
}

export function updateBook(id: string, patch: Partial<Pick<Book, "title" | "dialect" | "coverPageId">>): Book | null {
  let updated: Book | null = null
  const rows = read<Book>(BOOKS).map((b) => {
    if (b.id !== id) return b
    updated = {
      ...b,
      ...patch,
      title: patch.title !== undefined ? patch.title.trim() || UNTITLED : b.title,
      updatedAt: now(),
    }
    return updated
  })
  write(BOOKS, rows)
  return updated
}

/** Opened (or turned a page): remember where, and float it to the top of the shelf. */
export function touchBook(id: string, pageIndex?: number) {
  write(
    BOOKS,
    read<Book>(BOOKS).map((b) =>
      b.id === id ? { ...b, lastOpenedAt: now(), lastPageIndex: pageIndex ?? b.lastPageIndex } : b,
    ),
  )
}

// --- pages -------------------------------------------------------------------

/** In reading order. */
export function listPages(bookId: string): BookPage[] {
  return read<BookPage>(PAGES)
    .filter((p) => p.bookId === bookId)
    .sort((a, b) => a.index - b.index)
}

export function getPage(id: string): BookPage | null {
  return read<BookPage>(PAGES).find((p) => p.id === id) ?? null
}

export function countPages(bookId: string): number {
  return read<BookPage>(PAGES).filter((p) => p.bookId === bookId).length
}

export function addPage(
  bookId: string,
  input: { photoId: string; thumbId: string; sourceText: string; sourceTextRaw?: string; ocrSource: OcrSource },
): BookPage {
  const all = read<BookPage>(PAGES)
  const at = now()
  const page: BookPage = {
    id: crypto.randomUUID(),
    bookId,
    index: all.filter((p) => p.bookId === bookId).length,
    photoId: input.photoId,
    thumbId: input.thumbId,
    sourceText: normalizeSourceText(input.sourceText),
    sourceTextRaw: input.sourceTextRaw,
    ocrSource: input.ocrSource,
    createdAt: at,
    updatedAt: at,
  }
  write(PAGES, [...all, page])
  const book = getBook(bookId)
  if (book && !book.coverPageId) updateBook(bookId, { coverPageId: page.id })
  return page
}

/** The parent fixed the English. Translations made from the old text become stale. */
export function updatePageSource(pageId: string, sourceText: string): BookPage | null {
  let updated: BookPage | null = null
  write(
    PAGES,
    read<BookPage>(PAGES).map((p) => {
      if (p.id !== pageId) return p
      updated = { ...p, sourceText: normalizeSourceText(sourceText), updatedAt: now() }
      return updated
    }),
  )
  return updated
}

/** Move a page one place earlier (-1) or later (+1). */
export function movePage(pageId: string, direction: -1 | 1) {
  const all = read<BookPage>(PAGES)
  const page = all.find((p) => p.id === pageId)
  if (!page) return
  const ordered = all.filter((p) => p.bookId === page.bookId).sort((a, b) => a.index - b.index)
  const from = ordered.findIndex((p) => p.id === pageId)
  const to = from + direction
  if (to < 0 || to >= ordered.length) return
  ;[ordered[from], ordered[to]] = [ordered[to], ordered[from]]
  const reindexed = new Map(ordered.map((p, i) => [p.id, i]))
  write(
    PAGES,
    all.map((p) => (reindexed.has(p.id) ? { ...p, index: reindexed.get(p.id)! } : p)),
  )
}

/**
 * Remove one page's rows (its translations too) and close the gap in the
 * order. Returns the page so the caller can delete its blobs.
 */
export function deletePageRows(pageId: string): BookPage | null {
  const all = read<BookPage>(PAGES)
  const page = all.find((p) => p.id === pageId)
  if (!page) return null
  const rest = all.filter((p) => p.id !== pageId)
  const ordered = rest.filter((p) => p.bookId === page.bookId).sort((a, b) => a.index - b.index)
  const reindexed = new Map(ordered.map((p, i) => [p.id, i]))
  write(
    PAGES,
    rest.map((p) => (reindexed.has(p.id) ? { ...p, index: reindexed.get(p.id)! } : p)),
  )
  write(
    TRANSLATIONS,
    read<BookTranslation>(TRANSLATIONS).filter((t) => t.pageId !== pageId),
  )
  const book = getBook(page.bookId)
  if (book?.coverPageId === pageId) {
    write(
      BOOKS,
      read<Book>(BOOKS).map((b) => (b.id === book.id ? { ...b, coverPageId: ordered[0]?.id, updatedAt: now() } : b)),
    )
  }
  if (book && book.lastPageIndex >= ordered.length) touchBook(book.id, Math.max(0, ordered.length - 1))
  return page
}

/**
 * Remove a book's rows from all three tables. Returns its pages so the caller
 * can delete photos and page audio (see deleteBookEverywhere).
 */
export function deleteBookRows(bookId: string): BookPage[] {
  const pages = read<BookPage>(PAGES).filter((p) => p.bookId === bookId)
  const pageIds = new Set(pages.map((p) => p.id))
  write(
    TRANSLATIONS,
    read<BookTranslation>(TRANSLATIONS).filter((t) => !pageIds.has(t.pageId)),
  )
  write(
    PAGES,
    read<BookPage>(PAGES).filter((p) => p.bookId !== bookId),
  )
  write(
    BOOKS,
    read<Book>(BOOKS).filter((b) => b.id !== bookId),
  )
  return pages
}

// --- translations ------------------------------------------------------------

export function getTranslation(pageId: string, dialect: SpanishDialect): BookTranslation | null {
  return read<BookTranslation>(TRANSLATIONS).find((t) => t.pageId === pageId && t.dialect === dialect) ?? null
}

/** Is this dialect's Spanish made from the English as it is now? */
export function translationStatus(page: BookPage, dialect: SpanishDialect): TranslationStatus {
  const t = getTranslation(page.id, dialect)
  if (!t) return "none"
  return t.sourceHash === hashText(page.sourceText) ? "current" : "stale"
}

function upsertTranslation(row: BookTranslation) {
  const rest = read<BookTranslation>(TRANSLATIONS).filter(
    (t) => !(t.pageId === row.pageId && t.dialect === row.dialect),
  )
  write(TRANSLATIONS, [...rest, row])
}

/**
 * Store what the model returned. If the parent had edited this dialect's
 * Spanish, it is NOT replaced unless `overwriteEdited` is set: the caller asks
 * first. `fromSource` is the English the model actually translated, when the
 * parent has edited the English since. Returns what happened.
 */
export function saveModelTranslation(
  page: BookPage,
  dialect: SpanishDialect,
  result: { spanish: string; notes?: string },
  opts: { overwriteEdited?: boolean; fromSource?: string } = {},
): "saved" | "kept-edited" {
  const existing = getTranslation(page.id, dialect)
  if (existing?.edited && !opts.overwriteEdited) return "kept-edited"
  upsertTranslation({
    pageId: page.id,
    dialect,
    text: result.spanish.trim(),
    // The English it was MADE from: if that's not the English now, it's stale.
    sourceHash: hashText(opts.fromSource ?? page.sourceText),
    notes: result.notes?.trim() || undefined,
    edited: false,
    updatedAt: now(),
  })
  return "saved"
}

/** The parent fixed the Spanish. It now belongs to them, and matches the English as it is. */
export function saveEditedTranslation(page: BookPage, dialect: SpanishDialect, text: string) {
  const existing = getTranslation(page.id, dialect)
  upsertTranslation({
    pageId: page.id,
    dialect,
    text: text.trim(),
    sourceHash: hashText(page.sourceText),
    notes: existing?.notes,
    edited: true,
    updatedAt: now(),
  })
}

// --- reading preferences -----------------------------------------------------

const DEFAULT_PREFS: CuentosPrefs = { size: "l", dim: false, showEnglish: false }

export function getPrefs(): CuentosPrefs {
  try {
    const raw = localStorage.getItem(PREFS)
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<CuentosPrefs>) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

/** A convenience, so a full phone never blocks reading: failures are ignored. */
export function savePrefs(patch: Partial<CuentosPrefs>) {
  try {
    localStorage.setItem(PREFS, JSON.stringify({ ...getPrefs(), ...patch }))
  } catch {}
}
