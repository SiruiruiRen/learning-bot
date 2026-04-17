/**
 * Stage 2.2 — Condition auto-tagging verification.
 *
 * Goal: prove that every captureToWAL record emitted by the
 * instrumented app automatically includes `condition` and
 * `coach_tone` fields in the payload, read from localStorage.
 *
 * Strategy: seed localStorage with a fake user_id + condition, then
 * navigate to a real instrumented route (/intro). The
 * navigation-tracker that the route inherits will fire
 * captureToWAL("navigation_events", ...) automatically. We then
 * read the local queue and assert the condition tag is present.
 */

import { test, expect, Page } from "@playwright/test"

async function seedLocalStorage(
  page: Page,
  userId: string,
  condition: string | null,
  coachTone: string | null
) {
  await page.addInitScript(
    ({ uid, cond, tone }) => {
      localStorage.setItem("user_id", uid)
      localStorage.setItem("session_id", "00000000-0000-0000-0000-000000000000")
      if (cond) localStorage.setItem("solbot_condition", cond)
      if (tone) localStorage.setItem("solbot_coach_tone", tone)
    },
    { uid: userId, cond: condition, tone: coachTone }
  )
}

async function readLatestCapture(page: Page, userId: string) {
  // Wait for the navigation-tracker's captureToWAL to actually land
  // in localStorage. There's no DOM signal for it, so we poll the
  // queue directly.
  await expect
    .poll(
      async () => {
        return await page.evaluate((uid) => {
          const raw = localStorage.getItem(`sol2l_wal_queue_v1:${uid}`) ?? "[]"
          const q = JSON.parse(raw)
          return q.length
        }, userId)
      },
      { timeout: 15_000, intervals: [250, 500, 1000] }
    )
    .toBeGreaterThan(0)

  return await page.evaluate((uid) => {
    const raw = localStorage.getItem(`sol2l_wal_queue_v1:${uid}`) ?? "[]"
    const q = JSON.parse(raw)
    return q as Array<{ target_table: string; payload: Record<string, unknown> }>
  }, userId)
}

test("navigation-tracker auto-tags condition='bot' + coach_tone='warm'", async ({
  page,
}) => {
  const uid = `stage22-bot-${Date.now()}`
  await seedLocalStorage(page, uid, "bot", "warm")
  await page.goto("/intro", { waitUntil: "commit" })

  const queue = await readLatestCapture(page, uid)
  // Find a navigation_events row (there will be at least one from the
  // page_view fired on route entry).
  const navRow = queue.find((r) => r.target_table === "navigation_events")
  expect(navRow, "expected a navigation_events WAL row").toBeTruthy()
  expect(navRow!.payload).toMatchObject({
    condition: "bot",
    coach_tone: "warm",
  })
})

test("navigation-tracker auto-tags condition='static' (control group)", async ({
  page,
}) => {
  const uid = `stage22-static-${Date.now()}`
  await seedLocalStorage(page, uid, "static", null)
  await page.goto("/intro", { waitUntil: "commit" })

  const queue = await readLatestCapture(page, uid)
  const navRow = queue.find((r) => r.target_table === "navigation_events")
  expect(navRow).toBeTruthy()
  expect(navRow!.payload.condition).toBe("static")
  expect(navRow!.payload.coach_tone).toBeUndefined()
})

test("no condition in localStorage → payload has NO condition field", async ({
  page,
}) => {
  const uid = `stage22-none-${Date.now()}`
  await seedLocalStorage(page, uid, null, null)
  await page.goto("/intro", { waitUntil: "commit" })

  const queue = await readLatestCapture(page, uid)
  const navRow = queue.find((r) => r.target_table === "navigation_events")
  expect(navRow).toBeTruthy()
  // Omission, not guessing. This lets the researcher query SQL
  // section 4 of research_by_condition.sql to find untagged rows.
  expect(navRow!.payload.condition).toBeUndefined()
  expect(navRow!.payload.coach_tone).toBeUndefined()
})
