import { describe, expect, it } from "vitest"
import {
  countAudio,
  getAudio,
  getPhoto,
  pageAudioKey,
  putAudio,
  WORD_AUDIO_CAP,
  wordAudioKey,
} from "@/lib/cuentos/blobs"
import { StorageFullError } from "@/lib/cuentos/errors"
import { deleteBookEverywhere, deletePageEverywhere, savePage } from "@/lib/cuentos/library"
import {
  createBook,
  getBook,
  getTranslation,
  listBooks,
  listPages,
  movePage,
  saveEditedTranslation,
  saveModelTranslation,
  touchBook,
  translationStatus,
  updateBook,
  updatePageSource,
  UNTITLED,
} from "@/lib/cuentos/store"

const jpeg = (label: string) => new Blob([label], { type: "image/jpeg" })
const mp3 = (label: string) => new Blob([label], { type: "audio/mpeg" })

async function bookWithPages(n: number) {
  const book = createBook({ title: "El osito", dialect: "rioplatense" })
  const pages = []
  for (let i = 0; i < n; i++) {
    pages.push(await savePage(book.id, { photo: jpeg(`p${i}`), thumb: jpeg(`t${i}`), sourceText: `Page ${i}`, ocrSource: "vision" }))
  }
  return { book, pages }
}

describe("books", () => {
  it("creates with the Ajustes dialect and a default title", () => {
    localStorage.setItem("profile", JSON.stringify({ dialect: "neutral" }))
    const book = createBook()
    expect(book.title).toBe(UNTITLED)
    expect(book.dialect).toBe("neutral")
    expect(getBook(book.id)).toEqual(book)
  })
  it("keeps the shelf most-recently-opened first and remembers the page", async () => {
    const a = createBook({ title: "A" })
    await new Promise((r) => setTimeout(r, 5))
    createBook({ title: "B" })
    await new Promise((r) => setTimeout(r, 5))
    touchBook(a.id, 3)
    expect(listBooks().map((b) => b.title)).toEqual(["A", "B"])
    expect(getBook(a.id)?.lastPageIndex).toBe(3)
  })
  it("an emptied title falls back to the default", () => {
    const book = createBook({ title: "A" })
    expect(updateBook(book.id, { title: "   " })?.title).toBe(UNTITLED)
  })
})

describe("pages", () => {
  it("saves photo and thumbnail in IndexedDB and orders pages", async () => {
    const { book, pages } = await bookWithPages(3)
    expect(listPages(book.id).map((p) => p.index)).toEqual([0, 1, 2])
    expect(getBook(book.id)?.coverPageId).toBe(pages[0].id)
    expect(await (await getPhoto(pages[1].photoId))?.text()).toBe("p1")
    expect(await (await getPhoto(pages[1].thumbId))?.text()).toBe("t1")
  })
  it("reorders without gaps", async () => {
    const { book, pages } = await bookWithPages(3)
    movePage(pages[2].id, -1)
    expect(listPages(book.id).map((p) => p.sourceText)).toEqual(["Page 0", "Page 2", "Page 1"])
    movePage(pages[0].id, -1) // already first: no-op
    expect(listPages(book.id).map((p) => p.index)).toEqual([0, 1, 2])
  })
  it("deleting a page closes the gap and moves the cover", async () => {
    const { book, pages } = await bookWithPages(3)
    await deletePageEverywhere(pages[0].id)
    expect(listPages(book.id).map((p) => [p.index, p.sourceText])).toEqual([
      [0, "Page 1"],
      [1, "Page 2"],
    ])
    expect(getBook(book.id)?.coverPageId).toBe(pages[1].id)
    expect(await getPhoto(pages[0].photoId)).toBeNull()
  })
})

