"use client"

// Review and edit a page: the photo, the English (editable), the Spanish
// (editable), and every state in between. New pages arrive with the photo in
// memory and run OCR then translation straight away; existing pages load what
// was saved. No state is a dead end: OCR fails → try again, read it on the
// phone, or type the text; translation fails → try again.
//
// The parent's Spanish is theirs: re-translating over an edit asks first.

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { CuentosApiError, ERROR_COPY, readPageText, translatePage, type CuentosErrorKind } from "@/lib/cuentos/api"
import { StorageFullError, STORAGE_FULL_MESSAGE } from "@/lib/cuentos/errors"
import { savePage } from "@/lib/cuentos/library"
import {
  getTranslation,
  saveEditedTranslation,
  saveModelTranslation,
  updatePageSource,
} from "@/lib/cuentos/store"
import { hashText, normalizeSourceText } from "@/lib/cuentos/text"
import type { Book, BookPage, OcrSource } from "@/lib/cuentos/types"
import { dialectLabel, Spinner, useBlobUrl, usePhotoUrl } from "./shared"

type English =
  | { state: "reading" }
  | { state: "device"; progress: number }
  | { state: "error"; kind: CuentosErrorKind }
  | { state: "ready" }

type Spanish = { state: "idle" } | { state: "translating" } | { state: "error"; kind: CuentosErrorKind } | { state: "ready" }

export type EditorInput =
  | { mode: "new"; photo: Blob; thumb: Blob }
  | { mode: "edit"; page: BookPage }

