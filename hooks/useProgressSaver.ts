"use client"

import { useEffect, useCallback, useRef } from "react"
import { captureToWAL } from "@/lib/dataLayerInstrument"

/**
 * Progress state shape for each phase page.
 * Each phase only saves the fields it uses.
 */
export interface PhaseProgress {
  cardIndex: number
  videoWatched?: boolean
  videoCompleted?: boolean
  quizCompleted?: boolean
  postTestCompleted?: boolean
  chatCompleted?: boolean
  quizStarted?: boolean
  answersSubmitted?: boolean
  [key: string]: any // Allow phase-specific additional fields
}

const STORAGE_PREFIX = "solbot_progress_"

/**
 * Hook to save and restore phase progress via localStorage.
 * Also backs up to Supabase (user_data table) for crash recovery.
 *
 * Usage:
 *   const { savedProgress, saveProgress } = useProgressSaver("phase2")
 *   // On mount, check savedProgress and restore state
 *   // On state change, call saveProgress({ cardIndex, videoWatched, ... })
 */
export function useProgressSaver(phase: string) {
  const storageKey = `${STORAGE_PREFIX}${phase}`
  const lastSavedRef = useRef<string>("")

  // Load saved progress from localStorage on mount
  const loadProgress = useCallback((): PhaseProgress | null => {
    if (typeof window === "undefined") return null // SSR safety
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved) as PhaseProgress
      }
    } catch (error) {
      console.warn(`Could not load progress for ${phase}:`, error)
    }
    return null
  }, [storageKey, phase])

  // Save progress to localStorage + Supabase backup
  const saveProgress = useCallback(
    (progress: PhaseProgress) => {
      const serialized = JSON.stringify(progress)

      // Skip if nothing changed
      if (serialized === lastSavedRef.current) return
      lastSavedRef.current = serialized

      // Save to localStorage (fast, synchronous)
      if (typeof window === "undefined") return // SSR safety
      try {
        localStorage.setItem(storageKey, serialized)
      } catch (error) {
        console.warn(`Could not save progress for ${phase}:`, error)
      }

      // Stage 2 safety net: capture progress to WAL. This is a
      // high-frequency event (fires on every state change inside a
      // phase), so we use an idempotency_key tied to the phase +
      // cardIndex so identical states collapse rather than spam the
      // table.
      captureToWAL("user_data", {
        data_type: `progress_${phase}`,
        value: progress,
        phase,
        cardIndex: progress.cardIndex,
      }, { eventType: "progress_save" })

      // Existing Supabase backup path.
      try {
        const userId = localStorage.getItem("user_id")
        if (userId) {
          fetch("/api/user-data", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              dataType: `progress_${phase}`,
              value: serialized,
              metadata: {
                phase,
                cardIndex: progress.cardIndex,
                timestamp: new Date().toISOString(),
              },
            }),
          }).catch(() => {})
        }
      } catch {
        // Silently fail — progress save to Supabase is best-effort
      }
    },
    [storageKey, phase]
  )

  // Clear saved progress (call when phase is completed)
  const clearProgress = useCallback(() => {
    if (typeof window === "undefined") return // SSR safety
    try {
      localStorage.removeItem(storageKey)
      lastSavedRef.current = ""
    } catch (error) {
      console.warn(`Could not clear progress for ${phase}:`, error)
    }
  }, [storageKey, phase])

  // Get initial saved progress
  const savedProgress = loadProgress()

  return { savedProgress, saveProgress, clearProgress }
}
