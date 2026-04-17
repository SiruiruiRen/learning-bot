/**
 * Stage 2 — Instrumentation helper for dual-write safety net.
 *
 * DESIGN:
 * ------
 * Every existing fetch() in the app that writes research-critical
 * data should get a `captureToWAL(...)` call RIGHT NEXT TO IT.
 *
 *   // Before (Stage 0):
 *   await fetch("/api/events", { method: "POST", body: ... })
 *
 *   // After (Stage 2):
 *   captureToWAL("messages", { role, content, ... })   // ← new
 *   await fetch("/api/events", { method: "POST", body: ... })  // unchanged
 *
 * The two calls are **independent**. If either one fails, the other
 * still lands:
 *   - fetch fails → WAL has the data, researcher replays later
 *   - WAL fails → existing analytics tables still have it (current behaviour)
 *   - both succeed → data is duplicated (that's fine, WAL is an audit log)
 *
 * GUARANTEES:
 * -----------
 *   1. Never blocks the caller. `captureToWAL` returns synchronously
 *      once the record is in localStorage; background sync ships it
 *      to Supabase.
 *   2. Never throws. Any internal error is swallowed + warned. The
 *      caller's hot path must not be impacted by instrumentation.
 *   3. Uses the DataLayer singleton, so multiple call sites across
 *      the app share one sync loop per participant.
 *   4. Idempotency: each captureToWAL call generates a new UUID.
 *      If you want to group multiple WAL writes under one logical
 *      operation (e.g. a chat turn's user message + assistant message
 *      + assessment), pass a shared `turn_id` (or similar) INSIDE
 *      the payload. That's what the test harness persona P5
 *      demonstrates.
 *
 * WHAT TO INSTRUMENT:
 * -------------------
 * Tier 1 (research-critical; MUST be captured):
 *   - Chat messages (user + assistant)
 *   - Assessments (rubric scores + scaffolding level)
 *   - Knowledge-check attempts
 *   - Phase transitions
 *   - Final submissions (phase 6)
 * Tier 2 (useful for behaviour analysis):
 *   - Navigation events
 *   - Click events
 *   - Video watch progress
 * Tier 3 (optional, high volume):
 *   - Visibility change (tab switches)
 *   - Revision tracking
 *
 * Stage 2 instruments Tier 1 + Tier 2. Tier 3 is Stage 3.
 *
 * WHAT TO PUT IN target_table:
 * ----------------------------
 * Use the name of the existing Supabase table you'd replay into. The
 * point of the WAL isn't just "capture", it's "replay-ready backup".
 *   "messages" | "assessments" | "knowledge_check_attempts"
 *   | "content_interaction_logs" | "click_events" | ...
 * See Stage 1 audit for the full list.
 */

import {
  getOrCreateDataLayer,
  type DataLayer,
} from "./dataLayer"

// ---------------------------------------------------------------------
// localStorage key contract (matches existing app usage)
// ---------------------------------------------------------------------
const USER_ID_KEY = "user_id"
const SESSION_ID_KEY = "session_id"

// ---------------------------------------------------------------------
// Module-scoped bookkeeping
// ---------------------------------------------------------------------

/**
 * Whether captureToWAL has logged its first "no participant id"
 * warning. We log it once per page load rather than every call.
 */
let warnedMissingPid = false

function readParticipantId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(USER_ID_KEY)
    return raw && raw.trim() ? raw.trim() : null
  } catch {
    return null
  }
}

function readSessionId(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(SESSION_ID_KEY)
    return raw && raw.trim() ? raw.trim() : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

export interface CaptureOptions {
  /** Override the default participant_id (falls back to localStorage.user_id). */
  participantId?: string
  /** Override the default session_id (falls back to localStorage.session_id). */
  sessionId?: string | null
  /** Optional event sub-type for the WAL row. */
  eventType?: string
  /** Explicit idempotency key — useful if you want retries of the SAME
   *  logical event to collapse to one WAL row. */
  idempotencyKey?: string
}

/**
 * Capture an event to the write-ahead log. Safe to call anywhere in
 * the app, fire-and-forget.
 *
 * The record is durably persisted to localStorage before this function
 * returns; sync to Supabase happens in the background.
 *
 * @returns the generated idempotency key (UUID), or null if nothing
 *   was captured (e.g. running server-side, or no participant id).
 */
export function captureToWAL(
  targetTable: string,
  payload: Record<string, unknown>,
  opts: CaptureOptions = {}
): string | null {
  // Server-side: no-op. The DataLayer is browser-only.
  if (typeof window === "undefined") return null

  const participantId = opts.participantId ?? readParticipantId()
  if (!participantId) {
    if (!warnedMissingPid) {
      warnedMissingPid = true
      // eslint-disable-next-line no-console
      console.warn(
        "[captureToWAL] No participant id found in localStorage.user_id; " +
          "events will not be captured. This is expected on pages BEFORE " +
          "onboarding; research-critical events happen after."
      )
    }
    return null
  }

  let dl: DataLayer
  try {
    dl = getOrCreateDataLayer(participantId, opts.sessionId ?? readSessionId(), {
      appVersion: "stage-2",
    })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[captureToWAL] getOrCreateDataLayer failed", err)
    return null
  }

  try {
    const result = dl.record(targetTable, payload, {
      eventType: opts.eventType,
      idempotencyKey: opts.idempotencyKey,
    })
    return result.idempotencyKey
  } catch (err) {
    // record() can throw on localStorage QuotaExceededError; swallow
    // so callers aren't taken down by instrumentation.
    // eslint-disable-next-line no-console
    console.warn("[captureToWAL] record() failed", err)
    return null
  }
}

/**
 * Convenience: generate a fresh UUID for grouping related events
 * (e.g. all records of a single chat turn). Uses crypto.randomUUID
 * when available with a Math.random fallback.
 */
export function newTurnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = Number(c)
    return (n ^ (Math.floor(Math.random() * 16) >> (n / 4))).toString(16)
  })
}

/**
 * Read-only accessor for code that wants to display sync-status UI
 * (e.g. the "⏳ N pending" indicator in the corner of the app).
 */
export function getInstrumentedDataLayer(): DataLayer | null {
  if (typeof window === "undefined") return null
  const pid = readParticipantId()
  if (!pid) return null
  try {
    return getOrCreateDataLayer(pid, readSessionId(), { appVersion: "stage-2" })
  } catch {
    return null
  }
}
