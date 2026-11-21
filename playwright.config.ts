import { defineConfig, devices } from "@playwright/test"

// End-to-end tests at phone size against a production build. AI routes are
// mocked in each test, so no key is needed and nothing costs money.
//
//   npm run build && npm run test:e2e
//
// The first run on a new machine needs a browser: npx playwright install chromium
const PORT = Number(process.env.E2E_PORT ?? 3100)

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Pixel 7"],
    viewport: { width: 390, height: 844 },
    locale: "en-GB",
    trace: "off",
  },
  projects: [{ name: "phone", use: { browserName: "chromium" } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
