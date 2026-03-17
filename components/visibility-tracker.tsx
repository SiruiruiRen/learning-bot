"use client"

import { useVisibilityTracker } from "@/hooks/useVisibilityTracker"

/**
 * Invisible component that tracks user leave/return events.
 * Add to client-layout.tsx to run on all pages.
 */
export default function VisibilityTracker() {
  useVisibilityTracker()
  return null
}
