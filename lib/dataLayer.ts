/**
 * Stage 1 — Offline-first DataLayer.
 *
 * Contract:
 *   1. `record(targetTable, payload)` returns IMMEDIATELY after the event
 *      lands in localStorage. UI should treat that as "saved" — it is
 *      durable even if the browser is killed in the next millisecond
 *      (modulo the tiny window between the JS object existing and
 *      localStorage.setItem returning, which is synchronous).
 *   2. A background sync loop drains the queue into Supabase's
 *      `write_ahead_log` table. Failures are retried with exponential
 *      backoff; the item stays in localStorage until a successful write
 *      (or a duplicate-key success, which counts).
 *   3. No existing sol2l-bot code paths are touched. This class is only
 *      wired up by the Stage 1 test page and Playwright specs.
 *
 * Invariants:
 *   - Each record has a client-generated `idempotency_key` (UUID). The
 *     WAL table's UNIQUE constraint makes retries safe.
 *   - `participant_id` is `users.id` (UUID) per the Stage 1 identifier
 *     decision. For anonymous pre-session writes, a synthetic id is
 *     accepted and stored as-is.
 *   - Queue ordering: FIFO. We process the head of the queue; a retry
 *     failure does NOT skip ahead (keeps causally-ordered events in
 *     order).
 *
 * Not in scope (Stage 2+):
 *   - Server-side replay from write_ahead_log into specialised tables.
 *   - Conflict resolution between concurrent tabs (each tab has its own
 *     queue keyed by participant_id, so two tabs by the same participant
 *     will both enqueue and both sync; idempotency_keys are distinct so
 *     no duplicates).
 *   - Supabase RLS policies (see Stage 1 audit; RLS currently disabled).
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "./supabaseBrowserClient"

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

/** A single logical write, as enqueued by the caller. */
export interface WalRecord {
  idempotency_key: string
  participant_id: string
  session_id: string | null
  target_table: string
  event_type: string | null
  /** Arbitrary JSON-serialisable data. */
  payload: Record<string, unknown>
  client_timestamp: string
  /** Populated on enqueue for diagnostic purposes. */
  user_agent: string | null
  app_version: string | null
  /** Local-only bookkeeping; not sent to Supabase. */
  attempts: number
  last_error: string | null
}

/** What `record()` returns synchronously. */
export interface RecordResult {
  idempotencyKey: string
  localSaved: true
}

/** Optional config per-instance (Stage 1 defaults are fine for tests). */
export interface DataLayerOptions {
  /** Override for tests: inject a Supabase client (or null to force local-only). */
  supabaseClient?: SupabaseClient | null
  /** ms between background sync ticks. Default 5000. */
  periodicSyncMs?: number
  /** Max retries per item before giving up and dropping it. Default 20. */
  maxAttempts?: number
  /** Max backoff delay between retries. Default 60_000. */
  maxBackoffMs?: number
  /** App version label (for diagnostics). Default 'stage-1'. */
  appVersion?: string
  /**
   * When true, `beforeunload` is ignored even if queue non-empty. Used
   * by Playwright to let a persona walk away without a browser prompt.
   */
  suppressBeforeUnload?: boolean
}

type QueueChangeListener = (pendingCount: number) => void

// ---------------------------------------------------------------------
// Module-scoped helpers
// ---------------------------------------------------------------------

const STORAGE_PREFIX = "sol2l_wal_queue_v1"

function storageKeyFor(participantId: string): string {
  return `${STORAGE_PREFIX}:${participantId}`
}

function nowIso(): string {
  return new Date().toISOString()
}

function safeUuid(): string {
  // crypto.randomUUID is available in all modern browsers + Node 19+.
  // The codebase targets Node 18+ and our dev uses Node 23.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // Fallback — RFC 4122 v4 via Math.random (only for exotic hosts).
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = Number(c)
    return (n ^ (Math.floor(Math.random() * 16) >> (n / 4))).toString(16)
  })
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

function loadQueue(participantId: string): WalRecord[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(storageKeyFor(participantId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Defensive filter: drop malformed entries rather than crash the sync.
    return parsed.filter(
      (x) =>
        x &&
        typeof x.idempotency_key === "string" &&
        typeof x.target_table === "string" &&
        typeof x.participant_id === "string"
    ) as WalRecord[]
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[DataLayer] Failed to parse queue from localStorage", err)
    return []
  }
}

function saveQueue(participantId: string, queue: WalRecord[]): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(storageKeyFor(participantId), JSON.stringify(queue))
  } catch (err) {
    // QuotaExceededError is the main failure mode; surface it loudly.
    // eslint-disable-next-line no-console
    console.error("[DataLayer] Failed to persist queue to localStorage", err)
    // We intentionally DO NOT swallow the error here — loss of local
    // durability is the single worst failure mode for the WAL design.
    throw err
  }
}

