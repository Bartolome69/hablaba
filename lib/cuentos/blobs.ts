"use client"

// Photos and audio for Cuentos, in IndexedDB (the first use of it in the app).
// localStorage holds strings and about 5 MB, so binary lives here, referenced
// by id from the text tables in ./store.ts.
//
// Stored as { type, data: ArrayBuffer } rather than Blob: older iOS Safari
// had bugs storing Blobs in IndexedDB, and an ArrayBuffer is the same bytes.
//
// Audio keys:
//   page:<pageId>:<dialect>:<hash of the Spanish>  deleted with the page
//   word:<dialect>:<word>                          shared, capped, least recently used goes

import { isQuotaError, StorageFullError } from "./errors"
import { hashText, wordKey } from "./text"
import type { SpanishDialect } from "./types"

const DB = "hablaba_media"
const VERSION = 1
const PHOTOS = "photos"
const AUDIO = "audio"
export const WORD_AUDIO_CAP = 400

interface StoredBlob {
  type: string
  data: ArrayBuffer
  /** Audio only: last played, for trimming the word cache. */
  usedAt?: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS)
      if (!db.objectStoreNames.contains(AUDIO)) db.createObjectStore(AUDIO)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

/** Tests swap in a fresh IndexedDB per test; drop the cached connection. */
export function resetBlobConnectionForTests() {
  dbPromise = null
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const req = fn(tx.objectStore(store))
        let result: T
        if (req) req.onsuccess = () => (result = req.result)
        tx.oncomplete = () => resolve(result)
        tx.onerror = () => reject(isQuotaError(tx.error) ? new StorageFullError() : tx.error)
        tx.onabort = () => reject(isQuotaError(tx.error) ? new StorageFullError() : tx.error ?? new Error("aborted"))
      }),
  )
}

async function toStored(blob: Blob, usedAt?: number): Promise<StoredBlob> {
  return { type: blob.type, data: await blob.arrayBuffer(), usedAt }
}

const toBlob = (s: StoredBlob | undefined) => (s ? new Blob([s.data], { type: s.type }) : null)

// --- photos ------------------------------------------------------------------

export async function putPhoto(id: string, blob: Blob) {
  const value = await toStored(blob)
  await run(PHOTOS, "readwrite", (s) => s.put(value, id))
}

export async function getPhoto(id: string): Promise<Blob | null> {
  return toBlob(await run<StoredBlob | undefined>(PHOTOS, "readonly", (s) => s.get(id)))
}

export async function deletePhotos(ids: string[]) {
  if (!ids.length) return
  await run(PHOTOS, "readwrite", (s) => {
    for (const id of ids) s.delete(id)
  })
}

// --- audio -------------------------------------------------------------------

export function pageAudioKey(pageId: string, dialect: SpanishDialect, spanish: string): string {
  return `page:${pageId}:${dialect}:${hashText(spanish)}`
}

export function wordAudioKey(dialect: SpanishDialect, word: string): string {
  return `word:${dialect}:${wordKey(word)}`
}

export async function getAudio(key: string): Promise<Blob | null> {
  const stored = await run<StoredBlob | undefined>(AUDIO, "readonly", (s) => s.get(key))
  if (!stored) return null
  // Note the play for the word cache's least-recently-used trim. Best effort.
  if (key.startsWith("word:")) void run(AUDIO, "readwrite", (s) => s.put({ ...stored, usedAt: Date.now() }, key)).catch(() => {})
  return toBlob(stored)
}

export async function putAudio(key: string, blob: Blob) {
  const value = await toStored(blob, Date.now())
  await run(AUDIO, "readwrite", (s) => s.put(value, key))
  if (key.startsWith("word:")) await trimWordAudio()
}

/** Keep the shared word cache under WORD_AUDIO_CAP, dropping the least recently played. */
async function trimWordAudio() {
  const keys = (await run<IDBValidKey[]>(AUDIO, "readonly", (s) => s.getAllKeys())).filter(
    (k): k is string => typeof k === "string" && k.startsWith("word:"),
  )
  if (keys.length <= WORD_AUDIO_CAP) return
  const entries = await Promise.all(
    keys.map(async (k) => ({ k, usedAt: (await run<StoredBlob | undefined>(AUDIO, "readonly", (s) => s.get(k)))?.usedAt ?? 0 })),
  )
  const drop = entries.sort((a, b) => a.usedAt - b.usedAt).slice(0, keys.length - WORD_AUDIO_CAP)
  await run(AUDIO, "readwrite", (s) => {
    for (const { k } of drop) s.delete(k)
  })
}

/** Delete every page clip for these pages, in every dialect and version. */
export async function deletePageAudio(pageIds: string[]) {
  if (!pageIds.length) return
  const prefixes = pageIds.map((id) => `page:${id}:`)
  const keys = await run<IDBValidKey[]>(AUDIO, "readonly", (s) => s.getAllKeys())
  const doomed = keys.filter((k) => typeof k === "string" && prefixes.some((p) => k.startsWith(p)))
  if (!doomed.length) return
  await run(AUDIO, "readwrite", (s) => {
    for (const k of doomed) s.delete(k)
  })
}

export async function countAudio(): Promise<number> {
  return run<number>(AUDIO, "readonly", (s) => s.count())
}

// --- the device --------------------------------------------------------------

/** Ask the browser not to evict our data under pressure. Installed Android PWAs usually get it. */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return
    await navigator.storage?.persist?.()
  } catch {}
}

/** Roughly how much this site is using, for the shelf's footer. */
export async function storageUsedBytes(): Promise<number | null> {
  try {
    const est = await navigator.storage?.estimate?.()
    return est?.usage ?? null
  } catch {
    return null
  }
}
