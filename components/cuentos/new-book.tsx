"use client"

// A new book: a title (optional) and the vocabulary flavour, then the camera.

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { StorageFullError, STORAGE_FULL_MESSAGE } from "@/lib/cuentos/errors"
import { go } from "@/lib/cuentos/nav"
import { createBook, UNTITLED } from "@/lib/cuentos/store"
import type { SpanishDialect } from "@/lib/cuentos/types"
import { getProfile } from "@/lib/profile/store"
import { DialectPicker, ScreenHeader } from "./shared"

export function NewBook() {
  const [title, setTitle] = useState("")
  const [dialect, setDialect] = useState<SpanishDialect>("rioplatense")
  useEffect(() => setDialect(getProfile().dialect), [])

  const start = () => {
    try {
      const book = createBook({ title, dialect })
      go({ view: "add", bookId: book.id }, { replace: true })
    } catch (err) {
      if (err instanceof StorageFullError) toast.error(STORAGE_FULL_MESSAGE)
      else throw err
    }
  }

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-36 pt-6">
      <ScreenHeader title="Un cuento nuevo" onBack={() => go({ view: "shelf" })} backLabel="Volver a Cuentos" />

      <label className="smallcaps mb-2 px-1 text-ink-muted" htmlFor="cuento-title">
        Título
      </label>
      <input
        id="cuento-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={UNTITLED}
        className="clay-recessed h-12 rounded-full px-5 font-serif text-[17px] text-ink outline-none placeholder:text-ink-muted focus:ring-1 focus:ring-green/40"
      />

      <p className="smallcaps mb-2 mt-6 px-1 text-ink-muted">Palabras</p>
      <DialectPicker value={dialect} onChange={setDialect} />
      <p className="mt-2 px-1 text-[12.5px] leading-snug text-ink-muted">
        Cambia las palabras, no la gramática: siempre tú.
      </p>

      <div className="pt-8">
        <button
          onClick={start}
          className="clay-green flex h-14 w-full items-center justify-center rounded-full text-[16px] font-semibold text-cream"
        >
          Sacar la foto de la primera página
        </button>
      </div>
    </div>
  )
}
