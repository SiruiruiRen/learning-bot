"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { usePathname, useRouter } from "next/navigation"
import { UserDataTracker } from "@/components/UserDataTracker"
import { ThemeToggle } from "@/components/theme-toggle"
import FloatingChatbot from "@/components/floating-chatbot"
import ClickTracker from "@/components/click-tracker"
import NavigationTracker from "@/components/navigation-tracker"
import { useEffect } from "react"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={true}
      disableTransitionOnChange
    >
      {children}
      <SessionGate />
      <UserDataTracker />
      <ThemeToggle />
      <FloatingChatbotWrapper />
      <ClickTracker />
      <NavigationTracker />
    </ThemeProvider>
  )
}

// Client component to conditionally render the floating chatbot
function FloatingChatbotWrapper() {
  const pathname = usePathname()
  
  // Detect current phase from pathname
  const phaseMatch = pathname.match(/\/phase(\d+)/)
  const currentPhase = phaseMatch ? `phase${phaseMatch[1]}` : "default"
  
  // Don't show on landing/intro pages
  if (pathname === "/landing" || pathname === "/" || pathname === "/intro") {
    return null
  }
  
  return <FloatingChatbot currentPhase={currentPhase} />
}

// Ensure participants start from onboarding so session_id exists for analytics + study flow.
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
      }
    } catch {
      router.replace("/intro")
    }
  }, [pathname, router])

  return null
}

