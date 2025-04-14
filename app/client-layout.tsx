"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import HomeButton from "@/components/home-button"
import { usePathname } from "next/navigation"
import { UserDataTracker } from "@/components/UserDataTracker"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="dark" 
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
      <HomeButtonWrapper />
      <UserDataTracker />
    </ThemeProvider>
  )
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

