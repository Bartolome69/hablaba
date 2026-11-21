// Self-hosts the on-phone OCR fallback (Cuentos, docs/cuentos-plan.md): the
// Tesseract.js worker, its WebAssembly cores (LSTM only) and English data are
// copied from node_modules into public/tesseract, so reading a page on the
// phone never calls a third-party CDN and keeps working offline once used.
// Runs before dev and build; public/tesseract is git-ignored.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const NM = join(ROOT, "node_modules")
const OUT = join(ROOT, "public", "tesseract")

const copies = [
  [join(NM, "tesseract.js", "dist", "worker.min.js"), join(OUT, "worker.min.js")],
  ...readdirSync(join(NM, "tesseract.js-core"))
    .filter((f) => f.endsWith("-lstm.wasm.js"))
    .map((f) => [join(NM, "tesseract.js-core", f), join(OUT, "core", f)]),
  [join(NM, "@tesseract.js-data", "eng", "4.0.0_best_int", "eng.traineddata.gz"), join(OUT, "lang", "eng.traineddata.gz")],
]

for (const [from, to] of copies) {
  if (!existsSync(from)) {
    console.warn(`[copy-tesseract] missing ${from}; the on-phone fallback will be unavailable`)
    continue
  }
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
}
console.log(`[copy-tesseract] ${copies.length} files in public/tesseract`)
