"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useRef } from "react"

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

export default function NavigationTracker() {
  const pathname = usePathname()
  const previousPathname = useRef<string | null>(null)
  const pageStartTime = useRef<number>(Date.now())

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        const sessionId = localStorage.getItem("session_id")

        const currentTime = Date.now()
        const timeOnPreviousPage = previousPathname.current 
          ? Math.round((currentTime - pageStartTime.current) / 1000) 
          : 0

        // Detect phase from pathname
        const phaseMatch = pathname.match(/\/phase(\d+)/)
        const currentPhase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"
        
        const prevPhaseMatch = previousPathname.current?.match(/\/phase(\d+)/)
        const previousPhase = prevPhaseMatch ? `phase${prevPhaseMatch[1]}` : "unknown"

        const payload = {
          phase: currentPhase,
          component: "navigation",
          metadata: {
            pathname: pathname,
            previous_pathname: previousPathname.current,
            from_phase: previousPhase,
            to_phase: currentPhase,
            time_on_previous_page_seconds: timeOnPreviousPage,
            timestamp: new Date().toISOString(),
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
              value: "page_view",
              metadata: payload,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("Failed to log anonymous page view:", response.status, errorText)
          }
        } else {
          const response = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              event_type: "page_view",
              ...payload,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.warn("Failed to log page view:", response.status)
          }
        }

        // Update refs
        previousPathname.current = pathname
        pageStartTime.current = currentTime
      } catch (error) {
        console.warn("Failed to log page view:", error)
      }
    }

    trackPageView()
  }, [pathname])

  // Track Next button clicks specifically
  useEffect(() => {
    const handleButtonClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const button = target.closest('button')
      
      if (!button) return

      const buttonText = button.textContent?.trim() || ''
      const isNextButton = buttonText.toLowerCase().includes('next') || 
                          buttonText.toLowerCase().includes('continue') ||
                          buttonText.toLowerCase().includes('proceed')

      if (isNextButton) {
        try {
          const sessionId = localStorage.getItem("session_id")

          const phaseMatch = pathname.match(/\/phase(\d+)/)
          const currentPhase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"

          // Determine next phase (if navigating to next phase)
          let nextPhase = currentPhase
          if (buttonText.toLowerCase().includes('phase')) {
            const phaseMatch = buttonText.match(/phase\s*(\d+)/i)
            if (phaseMatch) {
              nextPhase = `phase${phaseMatch[1]}`
            }
          }

          const timeOnPage = Math.round((Date.now() - pageStartTime.current) / 1000)

          const payload = {
            phase: currentPhase,
            component: "navigation",
            metadata: {
              button_text: buttonText,
              button_id: button.id || null,
              from_path: pathname,
              from_phase: currentPhase,
              to_phase: nextPhase,
              time_on_page_seconds: timeOnPage,
              timestamp: new Date().toISOString(),
            },
          }

          if (!sessionId) {
            const anonId = getOrCreateAnonId()
            const response = await fetch("/api/user-data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: anonId,
                dataType: "event",
                value: "next_button",
                metadata: payload,
              }),
            })
            if (!response.ok) {
              const errorText = await response.text()
              console.error("Failed to log anonymous next button:", response.status, errorText)
            }
          } else {
            console.log('🔘 Next button clicked:', {
              buttonText: buttonText,
              from: currentPhase,
              to: nextPhase,
              timeOnPage: timeOnPage + 's'
            })

            const response = await fetch("/api/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                session_id: sessionId,
                event_type: "next_button",
                ...payload,
              }),
            })
            if (!response.ok) {
              const errorText = await response.text()
              console.error("Failed to log next button click:", response.status, errorText)
            } else {
              console.log('✅ Next button logged to database')
            }
          }
        } catch (error) {
          console.error("Failed to log next button click:", error)
        }
      }
    }

    document.addEventListener('click', handleButtonClick)
    return () => {
      document.removeEventListener('click', handleButtonClick)
    }
  }, [pathname])

  return null
}
