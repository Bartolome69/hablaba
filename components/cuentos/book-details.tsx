"use client"

// A book's pages: rename, change the vocabulary flavour, drag pages into
// order (a missed page is added last, then dropped where it belongs), edit or
// delete pages, delete the book. The one green block is "Sumar una página".

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { DuoIcon } from "@/components/icons"
import { StorageFullError, STORAGE_FULL_MESSAGE } from "@/lib/cuentos/errors"
import { deleteBookEverywhere, deletePageEverywhere } from "@/lib/cuentos/library"
import { go } from "@/lib/cuentos/nav"
import { getBook, listPages, movePageTo, translationStatus, updateBook } from "@/lib/cuentos/store"
import type { Book, BookPage } from "@/lib/cuentos/types"
import { Missing } from "./add-page"
import { DialectPicker, ScreenHeader, usePhotoUrl } from "./shared"
import { SortablePages } from "./sortable-pages"

function PageRow({
  page,
  book,
  grip,
  dragging,
  onChange,
}: {
  page: BookPage
  book: Book
  grip: React.ReactNode
  dragging: boolean
  onChange: () => void
}) {
  const url = usePhotoUrl(page.thumbId)
  const [confirm, setConfirm] = useState(false)
  const status = translationStatus(page, book.dialect)
  const firstLine = page.sourceText.split("\n").find((l) => l.trim()) ?? ""

  return (
    <div className={`clay-static rounded-[18px] p-3 ${dragging ? "bg-surface" : ""}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => go({ view: "read", bookId: book.id, page: page.index })}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Leer la página ${page.index + 1}`}
        >
          <div className="h-16 w-12 flex-none overflow-hidden rounded-[10px] bg-sunken">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {url && <img src={url} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-ink">Página {page.index + 1}</p>
            <p className="truncate text-[12.5px] text-ink-muted">{firstLine}</p>
            {status !== "current" && (
              <p className="text-[12px] font-medium text-terracotta-ink">{status === "none" ? "Sin traducir" : "El inglés cambió"}</p>
            )}
          </div>
        </button>
        {grip}
      </div>
      <div className="mt-2 flex gap-2 border-t border-rule pt-2">
        <button
          onClick={() => go({ view: "edit", bookId: book.id, pageId: page.id })}
          className="min-h-11 flex-1 rounded-full text-[13px] font-medium text-ink"
        >
          Editar el texto
        </button>
        {confirm ? (
          <button
            onClick={async () => {
              await deletePageEverywhere(page.id)
              onChange()
            }}
            className="min-h-11 flex-1 rounded-full bg-terracotta-tint text-[13px] font-semibold text-terracotta-ink"
          >
            Sí, borrarla
          </button>
        ) : (
          <button onClick={() => setConfirm(true)} className="min-h-11 flex-1 rounded-full text-[13px] font-medium text-terracotta-ink">
            Borrar
          </button>
        )}
      </div>
    </div>
  )
}

export function BookDetails({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<Book | null | undefined>(undefined)
  const [pages, setPages] = useState<BookPage[]>([])
  const [renaming, setRenaming] = useState(false)
  const [title, setTitle] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(() => {
    const b = getBook(bookId)
    setBook(b)
    setPages(b ? listPages(bookId) : [])
  }, [bookId])
  useEffect(load, [load])

  if (book === undefined) return <div className="min-h-dvh bg-background" />
  if (!book) return <Missing />

  const safely = (fn: () => void) => {
    try {
      fn()
      load()
    } catch (err) {
      if (err instanceof StorageFullError) toast.error(STORAGE_FULL_MESSAGE)
      else throw err
    }
  }

  const resume = Math.min(book.lastPageIndex, Math.max(0, pages.length - 1))

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-36 pt-6">
      <ScreenHeader
        title={book.title}
        subtitle={`${pages.length} ${pages.length === 1 ? "página" : "páginas"}`}
        onBack={() => go({ view: "shelf" })}
        backLabel="Volver a Cuentos"
      />

      {pages.length > 0 && (
        <button
          onClick={() => go({ view: "read", bookId, page: resume })}
          className="clay-card mb-3 flex w-full items-center gap-3 rounded-[20px] p-4 text-left"
        >
          <DuoIcon name="cuento" size={24} className="text-ink" />
          <span className="flex-1 text-[15px] font-semibold text-ink">
            {resume > 0 ? `Seguir en la página ${resume + 1}` : "Leer el cuento"}
          </span>
          <DuoIcon name="chevron" size={14} className="text-ink-muted" />
        </button>
      )}

      <button
        onClick={() => go({ view: "add", bookId })}
        className="clay-green flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-cream"
      >
        <DuoIcon name="sumar" size={18} className="text-cream" detail="#A8D0B4" />
        Sumar una página
      </button>

      {pages.length > 0 && (
        <>
          <SortablePages
            pages={pages}
            onMove={(pageId, to) => safely(() => movePageTo(pageId, to))}
            renderRow={(p, grip, dragging) => (
              <PageRow page={p} book={book} grip={grip} dragging={dragging} onChange={load} />
            )}
          />
          {pages.length > 1 ? (
            <p className="mt-3 px-1 text-[12.5px] leading-snug text-ink-muted">
              Mantén pulsados los puntitos de una página y arrástrala para cambiarla de lugar. ¿Te faltó una?
              Súmala y arrástrala a su lugar.
            </p>
          ) : null}
        </>
      )}

      <section className="mt-8 border-t border-rule pt-5">
        <h2 className="smallcaps mb-2 px-1 text-ink-muted">Nombre</h2>
        {renaming ? (
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="clay-recessed h-12 min-w-0 flex-1 rounded-full px-5 font-serif text-[17px] text-ink outline-none"
            />
            <button
              onClick={() => safely(() => (updateBook(bookId, { title }), setRenaming(false)))}
              className="clay-card h-12 rounded-full px-5 text-[14px] font-semibold text-ink"
            >
              Listo
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setTitle(book.title)
              setRenaming(true)
            }}
            className="clay-card flex min-h-12 w-full items-center justify-between rounded-[18px] px-4 text-left"
          >
            <span className="font-serif text-[17px] text-ink">{book.title}</span>
            <span className="text-[13px] font-medium text-ink-muted">Cambiar</span>
          </button>
        )}

        <h2 className="smallcaps mb-2 mt-6 px-1 text-ink-muted">Palabras</h2>
        <DialectPicker value={book.dialect} onChange={(dialect) => safely(() => updateBook(bookId, { dialect }))} />
        <p className="mt-2 px-1 text-[12.5px] leading-snug text-ink-muted">
          Cada página se traduce en el otro vocabulario cuando la abras. Lo que editaste a mano se queda.
        </p>

        <div className="mt-8">
          {confirmDelete ? (
            <div className="rounded-[18px] bg-terracotta-tint p-4">
              <p className="text-[14px] leading-snug text-terracotta-ink">
                Se borran las fotos, los textos y el audio de este cuento. No se puede deshacer.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={async () => {
                    await deleteBookEverywhere(bookId)
                    toast.success("Cuento borrado")
                    go({ view: "shelf" }, { replace: true })
                  }}
                  className="min-h-11 flex-1 rounded-full bg-terracotta-ink text-[14px] font-semibold text-cream"
                >
                  Borrar el cuento
                </button>
                <button onClick={() => setConfirmDelete(false)} className="min-h-11 flex-1 rounded-full text-[14px] font-medium text-ink">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="min-h-11 w-full text-[14px] font-medium text-terracotta-ink">
              Borrar este cuento
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
