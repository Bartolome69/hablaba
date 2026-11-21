"use client"

// Adding a page: capture a photo, then review it. "Guardar y sumar otra
// página" loops straight back to the camera.

import { useState } from "react"
import { toast } from "sonner"
import { UnreadableImageError, preparePhoto } from "@/lib/cuentos/image"
import { go } from "@/lib/cuentos/nav"
import { countPages, getBook } from "@/lib/cuentos/store"
import { Capture } from "./capture"
import { PageEditor } from "./page-editor"
import { ScreenHeader, Spinner } from "./shared"

export function AddPage({ bookId }: { bookId: string }) {
  const [book] = useState(() => getBook(bookId))
  const [round, setRound] = useState(0)
  const [prepared, setPrepared] = useState<{ photo: Blob; thumb: Blob } | null>(null)
  const [preparing, setPreparing] = useState(false)

  if (!book) return <Missing />

  const pageNumber = countPages(bookId) + 1
  const backToBook = () => go(pageNumber > 1 ? { view: "book", bookId } : { view: "shelf" }, { replace: true })

  if (!prepared) {
    if (preparing) {
      return (
        <div className="flex min-h-dvh items-center justify-center gap-3 bg-background text-ink">
          <Spinner /> Preparando la foto…
        </div>
      )
    }
    return (
      <Capture
        key={round}
        pageLabel={`Página ${pageNumber}`}
        onCancel={backToBook}
        onPhoto={async (blob) => {
          setPreparing(true)
          try {
            setPrepared(await preparePhoto(blob))
          } catch (err) {
            toast.error(err instanceof UnreadableImageError ? "Esa foto no se pudo abrir. Prueba con otra." : "Algo falló con la foto.")
            setRound((r) => r + 1)
          } finally {
            setPreparing(false)
          }
        }}
      />
    )
  }

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-36 pt-6">
      <ScreenHeader
        title={book.title}
        subtitle={`Página ${pageNumber}`}
        onBack={() => {
          setPrepared(null)
          setRound((r) => r + 1)
        }}
        backLabel="Otra foto"
      />
      <PageEditor
        key={round}
        book={book}
        input={{ mode: "new", ...prepared }}
        onSaved={(page) => go({ view: "read", bookId, page: page.index }, { replace: true })}
        onSaveAndAdd={() => {
          toast.success("Página guardada")
          setPrepared(null)
          setRound((r) => r + 1)
        }}
      />
    </div>
  )
}

export function Missing() {
  return (
    <div className="min-h-dvh bg-background px-[22px] py-6">
      <p className="text-sm text-ink-muted">No encontramos ese cuento en este teléfono.</p>
      <button onClick={() => go({ view: "shelf" }, { replace: true })} className="mt-2 min-h-11 text-sm font-medium text-green">
        Volver a Cuentos
      </button>
    </div>
  )
}
