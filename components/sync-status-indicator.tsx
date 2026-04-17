/**
 * Stage 2 — Sync status indicator (production UX).
 *
 * A small, unobtrusive badge in the bottom-right corner that shows
 * whether any write-ahead-log events are pending sync. Rendered only
 * when the queue is non-empty — when everything is synced, it hides.
 *
 * Students see:
 *   - Queue empty:              (nothing shown)
 *   - Queue non-empty, online:  "⏳ Saving N item(s)…"
 *   - Queue non-empty, offline: "⚠ Offline — N item(s) waiting"
 *
 * This component is safe to include at the root (ClientLayout). It
 * only mounts in the browser, reads the shared DataLayer singleton,
 * and listens for queue-size changes.
 *
 * Why this matters: without the indicator, a student who finishes a
 * phase and clicks "Next" doesn't know if the data has actually
 * landed. With the indicator, they know to wait (or see a clear
 * offline warning).
 */

"use client"

import { useEffect, useState } from "react"
import { getInstrumentedDataLayer } from "@/lib/dataLayerInstrument"

export function SyncStatusIndicator() {
  const [pending, setPending] = useState(0)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Track online/offline state.
    setOnline(navigator.onLine)
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)

    // Poll for the DataLayer to become available (it only exists
    // after the student has a user_id in localStorage — typically
    // after onboarding).
    let unsubscribe: (() => void) | null = null
    let attempts = 0
    const tryAttach = () => {
      const dl = getInstrumentedDataLayer()
      if (dl) {
        unsubscribe = dl.subscribe((n) => setPending(n))
      } else if (attempts < 30) {
        attempts += 1
        setTimeout(tryAttach, 1000)
      }
    }
    tryAttach()

    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
      unsubscribe?.()
    }
  }, [])

  if (pending === 0) return null

  const isOffline = !online
  const bg = isOffline ? "#b45309" : "#0369a1"
  const icon = isOffline ? "⚠" : "⏳"
  const label = isOffline
    ? `Offline — ${pending} item${pending === 1 ? "" : "s"} waiting`
    : `Saving ${pending} item${pending === 1 ? "" : "s"}…`

  return (
    <div
      data-testid="sync-status-indicator"
      data-pending-count={pending}
      data-online={online}
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: bg,
        color: "white",
        fontSize: 13,
        padding: "6px 12px",
        borderRadius: 999,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {icon} {label}
    </div>
  )
}
