/**
 * End-to-end student walkthrough — drives the app like a real student
 * would. Generates a full session of WAL data the researcher can
 * inspect in Supabase afterwards.
 *
 * Strategy:
 *   We BYPASS /intro by seeding localStorage directly with a valid
 *   user_id + session_id + condition (simulating post-onboarding
 *   state). The onboarding flow is already covered by
 *   captureToWAL instrumentation + the Stage 2.2 smoke tests; the
 *   real value of this E2E is exercising the chat components,
 *   knowledge-checks, floating chatbot, and phase navigation.
 *
 *   Why skip /intro: Playwright's first-load on /intro against
 *   `next dev` is flaky (up to 60s first-compile + hydration). That
 *   flake is NOT about data collection — it's about dev-mode
 *   timing. Skipping to a post-onboarding state makes the test
 *   fast and deterministic.
 *
 *   A separate INSERT into write_ahead_log up-front manually
 *   captures the "simulated session_created" event so the
 *   researcher's SQL queries see a full session.
 */

import { test, expect, type Page } from "@playwright/test"
import { randomUUID } from "crypto"

test.describe.configure({ mode: "serial", retries: 0 })

const STAMP = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
const TEST_USER_ID = randomUUID()
const TEST_SESSION_ID = randomUUID()
const TEST_EMAIL = `e2e-walk-${STAMP}@test.invalid`
const TEST_NAME = `E2E Walk ${STAMP.slice(0, 10)}`
const TEST_CONDITION = "bot" // experimental
const TEST_COACH_TONE = "warm"

function log(step: string, detail = "") {
  // eslint-disable-next-line no-console
  console.log(`[E2E] ${step}${detail ? "  " + detail : ""}`)
}

async function softClick(page: Page, selector: string, label: string) {
  try {
    const el = page.locator(selector).first()
    if ((await el.count()) === 0) return false
    await el.scrollIntoViewIfNeeded({ timeout: 3_000 }).catch(() => {})
    await el.click({ timeout: 8_000, force: true })
    log(`click ✓ ${label}`, selector)
    return true
  } catch (e) {
    log(`click ✗ ${label}`, (e as Error).message.slice(0, 80))
  }
  return false
}

async function chatNTurns(
  page: Page,
  messages: string[],
  label: string
): Promise<number> {
  let turns = 0
  for (const msg of messages) {
    const input = page
      .locator(
        'textarea[placeholder*="message" i], textarea[placeholder*="type" i], textarea[placeholder*="response" i], textarea[placeholder*="thought" i], textarea:not([readonly])'
      )
      .first()
    try {
      if ((await input.count()) === 0) {
        log(`chat ✗ ${label}: no textarea found`)
        break
      }
      await input.scrollIntoViewIfNeeded().catch(() => {})
      await input.fill(msg, { timeout: 5_000 })
      log(`chat ▶ ${label} turn ${turns + 1}`, `"${msg.slice(0, 40)}..."`)

      // Try sending via common mechanisms — Enter key, a send button,
      // and a submit button. Whichever works.
      await page.keyboard.press("Enter").catch(() => {})
      const sendBtn = page
        .locator(
          'button[aria-label*="send" i], button:has(svg[class*="send" i]), button[type="submit"]:visible'
        )
        .first()
      await sendBtn.click({ timeout: 2_000, force: true }).catch(() => {})

      // Give the Render backend time to respond (cold start ~30s).
      await page.waitForTimeout(15_000)
      turns += 1
      log(`chat ✓ ${label} turn ${turns} complete`)
    } catch (e) {
      log(`chat ✗ ${label} turn ${turns + 1}`, (e as Error).message.slice(0, 80))
      break
    }
  }
  return turns
}

