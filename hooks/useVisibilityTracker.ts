"use client"

import { useEffect, useRef } from "react"

/**
 * Tracks when users leave and return to the page.
 * Logs events to /api/events for research analytics.
 * Uses document.visibilitychange and beforeunload.
 */
export function useVisibilityTracker() {
  const hiddenAtRef = useRef<number | null>(null)
  const pageLoadTimeRef = useRef<number>(Date.now())
  const totalActiveTimeRef = useRef<number>(0)
  const lastVisibleTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (typeof document === "undefined") return

    const sessionId = localStorage.getItem("session_id")
    if (!sessionId) return

    const getCurrentPage = () => {
      return typeof window !== "undefined" ? window.location.pathname : "unknown"
    }

    const logEvent = (eventType: string, metadata: Record<string, any>) => {
      try {
        fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: eventType,
            phase: getCurrentPage().match(/\/phase(\d+)/)?.[0]?.replace("/", "") || undefined,
            component: "visibility_tracker",
            metadata: {
              ...metadata,
              page: getCurrentPage(),
              timestamp: new Date().toISOString(),
            },
          }),
        }).catch(() => {})
      } catch {
        // Silently fail — analytics should never break the app
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page
        hiddenAtRef.current = Date.now()
        // Update total active time
        totalActiveTimeRef.current += (Date.now() - lastVisibleTimeRef.current) / 1000

        logEvent("user_left_page", {
          time_on_page_seconds: Math.round(
            (Date.now() - pageLoadTimeRef.current) / 1000
          ),
          total_active_time_seconds: Math.round(totalActiveTimeRef.current),
        })
      } else {
        // User returned to the page
        const awayDuration = hiddenAtRef.current
          ? Math.round((Date.now() - hiddenAtRef.current) / 1000)
          : 0
        hiddenAtRef.current = null
        lastVisibleTimeRef.current = Date.now()

        logEvent("user_returned_to_page", {
          away_duration_seconds: awayDuration,
          total_active_time_seconds: Math.round(totalActiveTimeRef.current),
        })
      }
    }

    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery during page unload
      const payload = JSON.stringify({
        session_id: sessionId,
        event_type: "user_left_page",
        component: "visibility_tracker",
        metadata: {
          page: getCurrentPage(),
          reason: "page_unload",
          time_on_page_seconds: Math.round(
            (Date.now() - pageLoadTimeRef.current) / 1000
          ),
          total_active_time_seconds: Math.round(
            totalActiveTimeRef.current +
              (Date.now() - lastVisibleTimeRef.current) / 1000
          ),
          timestamp: new Date().toISOString(),
        },
      })

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/events",
          new Blob([payload], { type: "application/json" })
        )
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])
}
