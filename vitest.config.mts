import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Unit tests (Cuentos Phase 1 brought the first ones). Pure logic and stores;
// anything that needs a real browser belongs in tests/e2e (Playwright).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "jsdom",
    setupFiles: ["tests/unit/setup.ts"],
  },
})
