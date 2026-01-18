"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import HomeButton from "@/components/home-button"
import { usePathname } from "next/navigation"
import { UserDataTracker } from "@/components/UserDataTracker"
import { ThemeToggle } from "@/components/theme-toggle"
import FloatingChatbot from "@/components/floating-chatbot"
import ClickTracker from "@/components/click-tracker"

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
      <HomeButtonWrapper />
      <UserDataTracker />
      <ThemeToggle />
      <FloatingChatbotWrapper />
      <ClickTracker />
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

// Client component to conditionally render the home button
function HomeButtonWrapper() {
  const pathname = usePathname()

  // Don't show the home button on the landing page itself
  if (pathname === "/landing" || pathname === "/") {
    return null
  }

  return <HomeButton />
}

