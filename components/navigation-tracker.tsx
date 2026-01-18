"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useRef } from "react"

export default function NavigationTracker() {
  const pathname = usePathname()
  const router = useRouter()
  const previousPathname = useRef<string | null>(null)
  const pageStartTime = useRef<number>(Date.now())

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        const sessionId = localStorage.getItem("session_id")
        const userId = localStorage.getItem("user_id") || localStorage.getItem("userId")
        if (!sessionId) return

        const currentTime = Date.now()
        const timeOnPreviousPage = previousPathname.current 
          ? Math.round((currentTime - pageStartTime.current) / 1000) 
          : 0

        // Detect phase from pathname
        const phaseMatch = pathname.match(/\/phase(\d+)/)
        const currentPhase = phaseMatch ? `phase${phaseMatch[1]}` : "unknown"
        
        const prevPhaseMatch = previousPathname.current?.match(/\/phase(\d+)/)
        const previousPhase = prevPhaseMatch ? `phase${prevPhaseMatch[1]}` : "unknown"

        // Track page view
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            event_type: 'page_view',
            phase: currentPhase,
            component: 'navigation',
            metadata: {
              pathname: pathname,
              previous_pathname: previousPathname.current,
              from_phase: previousPhase,
              to_phase: currentPhase,
              time_on_previous_page_seconds: timeOnPreviousPage,
              timestamp: new Date().toISOString()
            }
          })
        })

        // Update refs
        previousPathname.current = pathname
        pageStartTime.current = currentTime
      } catch (error) {
        console.error("Failed to log page view:", error)
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
          const userId = localStorage.getItem("user_id") || localStorage.getItem("userId")
          if (!sessionId) return

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

          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              event_type: 'next_button',
              phase: currentPhase,
              component: 'navigation',
              metadata: {
                button_text: buttonText,
                button_id: button.id || null,
                from_path: pathname,
                from_phase: currentPhase,
                to_phase: nextPhase,
                time_on_page_seconds: timeOnPage,
                timestamp: new Date().toISOString()
              }
            })
          })
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
