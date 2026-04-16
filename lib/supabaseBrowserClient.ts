/**
 * Stage 1 — Browser Supabase client (isolated to DataLayer use).
 *
 * Why a new file: the existing codebase talks to Supabase exclusively
 * from server-side API routes using SUPABASE_SERVICE_KEY. Stage 1 adds
 * a direct browser-to-Supabase path for the write-ahead log so the
 * offline-first sync loop does not depend on our own Next.js API.
 *
 * This client is LIMITED to the `write_ahead_log` table. Other tables
 * continue to be written through the existing API routes.
 *
 * ENV VARS (already present in .env.local as of 2026-04-16):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * SECURITY NOTE: Because Row-Level Security is currently disabled on
 * this Supabase project (see Stage 1 audit report), the anon key is
 * effectively write-capable to every table. Stage 2 should enable RLS
 * with a policy that only allows INSERT on write_ahead_log rows whose
 * participant_id matches an authenticated session.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"

// Singleton — we only want one client per browser tab.
let cachedClient: SupabaseClient | null = null

/**
 * Returns a Supabase browser client, or null if env vars are missing.
 * Callers MUST handle the null case (treat it as "Supabase unavailable"
 * and keep the WAL in localStorage until config is fixed).
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient

  // In SSR / Node contexts (e.g. Next.js static generation) we return
  // null rather than throwing, so importing this module never breaks a
  // build.
  if (typeof window === "undefined") return null

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // eslint-disable-next-line no-console
    console.warn(
      "[supabaseBrowserClient] Missing NEXT_PUBLIC_SUPABASE_URL or " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY. DataLayer will stay in local-only mode."
    )
    return null
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      // We are not using Supabase Auth for Stage 1. Disable session
      // persistence so we do not conflict with the app's own user_id
      // flow.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    // Minimise network chatter; we only use this client for INSERTs.
    realtime: { params: { eventsPerSecond: 0 } },
  })

  return cachedClient
}

/**
 * Test-only hook: reset the cached client. Playwright specs use this
 * after changing env to force a fresh instance.
 */
export function __resetSupabaseBrowserClientForTests(): void {
  cachedClient = null
}
