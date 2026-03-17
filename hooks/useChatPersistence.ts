"use client"

import { useCallback, useRef } from "react"

/**
 * Persisted chat state shape — everything needed to restore a conversation.
 */
export interface PersistedChatState {
  messages: any[]
  interactionState: "guiding" | "confirming" | "chatting"
  currentQuestionIndex: number
  responses: Record<string, string>
  feedbackReceived: boolean
  finalSubmitted: boolean
}

const STORAGE_PREFIX = "solbot_chat_history_"

/**
 * Hook to save and restore full chat conversation state via localStorage.
 * This preserves the entire conversation history (messages, AI feedback, etc.)
 * so users can leave and return without losing progress.
 *
 * Usage:
 *   const { loadChatState, saveChatState, clearChatState } = useChatPersistence("learning_objectives", "2")
 */
export function useChatPersistence(component: string, phase: string) {
  const storageKey = `${STORAGE_PREFIX}${component}_${phase}`
  const lastSavedRef = useRef<string>("")

  const loadChatState = useCallback((): PersistedChatState | null => {
    if (typeof window === "undefined") return null
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved) as PersistedChatState
      }
    } catch (error) {
      console.warn(`Could not load chat state for ${component}_${phase}:`, error)
    }
    return null
  }, [storageKey, component, phase])

  const saveChatState = useCallback(
    (state: PersistedChatState) => {
      if (typeof window === "undefined") return
      const serialized = JSON.stringify(state)
      // Skip if nothing changed
      if (serialized === lastSavedRef.current) return
      lastSavedRef.current = serialized
      try {
        localStorage.setItem(storageKey, serialized)
      } catch (error) {
        console.warn(`Could not save chat state for ${component}_${phase}:`, error)
      }
    },
    [storageKey, component, phase]
  )

  const clearChatState = useCallback(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.removeItem(storageKey)
      lastSavedRef.current = ""
    } catch {
      // silently fail
    }
  }, [storageKey])

  return { loadChatState, saveChatState, clearChatState }
}
