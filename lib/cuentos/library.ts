"use client"

// Operations that span the text tables (./store.ts) and the media store
// (./blobs.ts), so a book or page is never half-deleted.

import { deletePageAudio, deletePhotos, putPhoto, requestPersistence } from "./blobs"
import { addPage, deleteBookRows, deletePageRows } from "./store"
import type { BookPage, OcrSource } from "./types"

/** Delete a book: its rows, its photos and thumbnails, and every page clip. */
export async function deleteBookEverywhere(bookId: string) {
  const pages = deleteBookRows(bookId)
  await deletePhotos(pages.flatMap((p) => [p.photoId, p.thumbId]))
  await deletePageAudio(pages.map((p) => p.id))
}

export async function deletePageEverywhere(pageId: string) {
  const page = deletePageRows(pageId)
  if (!page) return
  await deletePhotos([page.photoId, page.thumbId])
  await deletePageAudio([page.id])
}

/**
 * Save a captured page: photo and thumbnail first, then the row that points at
 * them, so a row never references a photo that didn't save. If the row write
 * fails (phone full), the photos are removed again.
 */
export async function savePage(
  bookId: string,
  input: { photo: Blob; thumb: Blob; sourceText: string; sourceTextRaw?: string; ocrSource: OcrSource },
): Promise<BookPage> {
  const photoId = crypto.randomUUID()
  const thumbId = crypto.randomUUID()
  await putPhoto(photoId, input.photo)
  try {
    await putPhoto(thumbId, input.thumb)
    const page = addPage(bookId, {
      photoId,
      thumbId,
      sourceText: input.sourceText,
      sourceTextRaw: input.sourceTextRaw,
      ocrSource: input.ocrSource,
    })
    void requestPersistence()
    return page
  } catch (err) {
    await deletePhotos([photoId, thumbId]).catch(() => {})
    throw err
  }
}
