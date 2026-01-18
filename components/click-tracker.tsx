"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function ClickTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const handleClick = async (event: MouseEvent) => {
      try {
        const sessionId = localStorage.getItem("session_id")
        if (!sessionId) return

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

        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: 'user_click',
            phase: phase,
            component: 'page_interaction',
            metadata: {
              pathname: pathname,
              target_element: targetElement,
              timestamp: new Date().toISOString(),
              x_position: event.clientX,
              y_position: event.clientY
            }
          })
        })
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