// ---------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------

export class DataLayer {
  readonly participantId: string
  readonly sessionId: string | null
  private readonly opts: Required<
    Omit<DataLayerOptions, "supabaseClient" | "suppressBeforeUnload">
  > & Pick<DataLayerOptions, "supabaseClient" | "suppressBeforeUnload">

  private queue: WalRecord[]
  private syncing = false
  private disposed = false
  private periodicTimer: ReturnType<typeof setInterval> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<QueueChangeListener> = new Set()

  // Bound handlers so we can removeEventListener.
  private readonly onOnline: () => void
  private readonly onBeforeUnload: (e: BeforeUnloadEvent) => void
  private readonly onVisibilityChange: () => void

  constructor(participantId: string, sessionId: string | null = null, options: DataLayerOptions = {}) {
    if (!participantId) {
      throw new Error("DataLayer: participantId is required")
    }
    this.participantId = participantId
    this.sessionId = sessionId
    this.opts = {
      supabaseClient: options.supabaseClient,
      periodicSyncMs: options.periodicSyncMs ?? 5_000,
      maxAttempts: options.maxAttempts ?? 20,
      maxBackoffMs: options.maxBackoffMs ?? 60_000,
      appVersion: options.appVersion ?? "stage-1",
      suppressBeforeUnload: options.suppressBeforeUnload,
    }
    this.queue = loadQueue(participantId)

    this.onOnline = () => {
      // Network came back; drain immediately.
      void this.sync()
    }
    this.onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (this.opts.suppressBeforeUnload) return
      if (this.queue.length === 0) return
      // Standard cross-browser unload prompt.
      e.preventDefault()
      e.returnValue =
        "Your data is still being saved. Please wait a moment before leaving."
    }
    this.onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Coming back from a backgrounded tab — try to flush.
        void this.sync()
      }
    }

    if (isBrowser()) {
      window.addEventListener("online", this.onOnline)
      window.addEventListener("beforeunload", this.onBeforeUnload)
      document.addEventListener("visibilitychange", this.onVisibilityChange)

      this.periodicTimer = setInterval(() => {
        void this.sync()
      }, this.opts.periodicSyncMs)

      // Kick off an immediate drain on construction (picks up anything
      // left over from a previous session).
      queueMicrotask(() => {
        void this.sync()
      })
    }
  }

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  /**
   * Enqueue a write. Returns as soon as the event is durable in
   * localStorage. Triggers a non-blocking sync attempt.
   */
  record(
    targetTable: string,
    payload: Record<string, unknown>,
    opts: { eventType?: string; idempotencyKey?: string } = {}
  ): RecordResult {
    if (this.disposed) {
      throw new Error("DataLayer: record() called on disposed instance")
    }
    if (!targetTable) {
      throw new Error("DataLayer: targetTable is required")
    }

    const record: WalRecord = {
      idempotency_key: opts.idempotencyKey ?? safeUuid(),
      participant_id: this.participantId,
      session_id: this.sessionId,
      target_table: targetTable,
      event_type: opts.eventType ?? null,
      payload,
      client_timestamp: nowIso(),
      user_agent: isBrowser() ? navigator.userAgent : null,
      app_version: this.opts.appVersion,
      attempts: 0,
      last_error: null,
    }

    this.queue.push(record)
    saveQueue(this.participantId, this.queue)
    this.notifyListeners()

    // Fire-and-forget sync. We never block record() on network.
    void this.sync()

    return { idempotencyKey: record.idempotency_key, localSaved: true }
  }

  /**
   * Drains the queue into Supabase. Safe to call concurrently — a
   * mutex flag ensures only one drain runs at a time. Respects
   * `navigator.onLine` (returns early when offline).
   */
  async sync(): Promise<{ synced: number; remaining: number }> {
    if (this.disposed) return { synced: 0, remaining: this.queue.length }
    if (this.syncing) return { synced: 0, remaining: this.queue.length }
    if (this.queue.length === 0) return { synced: 0, remaining: 0 }
    if (isBrowser() && !navigator.onLine) {
      return { synced: 0, remaining: this.queue.length }
    }

    const client = this.resolveClient()
    if (!client) {
      // No Supabase client available — stay in local-only mode.
      return { synced: 0, remaining: this.queue.length }
    }

    this.syncing = true
    let synced = 0
    try {
      while (this.queue.length > 0 && !this.disposed) {
        const head = this.queue[0]
        head.attempts += 1

        try {
          const insertPayload = {
            idempotency_key: head.idempotency_key,
            participant_id: head.participant_id,
            session_id: head.session_id,
            target_table: head.target_table,
            event_type: head.event_type,
            payload: head.payload,
            client_timestamp: head.client_timestamp,
            user_agent: head.user_agent,
            app_version: head.app_version,
          }

          const { error } = await client
            .from("write_ahead_log")
            .insert([insertPayload])

          if (error) {
            // Postgres unique_violation (23505) on idempotency_key means
            // this row already landed on a previous attempt — treat as
            // success.
            if (error.code === "23505") {
              this.dequeueHead()
              synced += 1
              continue
            }
            throw error
          }

          // Success: drop from head.
          this.dequeueHead()
          synced += 1
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          head.last_error = msg
          saveQueue(this.participantId, this.queue)

          // Give up on this record if we've burned through maxAttempts.
          // We drop it so the rest of the queue can still drain; an
          // error record goes into localStorage under a _failed key so
          // researchers can inspect it post-hoc.
          if (head.attempts >= this.opts.maxAttempts) {
            this.archiveFailed(head)
            this.dequeueHead()
            continue
          }

          // Schedule a retry with exponential backoff, then stop this
          // drain so we don't hot-loop.
          const delay = Math.min(
            1_000 * 2 ** Math.min(head.attempts, 6),
            this.opts.maxBackoffMs
          )
          this.scheduleRetry(delay)
          break
        }
      }
    } finally {
      this.syncing = false
      this.notifyListeners()
    }

    return { synced, remaining: this.queue.length }
  }

  /** Current number of records pending sync. */
  pendingCount(): number {
    return this.queue.length
  }

  /** Snapshot of queued records (for dev/debug UI). */
  pendingSnapshot(): ReadonlyArray<WalRecord> {
    return [...this.queue]
  }

  /** Subscribe to queue size changes. Returns an unsubscribe fn. */
  subscribe(listener: QueueChangeListener): () => void {
    this.listeners.add(listener)
    listener(this.queue.length)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Destructor — removes listeners and timers. Safe to call multiple times. */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.periodicTimer) clearInterval(this.periodicTimer)
    if (this.retryTimer) clearTimeout(this.retryTimer)
    if (isBrowser()) {
      window.removeEventListener("online", this.onOnline)
      window.removeEventListener("beforeunload", this.onBeforeUnload)
      document.removeEventListener("visibilitychange", this.onVisibilityChange)
    }
    this.listeners.clear()
  }

  /**
   * Test-only: wipe the queue (both in-memory and localStorage). Do
   * not call from production code.
   */
  __resetForTests(): void {
    this.queue = []
    if (isBrowser()) {
      localStorage.removeItem(storageKeyFor(this.participantId))
      localStorage.removeItem(`${storageKeyFor(this.participantId)}:failed`)
    }
    this.notifyListeners()
  }

  // -----------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------

  private dequeueHead(): void {
    this.queue.shift()
    saveQueue(this.participantId, this.queue)
    this.notifyListeners()
  }

  private archiveFailed(record: WalRecord): void {
    if (!isBrowser()) return
    const key = `${storageKeyFor(this.participantId)}:failed`
    try {
      const prevRaw = localStorage.getItem(key)
      const prev: WalRecord[] = prevRaw ? JSON.parse(prevRaw) : []
      prev.push(record)
      localStorage.setItem(key, JSON.stringify(prev))
    } catch {
      // If the failed archive itself overflows we'd rather drop the
      // debug info than crash the app.
    }
  }

  private scheduleRetry(delayMs: number): void {
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      void this.sync()
    }, delayMs)
  }

  private notifyListeners(): void {
    for (const l of this.listeners) {
      try {
        l(this.queue.length)
      } catch {
        // Listeners must not take down the sync loop.
      }
    }
  }

  private resolveClient(): SupabaseClient | null {
    // Explicit null from test options means "force local-only".
    if (this.opts.supabaseClient === null) return null
    if (this.opts.supabaseClient) return this.opts.supabaseClient
    return getSupabaseBrowserClient()
  }
}
