import fs from "node:fs"
import path from "node:path"
import { expect, test, type BrowserContext, type Page } from "@playwright/test"

// Cuentos, end to end, at 390 × 844. OCR, translation and TTS are mocked
// (counted, so caching is checked too); the on-phone OCR test runs the real
// self-hosted Tesseract against a fixture image.

const FIX = path.join(__dirname, "..", "fixtures", "cuentos")
const fixture = (name: string) => fs.readFileSync(path.join(FIX, name), "utf8").trim()
const OSITO_ES = fixture("osito.es.txt")
const PLAIN_EN = fixture("plain.en.txt")
const NEUTRAL_ES = "Osito tiene sueño, osito es pequeñito."
const STORAGE_FULL = "No queda espacio en el teléfono. Borra un cuento para sumar otro."

type Calls = { ocr: number; translate: { dialect: string; text: string }[]; tts: string[] }

async function mockAi(context: BrowserContext, opts: { ocr?: "ok" | "no_key" } = {}): Promise<Calls> {
  const calls: Calls = { ocr: 0, translate: [], tts: [] }
  await context.route("**/api/cuentos/ocr", (route) => {
    calls.ocr++
    return opts.ocr === "no_key"
      ? route.fulfill({ status: 503, json: { error: "no_key" } })
      : route.fulfill({ json: { text: PLAIN_EN, blocks: [] } })
  })
  await context.route("**/api/cuentos/translate", (route) => {
    const body = route.request().postDataJSON() as { dialect: string; text: string }
    calls.translate.push(body)
    const spanish = body.dialect === "neutral" ? NEUTRAL_ES : OSITO_ES
    return route.fulfill({ json: { spanish, notes: "‘Yawns at the wall’ became ‘bosteza un poquito’ to keep the rhyme." } })
  })
  await context.route("**/api/tts**", (route) => {
    const req = route.request()
    calls.tts.push(req.method() === "POST" ? (req.postDataJSON() as { text: string }).text : new URL(req.url()).searchParams.get("text") ?? "")
    return route.fulfill({ status: 200, contentType: "audio/mpeg", body: Buffer.from([0xff, 0xfb, 0x90, 0x64]) })
  })
  return calls
}

async function openShelf(page: Page) {
  await page.goto("/app/speak")
  await page.getByRole("link", { name: /Lee sus libros en español/ }).click()
  await expect(page).toHaveURL(/\/app\/speak\/cuentos$/)
  await page.getByRole("button", { name: "Entendido" }).click()
  await expect(page.getByRole("dialog")).toBeHidden()
}

async function scanFirstPage(page: Page, title = "El osito") {
  await page.getByRole("button", { name: /Escanear un cuento/ }).click()
  await page.getByLabel("Título").fill(title)
  await page.getByRole("button", { name: "Sacar la foto de la primera página" }).click()
  await page.locator('input[type="file"]').setInputFiles(path.join(FIX, "plain.jpg"))
  await page.getByRole("button", { name: "Usar esta foto" }).click()
}

