/**
 * Diagnostic: check if production frontend can actually write to
 * Supabase from the browser. If this fails, either
 *   (a) Render env vars NEXT_PUBLIC_SUPABASE_* are wrong/missing, or
 *   (b) the bundle points to the dead project, or
 *   (c) CORS is blocking.
 */

import { test, expect } from "@playwright/test"

test("production can write to Supabase from browser", async ({ page }) => {
  const consoleLogs: string[] = []
  page.on("console", (m) => consoleLogs.push(`[${m.type()}] ${m.text()}`))
  page.on("pageerror", (e) => consoleLogs.push(`[pageerror] ${e.message}`))

  await page.goto("https://solbot-frontend-7m8l.onrender.com/dev/data-layer-test", {
    waitUntil: "domcontentloaded",
  })
  await page.waitForFunction(
    () =>
      typeof (window as unknown as { __stage1Preflight?: unknown })
        .__stage1Preflight === "function",
    { timeout: 60_000 }
  )

  const result = await page.evaluate(async () => {
    const fn = (
      window as unknown as {
        __stage1Preflight?: () => Promise<{ ok: boolean; detail: string }>
      }
    ).__stage1Preflight
    if (!fn) return { ok: false, detail: "preflight missing" }
    return await fn()
  })

  // Also test an actual write.
  const writeResult = await page.evaluate(async () => {
    const mod = await import(
      "/lib/dataLayerInstrument" as unknown as string
    ).catch((e) => ({ error: String(e) }))
    if ("error" in mod) return { ok: false, detail: `import failed: ${mod.error}` }
    const key = (mod as any).captureToWAL(
      "content_interaction_logs",
      { smoke: true, source: "prod_diagnostic" },
      { participantId: "prod-diag-" + Date.now(), eventType: "prod_diag" }
    )
    return { ok: true, key }
  })

  console.log("=== PRODUCTION DIAGNOSTIC ===")
  console.log("Preflight:", JSON.stringify(result))
  console.log("Write:", JSON.stringify(writeResult))
  console.log("Console output from browser:")
  for (const log of consoleLogs.slice(-20)) console.log("  " + log)

  // Verify: preflight should return ok:true (Supabase reachable +
  // write_ahead_log table exists + anon key valid).
  expect(result.ok, `preflight failed: ${result.detail}`).toBe(true)
})
