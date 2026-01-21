"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

function getOrCreateAnonId(): string {
  try {
    const existing = localStorage.getItem("solbot_anon_id")
    if (existing) return existing
    const created =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Math.random().toString(16).slice(2)}-${Date.now()}`
    localStorage.setItem("solbot_anon_id", created)
    return created
  } catch {
    return `anon-${Math.random().toString(16).slice(2)}-${Date.now()}`
  }
}

export default function ClickTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const handleClick = async (event: MouseEvent) => {
      try {
        const sessionId = localStorage.getItem("session_id")

        const target = event.target as HTMLElement
        const targetElement = {
          tag: target.tagName.toLowerCase(),
          id: target.id || null,
          className: target.className || null,
          text: target.textContent?.slice(0, 100) || null,
          href: (target as HTMLAnchorElement).href || null,
        }

        // Detect phase from pathname
        const phaseMatch = pathname.match(/\/phase(\d+)/)
        const phase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"

        const payload = {
          phase: phase,
          component: "page_interaction",
          metadata: {
            pathname: pathname,
            target_element: targetElement,
            timestamp: new Date().toISOString(),
            x_position: event.clientX,
            y_position: event.clientY,
          },
        }

        // If the intervention session hasn't started yet, track anonymously via /api/user-data.
        if (!sessionId) {
          const anonId = getOrCreateAnonId()
          const response = await fetch("/api/user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: anonId,
              dataType: "event",
              value: "user_click",
              metadata: payload,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("Failed to log anonymous click:", response.status, errorText)
          }
          return
        }

        const response = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: "user_click",
            ...payload,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Failed to log click:", response.status, errorText)
        }
      } catch (error) {
        console.error("Failed to log click:", error)
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [pathname])

  return null
}
