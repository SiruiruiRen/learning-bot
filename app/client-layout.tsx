"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { usePathname, useRouter } from "next/navigation"
import { UserDataTracker } from "@/components/UserDataTracker"
import { ThemeToggle } from "@/components/theme-toggle"
import FloatingChatbot from "@/components/floating-chatbot"
import ClickTracker from "@/components/click-tracker"
import NavigationTracker from "@/components/navigation-tracker"
import VisibilityTracker from "@/components/visibility-tracker"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { useEffect } from "react"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      disableTransitionOnChange
    >
      {children}
      <DevAwareAmbient />
    </ThemeProvider>
  )
}

/**
 * Renders the session-wide ambient components (trackers, chatbot,
 * session gate) only when NOT on a /dev/* route. Stage 1's
 * DataLayer test harness lives under /dev/data-layer-test and must
 * not drag in the trackers — they POST to /api/events which is
 * rewritten to the Render backend, and a cold Render dyno can keep
 * those connections open for 30+ seconds, indirectly starving the
 * test page's first compile.
 */
function DevAwareAmbient() {
  const pathname = usePathname()
  if (pathname?.startsWith("/dev/")) return null
  return (
    <>
      <SessionGate />
      <UserDataTracker />
      <ThemeToggle />
      <FloatingChatbotWrapper />
      <ClickTracker />
      <NavigationTracker />
      <VisibilityTracker />
      <Toaster position="top-center" richColors />
    </>
  )
}

// Client component to conditionally render the floating chatbot
function FloatingChatbotWrapper() {
  const pathname = usePathname()

  // Detect current phase from pathname
  const phaseMatch = pathname.match(/\/phase(\d+)/)
  const currentPhase = phaseMatch ? `phase${phaseMatch[1]}` : "default"

  // Don't show on landing page only
  if (pathname === "/landing" || pathname === "/") {
    return null
  }

  // Hide for static condition — they have no chatbot access
  if (typeof window !== "undefined" && localStorage.getItem("solbot_condition") === "static") {
    return null
  }

  // key={pathname} forces React to fully unmount/remount on page change,
  // ensuring fresh messages state and per-page suggested questions
  return <FloatingChatbot key={pathname} currentPhase={currentPhase} />
}

/**
 * PhaseGuard — enforces strict phase ordering + session gate.
 * 1. Checks session_id exists (redirect to /intro if not)
 * 2. Checks previous phases are completed (redirect to correct phase if not)
 *
 * Completion flags: solbot_phase{N}_completed = "true" in localStorage
 */
function SessionGate() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Allow public entry points
    if (pathname === "/" || pathname === "/landing" || pathname === "/intro") return
    if (pathname.startsWith("/api/")) return

    try {
      const sessionId = localStorage.getItem("session_id")
      if (!sessionId) {
        router.replace("/intro")
        return
      }

      // Phase order enforcement
      const phaseMatch = pathname.match(/\/phase(\d+)/)
      if (phaseMatch) {
        const targetPhase = parseInt(phaseMatch[1])
        // Phase 1 only needs session_id (already checked above)
        if (targetPhase > 1) {
          // Check that all previous phases are completed
          for (let i = 1; i < targetPhase; i++) {
            const completed = localStorage.getItem(`solbot_phase${i}_completed`)
            if (completed !== "true") {
              toast.info(`Please complete Phase ${i} first before proceeding.`)
              router.replace(`/phase${i}`)
              return
            }
          }
        }
      }

      // Summary page requires phase 6 completed
      if (pathname === "/summary") {
        const phase6Completed = localStorage.getItem("solbot_phase6_completed")
        if (phase6Completed !== "true") {
          for (let i = 1; i <= 6; i++) {
            const completed = localStorage.getItem(`solbot_phase${i}_completed`)
            if (completed !== "true") {
              toast.info(`Please complete Phase ${i} first before viewing the summary.`)
              router.replace(`/phase${i}`)
              return
            }
          }
        }
      }
    } catch {
      router.replace("/intro")
    }
  }, [pathname, router])

  return null
}

