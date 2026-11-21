"use client"

// Reading a page ON THE PHONE: the fallback when the server can't (no network,
// no key, or a failure). Tesseract.js in a Web Worker, loaded only when this
// module is imported (dynamically, from the review screen), so it adds nothing
// to the main bundle. Every file comes from our own origin (public/tesseract,
// copied by scripts/copy-tesseract.mjs): no third-party CDN, and once used it
// works offline (the language data is kept in IndexedDB by Tesseract itself).
//
// It is slower and weaker than the vision model on illustrated pages; the
// screen says so ("puede tardar") and the text is always editable.

import { normalizeSourceText } from "./text"

export async function readPageOnDevice(photo: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const { createWorker, OEM } = await import("tesseract.js")
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang",
    gzip: true,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(m.progress)
    },
  })
  try {
    const { data } = await worker.recognize(photo)
    return normalizeSourceText(data.text ?? "")
  } finally {
    await worker.terminate()
  }
}
