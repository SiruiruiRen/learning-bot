/**
 * Stage 1 — Playwright persona suite.
 *
 * Goal: prove the DataLayer never loses data under a spectrum of
 * realistic browser conditions. Each persona:
 *   1. Loads /dev/data-layer-test with a fresh participant id.
 *   2. Exercises a scenario.
 *   3. Asserts localStorage is empty after sync (= everything landed).
 *   4. Emits the participant id to the report so the operator can
 *      cross-check Supabase with database/verify_data_layer.sql.
 *
 * How to run (assumes `npm run dev` is live on :3004 and the migration
 * 008_write_ahead_log.sql has been applied to Supabase):
 *
 *     npx playwright test tests/data-layer/
 *
 * Override the base URL for a deployed staging env:
 *
 *     STAGE1_BASE_URL=https://staging.example.com npx playwright test tests/data-layer/
 */

import { test, expect, Page } from "@playwright/test"

// Generates a unique participant id per run so reruns don't collide.
function newPid(label: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `stage1-persona-${label}-${ts}-${rand}`
}

/**
 * Pre-flight: confirm the `write_ahead_log` table is reachable before
 * running the personas. If the migration hasn't been applied, every
 * persona test would otherwise time out at 30s with an opaque "queue
 * is still non-empty" message. This check produces a clear, early
 * failure instead.
 */
test.beforeAll(async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  try {
    await page.goto("/dev/data-layer-test")
    await expect(page.getByTestId("participant-id")).toBeVisible()

    // The test page exposes window.__stage1Preflight for us. It runs
    // the same Supabase client the DataLayer uses and reports a
    // structured result.
    const result: { ok: boolean; detail: string } = await page.evaluate(
      async () => {
        const fn = (
          window as unknown as {
            __stage1Preflight?: () => Promise<{ ok: boolean; detail: string }>
          }
        ).__stage1Preflight
        if (!fn) {
          return {
            ok: false,
            detail:
              "window.__stage1Preflight missing — test page did not mount the helper.",
          }
        }
        return await fn()
      }
    )

    if (!result.ok) {
      // Throw so every test is marked as blocked rather than each
      // timing out independently.
      throw new Error(
        [
          "",
          "╔══════════════════════════════════════════════════════════════════╗",
          "║  Stage 1 pre-flight failed — write_ahead_log is unreachable.     ║",
          "╚══════════════════════════════════════════════════════════════════╝",
          "",
          `Detail: ${result.detail}`,
          "",
          "Fix:",
          "  1. Open Supabase SQL Editor for project moowjbwvntdsrrgxbtal.",
          "  2. Paste database/migrations/008_write_ahead_log.sql and run.",
          "  3. Re-run: npx playwright test tests/data-layer/",
          "",
        ].join("\n")
      )
    }
  } finally {
    await ctx.close()
  }
})

/**
 * Prime the test page so it uses the given participant id BEFORE the
 * DataLayer is constructed. We set localStorage during the initial
 * navigation via an init script, then load the page.
 */
async function openWithParticipant(page: Page, pid: string) {
  await page.addInitScript((id) => {
    localStorage.setItem("stage1_dev_pid", id)
  }, pid)
  await page.goto("/dev/data-layer-test")
  await expect(page.getByTestId("participant-id")).toHaveText(pid)
}

/**
 * Wait until the sync indicator reads 0 pending (all flushed). Uses the
 * data-pending-count attribute rather than parsing the label, so this
 * is robust to copy changes.
 */
async function waitUntilFlushed(page: Page, timeoutMs = 30_000) {
  await expect
    .poll(
      async () =>
        Number(
          await page
            .getByTestId("sync-indicator")
            .getAttribute("data-pending-count")
        ),
      { timeout: timeoutMs, intervals: [250, 500, 1000] }
    )
    .toBe(0)
}

/** Verify the localStorage queue is gone. Defence-in-depth vs. UI lying. */
async function assertLocalStorageClean(page: Page, pid: string) {
  const leftover = await page.evaluate((id) => {
    const queueKey = `sol2l_wal_queue_v1:${id}`
    const failedKey = `${queueKey}:failed`
    return {
      queue: localStorage.getItem(queueKey),
      failed: localStorage.getItem(failedKey),
    }
  }, pid)

  // An empty JSON array counts as "clean" — the DataLayer writes "[]"
  // when the last item is dequeued, which is fine.
  const queueEmpty =
    leftover.queue === null ||
    leftover.queue === "[]" ||
    (() => {
      try {
        return Array.isArray(JSON.parse(leftover.queue ?? ""))
          ? JSON.parse(leftover.queue ?? "[]").length === 0
          : false
      } catch {
        return false
      }
    })()

  expect(queueEmpty, `queue should be empty, got ${leftover.queue}`).toBe(true)
  expect(
    leftover.failed,
    `no records should have been archived as failed; got ${leftover.failed}`
  ).toBeNull()
}