test("scan a page, fix the English, read it, tap a word, reopen offline", async ({ page, context }) => {
  const calls = await mockAi(context)
  await openShelf(page)
  await expect(page.getByText("Saca una foto de una página y la leemos en español.")).toBeVisible()
  await scanFirstPage(page)

  const english = page.getByLabel("El texto en inglés")
  await expect(english).toHaveValue(PLAIN_EN)
  await expect(page.getByLabel("El texto en español")).toHaveValue(OSITO_ES)
  await expect(page.getByText("‘Yawns at the wall’ became")).toBeVisible()
  expect(calls.translate[0]).toEqual({ text: PLAIN_EN, dialect: "rioplatense" })

  // Fixing the English makes the Spanish stale until it's translated again.
  await english.fill(PLAIN_EN.replace("small.", "small!"))
  await expect(page.getByText("El inglés cambió.")).toBeVisible()
  await page.getByRole("button", { name: "Traducir de nuevo" }).first().click()
  await expect(page.getByText("El inglés cambió.")).toBeHidden()
  expect(calls.translate).toHaveLength(2)

  await page.getByRole("button", { name: "Guardar en el cuento" }).click()
  await expect(page).toHaveURL(/libro=.+&leer=0/)
  await expect(page.getByText("Osito tiene sueño,")).toBeVisible()
  // English hidden by default; nothing played on arrival.
  await expect(page.getByText("Little Bear is sleepy,")).toBeHidden()
  expect(calls.tts).toHaveLength(0)

  // Tap a word: Elena says it once; the second tap comes from the phone.
  await page.getByRole("button", { name: "chiquito", exact: true }).click()
  await expect.poll(() => calls.tts).toEqual(["chiquito"])
  await page.getByRole("button", { name: "chiquito", exact: true }).click()
  await page.waitForTimeout(500)
  expect(calls.tts).toEqual(["chiquito"])

  // Read-aloud is a tap, and asks for the page once.
  await page.getByRole("button", { name: "Leer", exact: true }).click()
  await expect.poll(() => calls.tts.length).toBe(2)
  expect(calls.tts[1]).toBe(OSITO_ES)

  // Reopen with no network: the shelf, the photo and the Spanish are all there.
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload() // controlled by the service worker now, so its files get cached
  await expect(page.getByText("Osito tiene sueño,")).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByText("Osito tiene sueño,")).toBeVisible()
  await page.getByRole("button", { name: "Foto" }).click()
  await expect(page.getByRole("img", { name: "La foto de la página" })).toBeVisible()
  await page.getByRole("button", { name: "Cerrar la foto" }).click()
  await page.getByRole("button", { name: "Cerrar el cuento" }).click()
  await expect(page.getByText("El osito")).toBeVisible()
  await context.setOffline(false)
})

test("the parent's Spanish is kept, and dialects are cached separately", async ({ page, context }) => {
  const calls = await mockAi(context)
  await openShelf(page)
  await scanFirstPage(page)
  await page.getByRole("button", { name: "Guardar en el cuento" }).click()
  await expect(page.getByText("Osito tiene sueño,")).toBeVisible()

  // Edit the Spanish by hand.
  await page.getByRole("button", { name: "Las páginas del cuento" }).click()
  await page.getByRole("button", { name: "Editar el texto" }).click()
  await page.getByLabel("El texto en español").fill("Mi osito tiene sueño.")
  await page.getByRole("button", { name: "Guardar los cambios" }).click()
  await expect(page.getByText("Mi osito tiene sueño.")).toBeVisible()

  // Then change the English: the Spanish is stale, and re-translating asks first.
  await page.getByRole("button", { name: "Las páginas del cuento" }).click()
  await page.getByRole("button", { name: "Editar el texto" }).click()
  await page.getByLabel("El texto en inglés").fill("Little Bear is very sleepy.")
  await page.getByRole("button", { name: "Guardar los cambios" }).click()
  await expect(page.getByText("El inglés cambió.")).toBeVisible()
  const before = calls.translate.length
  await page.getByRole("button", { name: "Traducir de nuevo" }).click()
  await expect(page.getByText("Cambiaste el español a mano.")).toBeVisible()
  await page.getByRole("button", { name: "Dejar el mío" }).click()
  await expect(page.getByText("Mi osito tiene sueño.")).toBeVisible()
  expect(calls.translate.length).toBe(before)

  // Switch the book to neutral: that dialect is translated on demand…
  await page.getByRole("button", { name: "Las páginas del cuento" }).click()
  await page.getByRole("radio", { name: /Neutral/ }).click()
  await page.getByRole("button", { name: /Seguir en la página|Leer el cuento/ }).click()
  await expect(page.getByText(NEUTRAL_ES)).toBeVisible()
  expect(calls.translate.at(-1)?.dialect).toBe("neutral")
  // …and switching back costs nothing: the Rioplatense row is still there.
  const count = calls.translate.length
  await page.getByRole("button", { name: "Las páginas del cuento" }).click()
  await page.getByRole("radio", { name: /Rioplatense/ }).click()
  await page.getByRole("button", { name: /Seguir en la página|Leer el cuento/ }).click()
  await expect(page.getByText("Mi osito tiene sueño.")).toBeVisible()
  expect(calls.translate.length).toBe(count)
})

