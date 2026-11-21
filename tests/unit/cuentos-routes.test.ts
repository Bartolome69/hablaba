// @vitest-environment node
import fs from "node:fs"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { POST as ocr } from "@/app/api/cuentos/ocr/route"
import { POST as translate } from "@/app/api/cuentos/translate/route"

// vi.mock is hoisted above the imports, so the routes get the fake client.
const { create } = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock("@/lib/openai", () => ({ getOpenAI: () => ({ chat: { completions: { create } } }) }))
vi.mock("@/lib/posthog-server", () => ({ posthog: null }))

const osito = fs.readFileSync(new URL("../fixtures/cuentos/osito.en.txt", import.meta.url), "utf8")
const reply = (content: object) => ({ choices: [{ message: { content: JSON.stringify(content) } }], usage: { prompt_tokens: 1, completion_tokens: 1 } })
const post = (body: object) =>
  translate(new Request("http://x/api/cuentos/translate", { method: "POST", body: JSON.stringify(body) }))

beforeEach(() => {
  create.mockReset()
  process.env.OPENAI_API_KEY = "test"
})

describe("/api/cuentos/translate: the prompt contract", () => {
  it("sends the verbatim rules, the right dialect line and the page", async () => {
    create.mockResolvedValue(reply({ spanish: "Osito tiene sueño", notes: "" }))
    const res = await post({ text: osito, dialect: "rioplatense" })
    expect(res.status).toBe(200)
    const { messages, model } = create.mock.calls[0][0]
    const system = messages[0].content as string
    expect(model).toBe("gpt-4o")
    expect(system).toContain("- Use tú grammar only. Never use vos or vosotros.")
    expect(system).toContain("Rioplatense: Argentine everyday words such as frutilla, mamadera, upa")
    expect(system).not.toContain("neutral: widely understood")
    expect(system).toContain("Preserve rhyme, metre and refrains")
    expect(system).toContain("Keep repeated phrases identical across the page.")
    expect(messages.at(-1)).toEqual({ role: "user", content: osito.trim() })
  })
  it("uses the neutral line for neutral books", async () => {
    create.mockResolvedValue(reply({ spanish: "Es hora del biberón." }))
    await post({ text: "Time for your bottle.", dialect: "neutral" })
    expect(create.mock.calls[0][0].messages[0].content).toContain("neutral: widely understood Latin American words")
  })
  it("returns spanish and notes, omitting empty notes", async () => {
    create.mockResolvedValue(reply({ spanish: "Hola", notes: "" }))
    expect(await (await post({ text: "Hi", dialect: "neutral" })).json()).toEqual({ spanish: "Hola" })
    create.mockResolvedValue(reply({ spanish: "Hola", notes: "The rhyme was lost." }))
    expect(await (await post({ text: "Hi", dialect: "neutral" })).json()).toEqual({ spanish: "Hola", notes: "The rhyme was lost." })
  })
  it("retries exactly once when vos slips in, and returns the tú version", async () => {
    create
      .mockResolvedValueOnce(reply({ spanish: "Mirá, osito, vos tenés sueño." }))
      .mockResolvedValueOnce(reply({ spanish: "Mira, osito, tú tienes sueño." }))
    const res = await post({ text: "Look, Little Bear, you are sleepy.", dialect: "rioplatense" })
    expect(create).toHaveBeenCalledTimes(2)
    expect(create.mock.calls[1][0].messages.at(-1).content).toMatch(/tú grammar only/)
    expect(await res.json()).toEqual({ spanish: "Mira, osito, tú tienes sueño." })
  })
  it("refuses rather than return vosotros twice", async () => {
    create.mockResolvedValue(reply({ spanish: "Vosotros tenéis sueño." }))
    const res = await post({ text: "You are all sleepy.", dialect: "neutral" })
    expect(create).toHaveBeenCalledTimes(2)
    expect(res.status).toBe(502)
  })
  it("rejects empty and over-long pages without calling the model", async () => {
    expect((await post({ text: "  " })).status).toBe(400)
    expect((await post({ text: "a".repeat(2001) })).status).toBe(413)
    expect(create).not.toHaveBeenCalled()
  })
  it("says so when no key is set", async () => {
    delete process.env.OPENAI_API_KEY
    expect((await post({ text: "Hi" })).status).toBe(503)
  })
})

describe("/api/cuentos/ocr", () => {
  const upload = (blob: Blob) => {
    const form = new FormData()
    form.append("image", blob, "page.jpg")
    return ocr(new Request("http://x/api/cuentos/ocr", { method: "POST", body: form }))
  }

  it("sends the image to the vision model and returns text and blocks", async () => {
    create.mockResolvedValue(reply({ text: "Little Bear is sleepy,", blocks: [{ text: "Little Bear is sleepy," }] }))
    const res = await upload(new Blob([new Uint8Array([255, 216, 255])], { type: "image/jpeg" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: "Little Bear is sleepy,", blocks: [{ text: "Little Bear is sleepy," }] })
    const content = create.mock.calls[0][0].messages[1].content[0]
    expect(content.type).toBe("image_url")
    expect(content.image_url.url).toMatch(/^data:image\/jpeg;base64,/)
  })
  it("422s when the page has no text", async () => {
    create.mockResolvedValue(reply({ text: "", blocks: [] }))
    expect((await upload(new Blob([new Uint8Array([1])], { type: "image/png" }))).status).toBe(422)
  })
  it("rejects other file types and oversized images before calling the model", async () => {
    expect((await upload(new Blob(["x"], { type: "image/gif" }))).status).toBe(415)
    expect((await upload(new Blob([new Uint8Array(3 * 1024 * 1024 + 1)], { type: "image/jpeg" }))).status).toBe(413)
    expect(create).not.toHaveBeenCalled()
  })
  it("never logs the image or the text on failure", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    create.mockRejectedValue(new Error("upstream 500"))
    const res = await upload(new Blob([new Uint8Array([255, 216])], { type: "image/jpeg" }))
    expect(res.status).toBe(500)
    expect(JSON.stringify(spy.mock.calls)).not.toMatch(/base64|data:image/)
    spy.mockRestore()
  })
})