// ---------------------------------------------------------------------
// P1 — fast completer
// ---------------------------------------------------------------------

test("P1 · fast completer: 12 events land in Supabase", async ({ page }) => {
  const pid = newPid("fast")
  test.info().annotations.push({ type: "participant", description: pid })

  await openWithParticipant(page, pid)
  await page.getByTestId("run-fast").click()

  await waitUntilFlushed(page)
  await assertLocalStorageClean(page, pid)
})

// ---------------------------------------------------------------------
// P2 — thoughtful student
// ---------------------------------------------------------------------

test("P2 · thoughtful student: 18 events across 6 phases", async ({ page }) => {
  const pid = newPid("thoughtful")
  test.info().annotations.push({ type: "participant", description: pid })

  await openWithParticipant(page, pid)
  await page.getByTestId("run-thoughtful").click()

  // Thoughtful persona uses deliberate sleeps totalling ~5s; allow headroom.
  await waitUntilFlushed(page, 45_000)
  await assertLocalStorageClean(page, pid)
})

// ---------------------------------------------------------------------
// P3 — disruptive (tab-switch + page reload)
// ---------------------------------------------------------------------

test("P3 · disruptive student survives reload mid-queue", async ({ page }) => {
  const pid = newPid("disruptive")
  test.info().annotations.push({ type: "participant", description: pid })

  await openWithParticipant(page, pid)

  // Force offline so nothing drains yet.
  await page.getByTestId("force-offline-toggle").check()

  await page.getByTestId("run-disruptive").click()
  // Wait for the two user_inputs + phase_entered to enqueue.
  await expect
    .poll(async () =>
      Number(
        await page
          .getByTestId("sync-indicator")
          .getAttribute("data-pending-count")
      )
    )
    .toBeGreaterThanOrEqual(3)

  // Reload the tab — this is the destructive event. If localStorage is
  // doing its job, the queue survives and drains once we re-enable
  // Supabase.
  await page.reload()
  await expect(page.getByTestId("participant-id")).toHaveText(pid)

  // Queue should still be non-empty after reload.
  const postReload = Number(
    await page.getByTestId("sync-indicator").getAttribute("data-pending-count")
  )
  expect(postReload).toBeGreaterThanOrEqual(3)

  // Turn offline toggle OFF (it resets after reload since it's component state),
  // then drain.
  await page.getByTestId("drain-now").click()
  await waitUntilFlushed(page)
  await assertLocalStorageClean(page, pid)
})

// ---------------------------------------------------------------------
// P4 — offline interlude, then reconnect
// ---------------------------------------------------------------------

test("P4 · offline interlude: queue survives, drains on reconnect", async ({
  page,
}) => {
  const pid = newPid("offline")
  test.info().annotations.push({ type: "participant", description: pid })

  await openWithParticipant(page, pid)

  // Go "offline" via the UI toggle (forces a null Supabase client).
  await page.getByTestId("force-offline-toggle").check()

  await page.getByTestId("run-offline").click()
  // All 5 click events should be stuck pending.
  await expect
    .poll(async () =>
      Number(
        await page
          .getByTestId("sync-indicator")
          .getAttribute("data-pending-count")
      )
    )
    .toBe(5)

  // Flip back online and drain.
  await page.getByTestId("force-offline-toggle").uncheck()
  await page.getByTestId("drain-now").click()

  await waitUntilFlushed(page)
  await assertLocalStorageClean(page, pid)
})

// ---------------------------------------------------------------------
// P5 — slow LLM call
// ---------------------------------------------------------------------

test("P5 · slow LLM: all 3 turns captured across 3s latency", async ({
  page,
}) => {
  const pid = newPid("slow-llm")
  test.info().annotations.push({ type: "participant", description: pid })

  await openWithParticipant(page, pid)
  await page.getByTestId("run-slow_llm").click()

  // Persona sleeps 3s; give it generous headroom.
  await waitUntilFlushed(page, 45_000)
  await assertLocalStorageClean(page, pid)
})

// ---------------------------------------------------------------------
// Cross-persona: emit participant ids to a file so the operator can
// feed them to verify_data_layer.sql in one shot.
// ---------------------------------------------------------------------

test.afterAll(async () => {
  // Intentionally empty — Playwright HTML report surfaces the
  // annotations we pushed above. The operator pastes them into the
  // verify script (see docs/stage-1-datalayer.md).
})
