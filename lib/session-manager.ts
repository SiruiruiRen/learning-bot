/**
 * Session Manager - Handles robust session creation and validation
 * Ensures users can always use the app even if they skip onboarding
 */

import { v4 as uuidv4 } from 'uuid'
import { captureToWAL } from './dataLayerInstrument'

interface SessionData {
  user_id: string
  session_id: string
  user_name: string
  user_email: string
  created_at: string
  is_fallback: boolean
}

export class SessionManager {
  private static instance: SessionManager
  private sessionData: SessionData | null = null

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Get or create a robust session
   * This ensures the user can always use the app
   */
  async getOrCreateSession(): Promise<SessionData> {
    try {
      // First, try to get existing session from localStorage
      const existingSession = this.getExistingSession()
      if (existingSession && this.isValidSession(existingSession)) {
        this.sessionData = existingSession
        return existingSession
      }

      // If no valid session exists, create a fallback session
      return this.createFallbackSession()
    } catch (error) {
      console.error('Error in session management:', error)
      // Even if everything fails, create a temporary session
      return this.createTemporarySession()
    }
  }

  /**
   * Get existing session from localStorage
   */
  private getExistingSession(): SessionData | null {
    try {
      const userId = localStorage.getItem('user_id')
      const sessionId = localStorage.getItem('session_id')
      const userName = localStorage.getItem('solbot_user_name') || 'Anonymous User'
      const userEmail = localStorage.getItem('solbot_user_email') || 'anonymous@example.com'

      if (userId && sessionId) {
        return {
          user_id: userId,
          session_id: sessionId,
          user_name: userName,
          user_email: userEmail,
          created_at: new Date().toISOString(),
          is_fallback: false
        }
      }
    } catch (error) {
      console.error('Error reading existing session:', error)
    }
    return null
  }

  /**
   * Create a fallback session for users who skip onboarding
   */
  private createFallbackSession(): SessionData {
    const userId = uuidv4()
    const sessionId = uuidv4()
    const timestamp = new Date().toISOString()
    
    const sessionData: SessionData = {
      user_id: userId,
      session_id: sessionId,
      user_name: 'Guest User',
      user_email: `guest-${userId.slice(0, 8)}@temp.com`,
      created_at: timestamp,
      is_fallback: true
    }

    try {
      // Save to localStorage
      localStorage.setItem('user_id', userId)
      localStorage.setItem('session_id', sessionId)
      localStorage.setItem('solbot_user_name', sessionData.user_name)
      localStorage.setItem('solbot_user_email', sessionData.user_email)
      localStorage.setItem('session_fallback', 'true')

      // Log the fallback session creation
      console.log('Created fallback session for direct access:', {
        user_id: userId.slice(0, 8),
        session_id: sessionId.slice(0, 8)
      })

      // Send fallback session to backend for tracking
      this.registerFallbackSession(sessionData)
    } catch (error) {
      console.error('Error saving fallback session:', error)
    }

    this.sessionData = sessionData
    return sessionData
  }

  /**
   * Create a temporary session that exists only in memory
   */
  private createTemporarySession(): SessionData {
    const userId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const sessionId = `temp-session-${Date.now()}`
    
    return {
      user_id: userId,
      session_id: sessionId,
      user_name: 'Temporary User',
      user_email: 'temp@example.com',
      created_at: new Date().toISOString(),
      is_fallback: true
    }
  }

  /**
   * Register fallback session with backend for data consistency
   */
  private async registerFallbackSession(sessionData: SessionData): Promise<void> {
    // Stage 2: fallback sessions happen when a student skips onboarding
    // (e.g. lands directly on /phase1). These students still generate
    // research data; we must capture their session-create event.
    captureToWAL("sessions", {
      event_type: "fallback_session_registered",
      user_id: sessionData.user_id,
      session_id: sessionData.session_id,
      name: sessionData.user_name,
      email: sessionData.user_email,
      access_method: "direct_navigation",
      is_fallback: true,
    }, {
      participantId: sessionData.user_id,
      sessionId: sessionData.session_id,
      eventType: "fallback_session_registered",
    })

    try {
      await fetch('/api/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sessionData.user_id,
          dataType: 'session_fallback',
          value: {
            session_type: 'fallback',
            created_at: sessionData.created_at,
            access_method: 'direct_navigation'
          },
          metadata: {
            email: sessionData.user_email,
            name: sessionData.user_name,
            is_fallback: true
          }
        })
      })
    } catch (error) {
      console.error('Failed to register fallback session:', error)
      // This is non-critical, app continues to work
    }
  }

  /**
   * Check if a session is valid
   */
  private isValidSession(session: SessionData): boolean {
    return !!(session.user_id && session.session_id)
  }

  /**
   * Get current session data
   */
  getCurrentSession(): SessionData | null {
    return this.sessionData
  }

  /**
   * Check if current session is a fallback
   */
  isFallbackSession(): boolean {
    return this.sessionData?.is_fallback || false
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    try {
      localStorage.removeItem('user_id')
      localStorage.removeItem('session_id')
      localStorage.removeItem('solbot_user_name')
      localStorage.removeItem('solbot_user_email')
      localStorage.removeItem('session_fallback')
    } catch (error) {
      console.error('Error clearing session:', error)
    }
    this.sessionData = null
  }
}

/**
 * Hook for using session manager in React components
 */
export function useSessionManager() {
  const sessionManager = SessionManager.getInstance()
  
  return {
    getOrCreateSession: () => sessionManager.getOrCreateSession(),
    getCurrentSession: () => sessionManager.getCurrentSession(),
    isFallbackSession: () => sessionManager.isFallbackSession(),
    clearSession: () => sessionManager.clearSession()
  }
} 