describe("translations", () => {
  it("are current until the English changes, then stale", async () => {
    const { pages } = await bookWithPages(1)
    const page = pages[0]
    expect(translationStatus(page, "rioplatense")).toBe("none")
    saveModelTranslation(page, "rioplatense", { spanish: "Página 0", notes: "" })
    expect(translationStatus(page, "rioplatense")).toBe("current")
    const edited = updatePageSource(page.id, "Page zero")!
    expect(translationStatus(edited, "rioplatense")).toBe("stale")
  })
  it("never overwrite the parent's edited Spanish unless asked", async () => {
    const { pages } = await bookWithPages(1)
    const page = pages[0]
    saveModelTranslation(page, "rioplatense", { spanish: "Página cero" })
    saveEditedTranslation(page, "rioplatense", "La página cero, mi versión")
    expect(saveModelTranslation(page, "rioplatense", { spanish: "Otra cosa" })).toBe("kept-edited")
    expect(getTranslation(page.id, "rioplatense")?.text).toBe("La página cero, mi versión")
    expect(saveModelTranslation(page, "rioplatense", { spanish: "Otra cosa" }, { overwriteEdited: true })).toBe("saved")
    expect(getTranslation(page.id, "rioplatense")).toMatchObject({ text: "Otra cosa", edited: false })
  })
  it("keep one row per dialect, so switching back costs nothing", async () => {
    const { pages } = await bookWithPages(1)
    const page = pages[0]
    saveModelTranslation(page, "rioplatense", { spanish: "Es hora de la mamadera." })
    saveModelTranslation(page, "neutral", { spanish: "Es hora del biberón." })
    expect(getTranslation(page.id, "rioplatense")?.text).toBe("Es hora de la mamadera.")
    expect(getTranslation(page.id, "neutral")?.text).toBe("Es hora del biberón.")
  })
})

describe("deleting a book", () => {
  it("removes its rows, photos and page audio, and leaves other books alone", async () => {
    const { book, pages } = await bookWithPages(2)
    const other = await bookWithPages(1)
    saveModelTranslation(pages[0], "rioplatense", { spanish: "Hola" })
    await putAudio(pageAudioKey(pages[0].id, "rioplatense", "Hola"), mp3("clip"))
    await putAudio(pageAudioKey(other.pages[0].id, "rioplatense", "Chau"), mp3("other"))
    await putAudio(wordAudioKey("rioplatense", "hola"), mp3("word"))

    await deleteBookEverywhere(book.id)

    expect(getBook(book.id)).toBeNull()
    expect(listPages(book.id)).toEqual([])
    expect(getTranslation(pages[0].id, "rioplatense")).toBeNull()
    expect(await getPhoto(pages[0].photoId)).toBeNull()
    expect(await getPhoto(pages[1].thumbId)).toBeNull()
    expect(await getAudio(pageAudioKey(pages[0].id, "rioplatense", "Hola"))).toBeNull()
    // Other books, and the shared word clips, are untouched.
    expect(listPages(other.book.id)).toHaveLength(1)
    expect(await getAudio(pageAudioKey(other.pages[0].id, "rioplatense", "Chau"))).not.toBeNull()
    expect(await getAudio(wordAudioKey("rioplatense", "hola"))).not.toBeNull()
  })
})

describe("audio cache", () => {
  it("keys page audio by the Spanish, so an edit makes a new clip", () => {
    expect(pageAudioKey("p1", "neutral", "Hola")).not.toBe(pageAudioKey("p1", "neutral", "Hola, osito"))
    expect(wordAudioKey("neutral", "Mamá")).toBe(wordAudioKey("neutral", "mamá"))
  })
  it("caps the shared word cache", async () => {
    for (let i = 0; i < WORD_AUDIO_CAP + 3; i++) await putAudio(`word:neutral:w${i}`, mp3(`${i}`))
    expect(await countAudio()).toBe(WORD_AUDIO_CAP)
    expect(await getAudio("word:neutral:w0")).toBeNull()
    expect(await getAudio(`word:neutral:w${WORD_AUDIO_CAP + 2}`)).not.toBeNull()
  }, 30_000)
})

describe("a full phone", () => {
  it("surfaces quota errors as StorageFullError instead of swallowing them", () => {
    const quota = new DOMException("full", "QuotaExceededError")
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => {
      throw quota
    }
    try {
      expect(() => createBook({ title: "X" })).toThrow(StorageFullError)
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe("a translation saved against older English", () => {
  it("is stale from the start", async () => {
    const book = createBook({ dialect: "neutral" })
    const page = await savePage(book.id, { photo: jpeg("p"), thumb: jpeg("t"), sourceText: "Goodnight room", ocrSource: "vision" })
    saveModelTranslation(page, "neutral", { spanish: "Buenas noches, luna" }, { fromSource: "Goodnight moon" })
    expect(translationStatus(page, "neutral")).toBe("stale")
  })
})