export function PageEditor({
  book,
  input,
  onSaved,
  onSaveAndAdd,
}: {
  book: Book
  input: EditorInput
  /** Saved: where to go next (the reader, at this page). */
  onSaved: (page: BookPage) => void
  /** New pages only: save, then capture the next one. */
  onSaveAndAdd?: (page: BookPage) => void
}) {
  const dialect = book.dialect
  const isNew = input.mode === "new"
  const existing = input.mode === "edit" ? input.page : null
  const memUrl = useBlobUrl(input.mode === "new" ? input.photo : null)
  const storedUrl = usePhotoUrl(existing?.photoId)
  const photoUrl = memUrl ?? storedUrl

  const [english, setEnglish] = useState(existing?.sourceText ?? "")
  const [englishState, setEnglishState] = useState<English>(isNew ? { state: "reading" } : { state: "ready" })
  const [ocrRaw, setOcrRaw] = useState<string | undefined>(existing?.sourceTextRaw)
  const [ocrSource, setOcrSource] = useState<OcrSource>(existing?.ocrSource ?? "vision")

  const saved = existing ? getTranslation(existing.id, dialect) : null
  const [spanish, setSpanish] = useState(saved?.text ?? "")
  const [notes, setNotes] = useState(saved?.notes ?? "")
  const [spanishEdited, setSpanishEdited] = useState(saved?.edited ?? false)
  // What happened to the Spanish in THIS visit, which decides what saving
  // writes: nothing (leave the saved row alone, stale or not), the model's
  // fresh text, or the parent's typing.
  const [spanishChange, setSpanishChange] = useState<"none" | "model" | "user">("none")
  // The English the Spanish was made from (the stale check).
  const [madeFrom, setMadeFrom] = useState<string | null>(saved ? (saved.sourceHash === hashText(existing!.sourceText) ? existing!.sourceText : "") : null)
  const [spanishState, setSpanishState] = useState<Spanish>(saved ? { state: "ready" } : { state: "idle" })
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [saving, setSaving] = useState(false)
  const englishRef = useRef<HTMLTextAreaElement>(null)

  const stale = !!spanish && madeFrom !== null && hashText(madeFrom) !== hashText(english)

  const translate = useCallback(
    async (text: string, opts: { force?: boolean } = {}) => {
      if (!text.trim()) return
      if (spanishEdited && !opts.force) {
        setConfirmReplace(true)
        return
      }
      setConfirmReplace(false)
      setSpanishState({ state: "translating" })
      try {
        const result = await translatePage(normalizeSourceText(text), dialect)
        setSpanish(result.spanish)
        setNotes(result.notes ?? "")
        setSpanishEdited(false)
        setSpanishChange("model")
        setMadeFrom(text)
        setSpanishState({ state: "ready" })
      } catch (err) {
        setSpanishState({ state: "error", kind: err instanceof CuentosApiError ? err.kind : "failed" })
      }
    },
    [dialect, spanishEdited],
  )

  const gotEnglish = useCallback(
    (text: string, source: OcrSource) => {
      setEnglish(text)
      setOcrRaw(text)
      setOcrSource(source)
      setEnglishState({ state: "ready" })
      void translate(text)
    },
    [translate],
  )

  const readOnline = useCallback(async () => {
    if (input.mode !== "new") return
    setEnglishState({ state: "reading" })
    try {
      const { text } = await readPageText(input.photo)
      gotEnglish(normalizeSourceText(text), "vision")
    } catch (err) {
      setEnglishState({ state: "error", kind: err instanceof CuentosApiError ? err.kind : "failed" })
    }
  }, [input, gotEnglish])

  const readOnDevice = async () => {
    if (input.mode !== "new") return
    setEnglishState({ state: "device", progress: 0 })
    try {
      const { readPageOnDevice } = await import("@/lib/cuentos/ocr-device")
      const text = await readPageOnDevice(input.photo, (p) => setEnglishState({ state: "device", progress: p }))
      if (!text.trim()) {
        setEnglishState({ state: "error", kind: "no_text" })
        return
      }
      gotEnglish(text, "device")
    } catch {
      setEnglishState({ state: "error", kind: "failed" })
    }
  }

  const typeItIn = () => {
    setOcrSource("pasted")
    setEnglishState({ state: "ready" })
    setTimeout(() => englishRef.current?.focus(), 0)
  }

  // A new page reads itself as soon as it arrives.
  const started = useRef(false)
  useEffect(() => {
    if (!isNew || started.current) return
    started.current = true
    void readOnline()
  }, [isNew, readOnline])

  const save = async (andAdd: boolean) => {
    if (!english.trim()) {
      typeItIn()
      return
    }
    setSaving(true)
    try {
      let page: BookPage
      if (input.mode === "new") {
        page = await savePage(book.id, {
          photo: input.photo,
          thumb: input.thumb,
          sourceText: english,
          sourceTextRaw: ocrRaw,
          ocrSource,
        })
      } else {
        page = updatePageSource(input.page.id, english) ?? input.page
      }
      if (spanish.trim() && spanishChange === "user") saveEditedTranslation(page, dialect, spanish)
      else if (spanish.trim() && spanishChange === "model")
        saveModelTranslation(page, dialect, { spanish, notes }, { overwriteEdited: true, fromSource: madeFrom ?? undefined })
      if (andAdd && onSaveAndAdd) onSaveAndAdd(page)
      else onSaved(page)
    } catch (err) {
      setSaving(false)
      if (err instanceof StorageFullError) toast.error(STORAGE_FULL_MESSAGE)
      else toast.error("No se pudo guardar. Prueba de nuevo.")
    }
  }

  const busy = englishState.state === "reading" || englishState.state === "device" || spanishState.state === "translating"

  return (
    <div className="flex flex-col gap-5">
      {photoUrl && (
        <a href={photoUrl} target="_blank" rel="noreferrer" className="clay-static block overflow-hidden rounded-[18px] bg-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="La foto de la página" className="max-h-[220px] w-full object-contain" />
        </a>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="smallcaps text-ink-muted">Inglés</h2>
        </div>
        {englishState.state === "reading" && <Status text="Leyendo la página…" />}
        {englishState.state === "device" && (
          <Status text={`Leyendo en el teléfono (puede tardar)… ${Math.round(englishState.progress * 100)}%`} />
        )}
        {englishState.state === "error" && (
          <div className="rounded-[18px] bg-terracotta-tint p-4">
            <p className="text-[14px] leading-snug text-terracotta-ink">{ERROR_COPY[englishState.kind]}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {englishState.kind !== "no_text" && englishState.kind !== "offline" && englishState.kind !== "no_key" && (
                <ActionChip onClick={() => void readOnline()}>Intentar de nuevo</ActionChip>
              )}
              <ActionChip onClick={() => void readOnDevice()}>Leer en el teléfono</ActionChip>
              <ActionChip onClick={typeItIn}>Escribir el texto</ActionChip>
            </div>
          </div>
        )}
        {englishState.state === "ready" && (
          <textarea
            ref={englishRef}
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            rows={Math.min(10, Math.max(3, english.split("\n").length + 1))}
            placeholder="Escribe o pega aquí el texto en inglés"
            lang="en"
            aria-label="El texto en inglés"
            className="clay-recessed w-full resize-y rounded-[18px] px-4 py-3 text-[15px] leading-6 text-ink outline-none placeholder:text-ink-muted focus:ring-1 focus:ring-green/40"
          />
        )}
      </section>

      {englishState.state === "ready" && (
        <section>
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="smallcaps text-ink-muted">Español · {dialectLabel(dialect)}</h2>
            {spanishState.state === "ready" && spanish && !stale && (
              <button onClick={() => void translate(english)} className="min-h-11 text-[12.5px] font-medium text-terracotta-ink">
                Traducir de nuevo
              </button>
            )}
          </div>

          {stale && spanishState.state !== "translating" && (
            <div className="mb-2 flex items-center justify-between gap-3 rounded-[14px] bg-sunken px-3.5 py-2">
              <p className="text-[13px] text-ink">El inglés cambió.</p>
              <button onClick={() => void translate(english)} className="min-h-11 text-[13px] font-semibold text-green">
                Traducir de nuevo
              </button>
            </div>
          )}

          {confirmReplace && (
            <div className="mb-2 rounded-[14px] bg-sunken p-3.5">
              <p className="text-[13.5px] leading-snug text-ink">Cambiaste el español a mano. ¿Traducir de nuevo y reemplazarlo?</p>
              <div className="mt-2.5 flex gap-2">
                <ActionChip onClick={() => void translate(english, { force: true })}>Reemplazar</ActionChip>
                <ActionChip onClick={() => setConfirmReplace(false)}>Dejar el mío</ActionChip>
              </div>
            </div>
          )}

          {spanishState.state === "translating" && <Status text="Traduciendo…" />}
          {spanishState.state === "error" && (
            <div className="rounded-[18px] bg-terracotta-tint p-4">
              <p className="text-[14px] leading-snug text-terracotta-ink">{ERROR_COPY[spanishState.kind]}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <ActionChip onClick={() => void translate(english, { force: true })}>Intentar de nuevo</ActionChip>
              </div>
            </div>
          )}
          {spanishState.state === "idle" && !spanish && (
            <button
              onClick={() => void translate(english)}
              disabled={!english.trim()}
              className="clay-card flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold text-ink disabled:opacity-60"
            >
              Traducir
            </button>
          )}
          {spanishState.state === "ready" && (
            <>
              <textarea
                value={spanish}
                onChange={(e) => {
                  setSpanish(e.target.value)
                  setSpanishEdited(true)
                  setSpanishChange("user")
                }}
                rows={Math.min(12, Math.max(3, spanish.split("\n").length + 1))}
                lang="es"
                aria-label="El texto en español"
                className="clay-recessed w-full resize-y rounded-[18px] px-4 py-3 font-serif text-[17px] leading-7 text-ink outline-none focus:ring-1 focus:ring-green/40"
              />
              {notes && <p className="mt-2 px-1 text-[12.5px] leading-snug text-ink-muted">{notes}</p>}
            </>
          )}
        </section>
      )}

      <div className="mt-2 flex flex-col gap-2.5">
        <button
          onClick={() => void save(false)}
          disabled={busy || saving || englishState.state !== "ready"}
          className="clay-green flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold text-cream disabled:opacity-60"
        >
          {saving && <Spinner light />}
          {isNew ? "Guardar en el cuento" : "Guardar los cambios"}
        </button>
        {isNew && onSaveAndAdd && (
          <button
            onClick={() => void save(true)}
            disabled={busy || saving || englishState.state !== "ready"}
            className="flex h-12 w-full items-center justify-center rounded-full text-[15px] font-medium text-ink disabled:opacity-60"
          >
            Guardar y sumar otra página
          </button>
        )}
      </div>
    </div>
  )
}

function Status({ text }: { text: string }) {
  return (
    <div className="clay-recessed flex items-center gap-3 rounded-[18px] px-4 py-4" role="status">
      <Spinner />
      <p className="text-[14px] text-ink">{text}</p>
    </div>
  )
}

function ActionChip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="clay-card flex min-h-11 items-center rounded-full px-4 text-[13.5px] font-semibold text-ink">
      {children}
    </button>
  )
}