test("a full phone says so, with a way forward", async ({ page, context }) => {
  await mockAi(context)
  await context.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "books") throw new DOMException("full", "QuotaExceededError")
      return original.call(this, key, value)
    }
  })
  await openShelf(page)
  await page.getByRole("button", { name: /Escanear un cuento/ }).click()
  await page.getByRole("button", { name: "Sacar la foto de la primera página" }).click()
  await expect(page.getByText(STORAGE_FULL)).toBeVisible()
})

test("no AI key: the page is read on the phone instead", async ({ page, context }) => {
  test.setTimeout(120_000)
  const calls = await mockAi(context, { ocr: "no_key" })
  await openShelf(page)
  await scanFirstPage(page)
  await expect(page.getByText("No podemos leer la foto en línea ahora.")).toBeVisible()
  expect(calls.ocr).toBe(1)
  await page.getByRole("button", { name: "Leer en el teléfono" }).click()
  const english = page.getByLabel("El texto en inglés")
  await expect(english).toBeVisible({ timeout: 90_000 })
  await expect(english).toHaveValue(/Little Bear is sleepy/)
  await expect(english).not.toHaveValue(/^7$/m) // the page number is dropped
})

// --- audits: one green block per screen, 44 px targets, AA text, no em dashes

async function audit(page: Page, label: string, opts: { greens?: number; scope?: string } = {}) {
  const result = await page.evaluate((scope) => {
    const root = ((scope && document.querySelector<HTMLElement>(scope)) || document.body) as HTMLElement
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const rgba = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number)
    const bgOf = (el: Element | null): number[] => {
      while (el) {
        const c = rgba(getComputedStyle(el).backgroundColor)
        if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c
        el = el.parentElement
      }
      return [248, 243, 235]
    }
    const bad: string[] = []
    const small: string[] = []
    for (const el of root.querySelectorAll<HTMLElement>("*")) {
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())
      if (!own || !el.offsetParent) continue
      const style = getComputedStyle(el)
      if (style.visibility === "hidden" || Number(style.opacity) < 0.5) continue
      if ((el as HTMLButtonElement).disabled || el.closest("[disabled]")) continue
      if (el.closest("[data-sonner-toast]")) continue
      const fg = rgba(style.color)
      const bg = bgOf(el)
      const [a, b] = [lum(fg) + 0.05, lum(bg) + 0.05]
      const ratio = Math.max(a, b) / Math.min(a, b)
      if (ratio < 4.5) bad.push(`${el.textContent!.trim().slice(0, 30)} (${ratio.toFixed(2)})`)
      if (parseFloat(style.fontSize) < 12) small.push(el.textContent!.trim().slice(0, 30))
    }
    const targets = [...root.querySelectorAll<HTMLElement>("button, a, [role=button]")]
      .filter((el) => el.offsetParent && el.getAttribute("role") !== "button") // words in the reader are inline text
      .map((el) => ({ t: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30), h: el.getBoundingClientRect().height }))
      .filter((x) => x.h > 0 && x.h < 44)
    const greens = document.querySelectorAll(".clay-green, .clay-green-hero").length
    const dashes = root.innerText.includes("—")
    return { bad, small, targets, greens, dashes }
  }, opts.scope)
  expect(result.bad, `${label}: contrast`).toEqual([])
  expect(result.small, `${label}: text under 12px`).toEqual([])
  expect(result.targets, `${label}: targets under 44px`).toEqual([])
  expect(result.dashes, `${label}: em dash`).toBe(false)
  if (opts.greens !== undefined) expect(result.greens, `${label}: green blocks`).toBe(opts.greens)
}

