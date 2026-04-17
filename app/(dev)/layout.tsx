/**
 * Stage 1 — Dev-only route group layout.
 *
 * Pages under `app/(dev)/` use THIS layout instead of the top-level
 * `ClientLayout`. We deliberately skip:
 *   - UserDataTracker / ClickTracker / NavigationTracker / VisibilityTracker
 *     (they POST to /api/events which is rewritten to the Render
 *     backend; a cold Render dyno can hold those connections open for
 *     30 seconds, indirectly starving our test page)
 *   - FloatingChatbot (depends on session state we don't care about
 *     in the DataLayer harness)
 *   - SessionGate (would redirect /dev routes to /intro — we bypass
 *     that using Playwright's addInitScript to seed session_id, but
 *     skipping the gate entirely is cleaner for this isolated tool)
 *
 * The parenthesised folder name is a Next.js "route group" — it
 * affects the layout tree but NOT the URL. So
 * `app/(dev)/dev/data-layer-test/page.tsx` is still served at
 * `/dev/data-layer-test`.
 */

import type React from "react"

export default function DevLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