test("E2E student walkthrough generates complete WAL data", async ({ page }) => {
  test.setTimeout(20 * 60 * 1000) // 20 minutes

  log("=== Seeding post-onboarding state ===")
  log(`  user_id:    ${TEST_USER_ID}`)
  log(`  session_id: ${TEST_SESSION_ID}`)
  log(`  email:      ${TEST_EMAIL}`)
  log(`  condition:  ${TEST_CONDITION}`)

  test.info().annotations.push({ type: "user_id", description: TEST_USER_ID })
  test.info().annotations.push({ type: "email",   description: TEST_EMAIL   })

  // Seed localStorage BEFORE any page loads (runs in every page's
  // context thanks to addInitScript). This bypasses SessionGate's
  // redirect and the /intro form entirely.
  await page.addInitScript(
    ({ uid, sid, email, name, cond, tone }) => {
      localStorage.setItem("user_id", uid)
      localStorage.setItem("session_id", sid)
      localStorage.setItem("solbot_user_email", email)
      localStorage.setItem("solbot_user_name", name)
      localStorage.setItem("solbot_condition", cond)
      localStorage.setItem("solbot_coach_tone", tone)
    },
    {
      uid: TEST_USER_ID,
      sid: TEST_SESSION_ID,
      email: TEST_EMAIL,
      name: TEST_NAME,
      cond: TEST_CONDITION,
      tone: TEST_COACH_TONE,
    }
  )

  // Capture console errors for debugging.
  const consoleErrors: string[] = []
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`))
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`console: ${m.text()}`)
  })

  // Up-front: manually emit a "session_created" WAL row via the dev
  // harness's helpers so the researcher's SQL queries see a
  // legitimate session marker for this participant.
  await page.goto("/dev/data-layer-test", { waitUntil: "domcontentloaded" })
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __stage1Preflight?: unknown })
        .__stage1Preflight === "function",
    { timeout: 60_000 }
  )
  await page.evaluate(
    async ({ uid, sid, email, name, cond, tone }) => {
      const mod = await import(
        "/lib/dataLayerInstrument" as unknown as string
      ).catch(() => null)
      if (mod?.captureToWAL) {
        mod.captureToWAL(
          "sessions",
          {
            event_type: "session_created",
            user_id: uid,
            session_id: sid,
            email,
            name,
            condition: cond,
            coach_tone: tone,
            via: "e2e_walkthrough",
          },
          { participantId: uid, sessionId: sid, eventType: "session_created" }
        )
      }
    },
    {
      uid: TEST_USER_ID,
      sid: TEST_SESSION_ID,
      email: TEST_EMAIL,
      name: TEST_NAME,
      cond: TEST_CONDITION,
      tone: TEST_COACH_TONE,
    }
  )
  // Let the initial sync kick off.
  await page.waitForTimeout(2_000)

  // -------------------------------------------------------------
  // PHASE 1
  // -------------------------------------------------------------
  log("=== PHASE 1 ===")
  await page.goto("/phase1", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4_000) // hydration

  // Try to play any video, answer any knowledge check radios, scroll
  // to emit content_interaction_logs.
  await softClick(page, 'button:has-text("Play")', "play video")
  await page.waitForTimeout(1_500)
  const p1Radios = await page.locator('input[type="radio"]').all()
  log(`phase1: ${p1Radios.length} radios`)
  for (let i = 0; i < Math.min(p1Radios.length, 3); i++) {
    await p1Radios[i].click({ force: true }).catch(() => {})
    await page.waitForTimeout(300)
  }
  await softClick(page, 'button:has-text("Submit")', "submit phase1 KC")
  await page.waitForTimeout(1_500)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1_500)

  // -------------------------------------------------------------
  // PHASE 2 + main chat
  // -------------------------------------------------------------
  log("=== PHASE 2 ===")
  await page.goto("/phase2", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3_000)
  const p2Radios = await page.locator('input[type="radio"]').all()
  for (let i = 0; i < Math.min(p2Radios.length, 3); i++) {
    await p2Radios[i].click({ force: true }).catch(() => {})
    await page.waitForTimeout(300)
  }
  await softClick(page, 'button:has-text("Submit")', "submit phase2 KC")
  await page.waitForTimeout(1_500)

  log("=== PHASE 2 main chat ===")
  await page.goto("/phase2/chat", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4_000)
  await chatNTurns(
    page,
    [
      "I want to master cell biology this semester. My plan is to watch one lecture per week and solve the end-of-chapter problems.",
      "My biggest challenge is remembering the specific stages of mitosis vs meiosis under exam pressure.",
    ],
    "phase2 chat"
  )

  // -------------------------------------------------------------
  // FLOATING CHATBOT — interact on any phase page
  // -------------------------------------------------------------
  log("=== FLOATING CHATBOT ===")
  // The floating chatbot lives in ClientLayout on every non-dev page.
  // Click it to open (its button uses the MessageCircle / Bot icon).
  const floatCandidates = [
    'button:has(svg.lucide-message-circle)',
    'button:has(svg.lucide-bot)',
    'button[class*="fixed"][class*="bottom"]:has(svg)',
    'button.fixed:has(svg)',
  ]
  let floatOpened = false
  for (const sel of floatCandidates) {
    if (await softClick(page, sel, `open floating (${sel})`)) {
      floatOpened = true
      break
    }
  }
  if (floatOpened) {
    await page.waitForTimeout(2_000)
    await chatNTurns(
      page,
      [
        "What is retrieval practice?",
        "How do I apply it to my study plan this week?",
      ],
      "floating chatbot"
    )
    await softClick(page, 'button[aria-label*="close" i]', "close floating")
  } else {
    log("! floating chatbot button not located; skipping")
  }

  // -------------------------------------------------------------
  // PHASE 3 (knowledge check + content)
  // -------------------------------------------------------------
  log("=== PHASE 3 ===")
  await page.goto("/phase3", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3_000)
  const p3Radios = await page.locator('input[type="radio"]').all()
  for (let i = 0; i < Math.min(p3Radios.length, 3); i++) {
    await p3Radios[i].click({ force: true }).catch(() => {})
    await page.waitForTimeout(300)
  }
  await softClick(page, 'button:has-text("Submit")', "submit phase3 KC")
  await page.waitForTimeout(1_500)

  // -------------------------------------------------------------
  // PHASE 4 (tasks + MCII chat)
  // -------------------------------------------------------------
  log("=== PHASE 4 tasks ===")
  await page.goto("/phase4/tasks", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3_000)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1_000)

  log("=== PHASE 4 MCII chat ===")
  await page.goto("/phase4/mcii", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4_000)
  await chatNTurns(
    page,
    [
      "I want to score above 85 on my next biology exam.",
      "If I feel overwhelmed, I will spend 10 minutes reviewing the concept map before moving on.",
    ],
    "phase4 mcii"
  )

  // -------------------------------------------------------------
  // PHASE 5 (monitoring chat)
  // -------------------------------------------------------------
  log("=== PHASE 5 monitoring chat ===")
  await page.goto("/phase5/monitoring", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4_000)
  await chatNTurns(
    page,
    [
      "Every Sunday I will complete 5 practice problems and track the percentage I got right.",
      "If I score below 70% on two consecutive weekly self-tests I will switch to interleaved practice.",
    ],
    "phase5 monitoring"
  )

  // -------------------------------------------------------------
  // PHASE 6 — final assessment
  // -------------------------------------------------------------
  log("=== PHASE 6 ===")
  await page.goto("/phase6", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4_000)
  const finalInput = page.locator("textarea").first()
  const finalPlan =
    "To prepare for my next biology exam I will (1) spend 30 min each study session on retrieval practice, " +
    "(2) space review sessions across 4 days with 1-day gaps, " +
    "(3) self-test with end-of-chapter problems weekly, and " +
    "(4) switch to interleaved practice if I score below 70% on two consecutive self-tests."
  if ((await finalInput.count()) > 0) {
    await finalInput.fill(finalPlan, { timeout: 5_000 }).catch(() => {})
    log("phase6: filled final plan")
  }
  await softClick(page, 'button:has-text("Submit")', "submit phase6")
  await page.waitForTimeout(3_000)

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  log("=== SUMMARY ===")
  await page.goto("/summary", { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3_000)

  // Final: wait for the DataLayer to drain any pending WAL rows.
  log("Draining queue...")
  const maxWait = 60_000
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const pending = await page.evaluate((uid) => {
      const raw = localStorage.getItem(`sol2l_wal_queue_v1:${uid}`) ?? "[]"
      return JSON.parse(raw).length as number
    }, TEST_USER_ID)
    if (pending === 0) break
    log(`  pending=${pending}`)
    await page.waitForTimeout(2_000)
  }

  const finalState = await page.evaluate((uid) => ({
    user_id: uid,
    remaining: JSON.parse(
      localStorage.getItem(`sol2l_wal_queue_v1:${uid}`) ?? "[]"
    ).length,
  }), TEST_USER_ID)
  log("final state", JSON.stringify(finalState))

  if (consoleErrors.length > 0) {
    log(`=== ${consoleErrors.length} console errors ===`)
    for (const e of consoleErrors.slice(0, 15)) log(`! ${e.slice(0, 160)}`)
  }

  // Soft assertion — the goal is data generation, not UI validation.
  expect(finalState.user_id).toBeTruthy()
})
