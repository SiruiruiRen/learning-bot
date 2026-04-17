/**
 * Stage 1 — Offline-first DataLayer (StrictMode-safe).
 *
 * Contract:
 *   1. `record(targetTable, payload)` returns IMMEDIATELY after the event
 *      lands in localStorage. UI should treat that as "saved" — it is
 *      durable even if the browser is killed the next millisecond.
 *   2. A background sync loop drains the queue into Supabase's
 *      `write_ahead_log` table. Failures are retried with exponential
 *      backoff; the item stays in localStorage until a successful write
 *      (or a duplicate-key success, which counts).
 *   3. No existing sol2l-bot code paths are touched. This module is
 *      only wired up by the Stage 1 test page and Playwright specs.
 *
 * StrictMode safety (Stage 1.1 fix):
 *   React dev StrictMode runs every effect twice: mount → cleanup →
 *   mount. If we created a fresh DataLayer per effect run, TWO
 *   DataLayer instances would briefly coexist, both reading/writing
 *   the same localStorage queue. That caused silent data loss because
 *   the second instance could overwrite a saveQueue() done by the
 *   first with a stale in-memory snapshot.
 *
 *   Fix: `getOrCreateDataLayer(pid)` returns a module-scoped singleton
 *   keyed by participantId. Calling `dispose()` on a handle is a
 *   reference-count decrement; the real instance only gets torn down
 *   when the last handle releases. Under StrictMode's double-mount,
 *   the refcount goes 0 → 1 → 2 → 1 → 1, and we never end up with
 *   two live instances competing for the same queue.
 *
 * Sync race fix (Stage 1.1):
 *   The previous sync() had a narrow window where record() could be
 *   called during the transition between "loop exits" and
 *   "syncing = false", causing the new item to sit in the queue
 *   until the 2-second periodic timer picked it up. Under
 *   unfavorable timing + a transient Supabase 5xx, this could tip
 *   into a multi-minute retry backoff and look like a stall.
 *
 *   Fix: `syncRequested` flag. If sync() is called while another
 *   drain is running, we set the flag; the running drain checks it
 *   before exiting and re-runs the inner loop. This is a standard
 *   "dirty-bit" pattern for dedup'd concurrent work.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseBrowserClient } from "./supabaseBrowserClient"

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export interface WalRecord {
  idempotency_key: string
  participant_id: string
  session_id: string | null
  target_table: string
  event_type: string | null
  payload: Record<string, unknown>
  client_timestamp: string
  user_agent: string | null
  app_version: string | null
  /** Local-only bookkeeping; not sent to Supabase. */
  attempts: number
  last_error: string | null
}

export interface RecordResult {
  idempotencyKey: string
  localSaved: true
}

export interface DataLayerOptions {
  /**
   * Inject a Supabase client. Pass `null` to force local-only mode
   * (used by manual dev tooling). Omit to use the shared singleton
   * from `supabaseBrowserClient`.
   */
  supabaseClient?: SupabaseClient | null
  periodicSyncMs?: number
  maxAttempts?: number
  maxBackoffMs?: number
  appVersion?: string
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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
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
// Singleton registry (Stage 1.1 fix)
// ---------------------------------------------------------------------

interface RegistryEntry {
  instance: DataLayer
  refcount: number
}

const registry: Map<string, RegistryEntry> = new Map()

/**
 * Get or create a DataLayer for the given participantId. Calls with
 * the same pid return the same underlying instance; the refcount is
 * incremented. Every caller must call `.dispose()` exactly once on
 * their handle; the instance is torn down when refcount hits zero.
 *
 * This is the recommended entry point. Construction options from
 * secondary callers are IGNORED — only the first caller's options
 * take effect. To change options on an existing instance, call
 * `.updateOptions()`.
 */
export function getOrCreateDataLayer(
  participantId: string,
  sessionId: string | null = null,
  options: DataLayerOptions = {}
): DataLayer {
  const existing = registry.get(participantId)
  if (existing) {
    existing.refcount += 1
    // If the caller wants a different Supabase client than the
    // existing one, swap it (useful for the force-offline toggle in
    // the dev test page). Three states:
    //   null       → force local-only
    //   undefined  → use the default browser client
    //   <client>   → use that specific client (mainly for unit tests)
    if ("supabaseClient" in options) {
      existing.instance.__setSupabaseClient(options.supabaseClient)
    }
    return existing.instance
  }

  const instance = new DataLayer(participantId, sessionId, options)
  registry.set(participantId, { instance, refcount: 1 })
  return instance
}

/** Test-only: clear the registry. */
export function __resetDataLayerRegistryForTests(): void {
  for (const entry of registry.values()) {
    entry.instance.__hardDispose()
  }
  registry.clear()
}

// ---------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------

export class DataLayer {
  readonly participantId: string
  readonly sessionId: string | null
  private opts: Required<
    Omit<DataLayerOptions, "supabaseClient" | "suppressBeforeUnload">
  > & Pick<DataLayerOptions, "supabaseClient" | "suppressBeforeUnload">

  private queue: WalRecord[]
  private syncing = false
  private syncRequested = false // ← race-fix flag
  private disposed = false
  private periodicTimer: ReturnType<typeof setInterval> | null = null
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private listeners: Set<QueueChangeListener> = new Set()

  private readonly onOnline: () => void
  private readonly onBeforeUnload: (e: BeforeUnloadEvent) => void
  private readonly onVisibilityChange: () => void

  constructor(
    participantId: string,
    sessionId: string | null = null,
    options: DataLayerOptions = {}
  ) {
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
      void this.sync()
    }
    this.onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (this.opts.suppressBeforeUnload) return
      if (this.queue.length === 0) return
      e.preventDefault()
      e.returnValue =
        "Your data is still being saved. Please wait a moment before leaving."
    }
    this.onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
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

