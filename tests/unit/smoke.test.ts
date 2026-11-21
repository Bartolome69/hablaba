import { describe, expect, it } from "vitest"
import { containsVoseo } from "@/lib/voseo"

// Proves the harness: the @/ alias resolves and jsdom storage is reset.
describe("test harness", () => {
  it("resolves @/ imports", () => {
    expect(containsVoseo("¿Lo podés repetir?")).toBe(true)
    expect(containsVoseo("¿Lo puedes repetir?")).toBe(false)
  })
  it("starts each test with empty storage", () => {
    expect(localStorage.length).toBe(0)
    localStorage.setItem("x", "1")
  })
})