test("screens pass the design audits", async ({ page, context }) => {
  await mockAi(context)
  await openShelf(page)
  await audit(page, "empty shelf", { greens: 1 })
  await scanFirstPage(page)
  await expect(page.getByLabel("El texto en español")).toBeVisible()
  await audit(page, "review", { greens: 1 })
  await page.getByRole("button", { name: "Guardar en el cuento" }).click()
  await expect(page.getByText("Osito tiene sueño,")).toBeVisible()
  await audit(page, "reader", { greens: 1 })
  await page.getByRole("button", { name: "Luz baja" }).click()
  await audit(page, "reader, luz baja")
  await page.getByRole("button", { name: "Luz baja" }).click()
  await page.getByRole("button", { name: "Las páginas del cuento" }).click()
  await audit(page, "book details", { greens: 1 })
  await page.getByRole("button", { name: "Volver a Cuentos" }).click()
  await audit(page, "shelf", { greens: 1 })
  // Frases: the screen keeps its one green block; the audit covers the new
  // Cuentos row only (the rest of Frases predates Cuentos).
  await page.goto("/app/speak")
  await expect(page.getByRole("link", { name: /Lee sus libros en español/ })).toBeVisible()
  await audit(page, "Frases with the Cuentos row", { greens: 1, scope: "[data-cuentos-row]" })
})

test("drag a missed page into place, with a thumb or the keyboard", async ({ page }) => {
  // Four pages already scanned; the third was missed and added last.
  await page.goto("/app/speak/cuentos")
  await page.evaluate(() => {
    const at = new Date().toISOString()
    const texts = ["One: the moon is up.", "Two: the bear yawns.", "Four: goodnight.", "Three: the missed page."]
    localStorage.setItem("cuentos_note_seen", at)
    localStorage.setItem("books", JSON.stringify([{ id: "b1", title: "Tres osos", dialect: "neutral", lastPageIndex: 2, createdAt: at, updatedAt: at, lastOpenedAt: at }]))
    localStorage.setItem(
      "book_pages",
      JSON.stringify(texts.map((t, i) => ({ id: `p${i}`, bookId: "b1", index: i, photoId: `ph${i}`, thumbId: `th${i}`, sourceText: t, ocrSource: "pasted", createdAt: at, updatedAt: at }))),
    )
  })
  await page.goto("/app/speak/cuentos?libro=b1")
  const order = () => page.locator("ul li").evaluateAll((lis) => lis.map((li) => li.querySelector("p.truncate")?.textContent?.split(":")[0]))
  await expect.poll(order).toEqual(["One", "Two", "Four", "Three"])

  // A thumb: scroll the last page clear of the tab bar, as you would, then
  // touch the grip on "Three" and drag it up above "Four".
  await page.evaluate(() => window.scrollBy(0, 320))
  const grip = page.getByRole("button", { name: "Mover la página 4" })
  const startScroll = await page.evaluate(() => window.scrollY)
  const from = (await grip.boundingBox())!
  const target = (await page.locator("ul li").nth(2).boundingBox())!
  const cdp = await page.context().newCDPSession(page)
  const x = from.x + from.width / 2
  const y = from.y + from.height / 2
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] })
  const endY = target.y + 10
  for (let i = 1; i <= 12; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + ((endY - y) * i) / 12 }] })
    await page.waitForTimeout(16)
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
  await expect.poll(order).toEqual(["One", "Two", "Three", "Four"])
  // The page didn't scroll under the finger, and the reading place followed "Four".
  expect(await page.evaluate(() => window.scrollY)).toBe(startScroll)
  const book = await page.evaluate(() => JSON.parse(localStorage.getItem("books")!)[0])
  expect(book.lastPageIndex).toBe(3)

  // The keyboard: arrow down moves "One" one place, and focus stays on its grip.
  await page.getByRole("button", { name: "Mover la página 1" }).focus()
  await page.keyboard.press("ArrowDown")
  await expect.poll(order).toEqual(["Two", "One", "Three", "Four"])
  await expect(page.getByRole("button", { name: "Mover la página 2" })).toBeFocused()
  await expect(page.getByText("Página movida al lugar 2")).toBeAttached()

  // The order holds after a reload, and the reader follows it.
  await page.reload()
  await expect.poll(order).toEqual(["Two", "One", "Three", "Four"])
})