  record(
    targetTable: string,
    payload: Record<string, unknown>,
    opts: { eventType?: string; idempotencyKey?: string } = {}
  ): RecordResult {
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

    // Resilience: even if this instance has been disposed (React
    // Strict Mode double-mount, stale closure, etc.), we ALWAYS write
    // to localStorage. The durability contract of the DataLayer is
    // "after record() returns, the event is on disk"; we must honour
    // that even when the in-memory instance is stale. A future
    // instance (same participantId) will pick the record up from
    // localStorage on construction and drain it.
    if (this.disposed) {
      // Read latest localStorage (other instances may have touched
      // it), append, write back.
      const latest = loadQueue(this.participantId)
      latest.push(record)
      saveQueue(this.participantId, latest)
      // Kick a sync on whatever the current live instance is.
      const live = registry.get(this.participantId)?.instance
      if (live && !live.disposed) {
        // Keep the live instance's in-memory view in sync with disk
        // so its drain loop sees the new item.
        live.queue = latest
        live.notifyListeners()
        void live.sync()
      }
      return { idempotencyKey: record.idempotency_key, localSaved: true }
    }

    this.queue.push(record)
    saveQueue(this.participantId, this.queue)
    this.notifyListeners()

    void this.sync()

    return { idempotencyKey: record.idempotency_key, localSaved: true }
  }

  async sync(): Promise<{ synced: number; remaining: number }> {
    if (this.disposed) return { synced: 0, remaining: this.queue.length }
    if (this.queue.length === 0) return { synced: 0, remaining: 0 }
    if (isBrowser() && !navigator.onLine) {
      return { synced: 0, remaining: this.queue.length }
    }

    const client = this.resolveClient()
    if (!client) {
      return { synced: 0, remaining: this.queue.length }
    }

    // Race fix: if another sync is already running, just flag that
    // another drain pass is needed. The running drain will check the
    // flag before exiting and re-enter the loop.
    if (this.syncing) {
      this.syncRequested = true
      return { synced: 0, remaining: this.queue.length }
    }

    this.syncing = true
    let synced = 0
    try {
      // Outer loop: re-enter if someone asked for another drain while
      // we were busy. The flag is cleared at the start of each pass.
      do {
        this.syncRequested = false
        const result = await this.drainLoop(client)
        synced += result.synced
        if (result.stalled) {
          // A retry is scheduled; bail out until it fires.
          break
        }
      } while (this.syncRequested && !this.disposed)
    } finally {
      this.syncing = false
      this.notifyListeners()
    }

    return { synced, remaining: this.queue.length }
  }

  pendingCount(): number {
    return this.queue.length
  }

  pendingSnapshot(): ReadonlyArray<WalRecord> {
    return [...this.queue]
  }

  subscribe(listener: QueueChangeListener): () => void {
    this.listeners.add(listener)
    listener(this.queue.length)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Release one reference. If this was the last handle (refcount →
   * zero), the underlying timers/listeners are torn down. Safe to
   * call multiple times on the same handle — subsequent calls are
   * no-ops.
   */
  dispose(): void {
    const entry = registry.get(this.participantId)
    if (!entry) {
      this.__hardDispose()
      return
    }
    entry.refcount -= 1
    if (entry.refcount <= 0) {
      registry.delete(this.participantId)
      this.__hardDispose()
    }
  }

  __hardDispose(): void {
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
   * Swap the Supabase client at runtime (used by the dev page's
   * force-offline toggle). Three states:
   *   null       → force local-only (queue stays in localStorage)
   *   undefined  → use the default browser client
   *   <client>   → use that specific client (mainly for unit tests)
   */
  __setSupabaseClient(client: SupabaseClient | null | undefined): void {
    this.opts.supabaseClient = client
    // If we just came back online (non-null), try to drain.
    if (client !== null) void this.sync()
  }

  /** Wipe the queue (both in-memory and localStorage). Test-only. */
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

  /**
   * Inner drain loop. Returns a result telling sync() whether we're
   * empty or stalled (retry scheduled).
   */
  private async drainLoop(
    client: SupabaseClient
  ): Promise<{ synced: number; stalled: boolean }> {
    let synced = 0
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
          // Postgres unique_violation = "already landed on a previous
          // attempt" → treat as success.
          if (error.code === "23505") {
            this.dequeueHead()
            synced += 1
            continue
          }
          // Surface non-duplicate errors in the browser console so
          // the operator can see them in the Playwright trace.
          // eslint-disable-next-line no-console
          console.warn(
            `[DataLayer] insert failed (attempt ${head.attempts}):`,
            error.code,
            error.message,
            error.details ?? ""
          )
          throw error
        }

        this.dequeueHead()
        synced += 1
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        head.last_error = msg
        saveQueue(this.participantId, this.queue)

        if (head.attempts >= this.opts.maxAttempts) {
          // Give up on this record so the rest of the queue can drain.
          this.archiveFailed(head)
          this.dequeueHead()
          continue
        }

        const delay = Math.min(
          1_000 * 2 ** Math.min(head.attempts, 6),
          this.opts.maxBackoffMs
        )
        this.scheduleRetry(delay)
        return { synced, stalled: true }
      }
    }
    return { synced, stalled: false }
  }

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
      // eslint-disable-next-line no-console
      console.error(
        `[DataLayer] record archived after ${record.attempts} failed attempts:`,
        record.last_error
      )
    } catch {
      // Archive overflow: drop debug info rather than crash the app.
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
    if (this.opts.supabaseClient === null) return null
    if (this.opts.supabaseClient) return this.opts.supabaseClient
    return getSupabaseBrowserClient()
  }
}
