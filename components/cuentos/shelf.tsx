"use client"

// The shelf: every book on this phone, most recently opened first. The one
// green block is "Escanear un cuento". Tapping a cover opens the book where
// you left it.

import Link from "next/link"
import { useEffect, useState } from "react"
import { DuoIcon } from "@/components/icons"
import { storageUsedBytes } from "@/lib/cuentos/blobs"
import { go } from "@/lib/cuentos/nav"
import { countPages, getPage, listBooks, listPages } from "@/lib/cuentos/store"
import type { Book } from "@/lib/cuentos/types"
import { PRIVACY_SEEN_KEY, PrivacyNoteSheet } from "./privacy-note"
import { relativeDay, usePhotoUrl } from "./shared"

function Cover({ book, pages }: { book: Book; pages: number }) {
  const thumbId = useCoverThumb(book)
  const url = usePhotoUrl(thumbId)
  return (
    <button
      onClick={() => go(pages > 0 ? { view: "read", bookId: book.id, page: book.lastPageIndex } : { view: "book", bookId: book.id })}
      className="flex min-w-0 flex-col gap-2 text-left"
    >
      <div className="clay-static aspect-[3/4] w-full overflow-hidden rounded-[16px] bg-sunken">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted">
            <DuoIcon name="cuento" size={30} />
          </div>
        )}
      </div>
      <div className="min-w-0 px-0.5">
        <p className="line-clamp-2 font-serif text-[15px] leading-tight text-ink">{book.title}</p>
        <p className="mt-0.5 text-[12px] text-ink-muted">
          {pages} {pages === 1 ? "pág." : "págs."} · {relativeDay(book.lastOpenedAt)}
        </p>
      </div>
    </button>
  )
}

function useCoverThumb(book: Book): string | undefined {
  const [thumbId, setThumbId] = useState<string>()
  useEffect(() => {
    const page = (book.coverPageId && getPage(book.coverPageId)) || listPages(book.id)[0]
    setThumbId(page?.thumbId)
  }, [book])
  return thumbId
}

export function Shelf() {
  const [books, setBooks] = useState<{ book: Book; pages: number }[] | null>(null)
  const [used, setUsed] = useState<number | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)

  useEffect(() => {
    setBooks(listBooks().map((book) => ({ book, pages: countPages(book.id) })))
    void storageUsedBytes().then(setUsed)
    try {
      if (!localStorage.getItem(PRIVACY_SEEN_KEY)) setNoteOpen(true)
    } catch {}
  }, [])

  const closeNote = () => {
    setNoteOpen(false)
    try {
      localStorage.setItem(PRIVACY_SEEN_KEY, new Date().toISOString())
    } catch {}
  }

  return (
    <div className="min-h-dvh bg-background px-[22px] pb-32 pt-6">
      <header className="mb-5 flex items-start gap-3">
        <Link
          href="/app/speak"
          aria-label="Volver a Frases"
          className="clay-card mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-[14px] text-ink"
        >
          <DuoIcon name="volver" size={18} />
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-[34px] leading-none tracking-[-0.025em] text-ink">Cuentos</h1>
          <p className="text-[13.5px] text-ink-muted">Tus libros, para leer en español</p>
        </div>
      </header>

      <button
        onClick={() => go({ view: "new" })}
        className="clay-green-hero flex w-full items-center gap-3.5 rounded-[24px] px-5 py-[18px] text-left"
      >
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-green-well">
          <DuoIcon name="sumar" size={20} className="text-cream" detail="#A8D0B4" />
        </span>
        <span className="flex flex-col">
          <span className="text-[17px] font-semibold text-cream">Escanear un cuento</span>
          <span className="text-[13px] text-green-on-dark">Una foto por página</span>
        </span>
      </button>

      {books && books.length === 0 && (
        <p className="mt-8 px-1 text-center font-serif text-[17px] leading-snug text-ink-muted">
          Saca una foto de una página y la leemos en español.
        </p>
      )}

      {books && books.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-5">
          {books.map(({ book, pages }) => (
            <Cover key={book.id} book={book} pages={pages} />
          ))}
        </div>
      )}

      <footer className="mt-10 border-t border-rule pt-4 text-center text-[12px] leading-relaxed text-ink-muted">
        <p>Las fotos y los textos quedan en este teléfono.</p>
        {used !== null && used > 0 && <p>Hablaba usa {Math.max(1, Math.round(used / 1_000_000))} MB aquí.</p>}
        <button onClick={() => setNoteOpen(true)} className="mt-1 min-h-11 font-medium text-ink underline underline-offset-4">
          Privacidad y uso personal
        </button>
      </footer>

      <PrivacyNoteSheet open={noteOpen} onClose={closeNote} />
    </div>
  )
}
