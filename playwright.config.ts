/**
 * Stage 1 — Playwright config scoped to the DataLayer test suite only.
 *
 * Runs against `npm run dev` on port 3004 (see package.json). We do
 * NOT launch a test server automatically — the assumption is that the
 * developer has `npm run dev` running already and has a fresh
 * `write_ahead_log` table. This keeps the harness simple and avoids
 * interfering with the real dev server lifecycle.
 *
 * Scope: `tests/data-layer/**`. No other folder is picked up.
 */

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/data-layer",
  fullyParallel: false, // sequential so we can reason about queue state
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.STAGE1_BASE_URL ?? "http://localhost:3004",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
