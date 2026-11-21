import { describe, expect, it } from "vitest"
import { hashText, normalizeSourceText, splitWords, wordKey } from "@/lib/cuentos/text"

describe("normalizeSourceText", () => {
  it("joins words hyphenated across a line break", () => {
    expect(normalizeSourceText("Little Bear is sleep-\ny and small.")).toBe("Little Bear is sleepy and small.")
  })
  it("keeps a real hyphenated compound at the start of a capitalised line", () => {
    expect(normalizeSourceText("Jack-\nIn-the-Box")).toBe("Jack-\nIn-the-Box")
  })
  it("drops lines that are only a page number", () => {
    expect(normalizeSourceText("Goodnight moon\n12\n- 13 -\nGoodnight room")).toBe("Goodnight moon\nGoodnight room")
  })
  it("keeps verse line breaks, collapses spaces and extra blank lines", () => {
    expect(normalizeSourceText("  Goodnight   to the moon,\r\n\r\n\r\n\r\ngoodnight  to the tree ")).toBe(
      "Goodnight to the moon,\n\ngoodnight to the tree",
    )
  })
  it("keeps numbers that are part of the story", () => {
    expect(normalizeSourceText("3 little ducks went out one day")).toBe("3 little ducks went out one day")
  })
})

describe("hashText", () => {
  it("is stable, and ignores whitespace-only changes", () => {
    expect(hashText("Goodnight moon")).toBe(hashText("Goodnight   moon\n"))
    expect(hashText("Goodnight moon")).toMatch(/^[0-9a-f]{8}$/)
  })
  it("changes when a word changes", () => {
    expect(hashText("Goodnight moon")).not.toBe(hashText("Goodnight room"))
  })
})

describe("splitWords", () => {
  const words = (s: string) => splitWords(s).filter((t) => t.word).map((t) => t.text)

  it("keeps ¿ ¡ and punctuation out of the words", () => {
    expect(words("¿Dónde está el osito? ¡Acá!")).toEqual(["Dónde", "está", "el", "osito", "Acá"])
  })
  it("keeps accents and ñ inside words", () => {
    expect(words("Mañana, mamá y papá.")).toEqual(["Mañana", "mamá", "y", "papá"])
  })
  it("rebuilds the exact text when joined", () => {
    const text = "¡Buenas noches, luna!\nBuenas noches, arbolito…"
    expect(splitWords(text).map((t) => t.text).join("")).toBe(text)
  })
  it("treats inner apostrophes and hyphens as part of a word", () => {
    expect(words("el tic-tac del reloj")).toEqual(["el", "tic-tac", "del", "reloj"])
  })
})

describe("wordKey", () => {
  it("lower-cases but keeps accents", () => {
    expect(wordKey("Mamá")).toBe("mamá")
    expect(wordKey("ÁRBOL")).toBe("árbol")
  })
})
