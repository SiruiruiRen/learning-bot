"use client"

import { useState, useEffect } from "react"

/**
 * Hook to get the user's experimental condition (bot vs static).
 * Reads from localStorage, which is set during onboarding.
 *
 * Usage:
 *   const condition = useCondition()
 *   if (condition === "bot") { ... }
 *   if (condition === "static") { ... }
 *
 * Returns "bot" by default if no condition is found (backward compatibility).
 */
export function useCondition(): "bot" | "static" {
  const [condition, setCondition] = useState<"bot" | "static">("bot")

  useEffect(() => {
    const stored = localStorage.getItem("solbot_condition")
    if (stored === "static") {
      setCondition("static")
    }
  }, [])

  return condition
}
