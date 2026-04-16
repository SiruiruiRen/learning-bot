-- =====================================================================
-- Stage 1: Offline-first Data Layer — Write-Ahead Log (WAL)
-- =====================================================================
-- Purpose: Single append-only table that captures every intended write
-- BEFORE it fans out to the specialised analytics tables. This lets the
-- browser survive network hiccups, tab switches, and Supabase outages
-- without losing research data.
--
-- Design principles (see docs/stage-1-datalayer.md):
--   1. Client generates idempotency_key (UUID)          -> safe retries
--   2. UNIQUE(idempotency_key)                           -> dedup on retry
--   3. Both client_timestamp and server_timestamp        -> clock analysis
--   4. JSONB payload                                     -> target-table agnostic
--   5. synced/attempts columns                           -> optional server-side replay
--
-- Safe to run: pure ADDITIVE migration. No existing table is modified.
-- Run this once in Supabase SQL Editor. Re-running is safe (IF NOT EXISTS).
-- =====================================================================

CREATE TABLE IF NOT EXISTS write_ahead_log (
    id                 BIGSERIAL PRIMARY KEY,

    -- Idempotency: client generates a UUID per logical write. Retries
    -- with the same key hit the UNIQUE constraint and are treated as
    -- success (already-persisted semantics).
    idempotency_key    UUID        NOT NULL UNIQUE,

    -- Who & where. participant_id is users.id (UUID) per the Stage 1
    -- identifier decision. Stored as TEXT to stay flexible for anonymous
    -- pre-session writes (fallback sessions) where a synthetic id may
    -- be used.
    participant_id     TEXT        NOT NULL,
    session_id         TEXT,

    -- What. target_table names the logical destination (e.g.
    -- 'messages', 'assessments', 'content_interaction_logs'). event_type
    -- is an optional sub-classifier for easier filtering.
    target_table       TEXT        NOT NULL,
    event_type         TEXT,

    -- The full payload the client wants persisted. Kept as JSONB so we
    -- can evolve schemas without a migration and so research can replay
    -- into the real tables later.
    payload            JSONB       NOT NULL,

    -- Timestamps. client_timestamp is authoritative for behavioural
    -- analysis; server_timestamp is the arrival time at Supabase.
    client_timestamp   TIMESTAMPTZ NOT NULL,
    server_timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Client-captured context (useful for debugging browser issues).
    user_agent         TEXT,
    app_version        TEXT,

    -- Server-side replay bookkeeping (Stage 2+ will use these to project
    -- WAL rows into the real analytics tables). Stage 1 leaves them at
    -- defaults.
    synced             BOOLEAN     NOT NULL DEFAULT FALSE,
    attempts           INT         NOT NULL DEFAULT 0,
    last_error         TEXT
);

-- Indexes chosen for the two queries Stage 1 actually runs:
--   a) "did this participant's events all land?"         -> participant_id
--   b) "replay by arrival order"                         -> server_timestamp
--   c) "all rows for one target table"                   -> target_table
CREATE INDEX IF NOT EXISTS write_ahead_log_participant_idx
    ON write_ahead_log (participant_id, client_timestamp);

CREATE INDEX IF NOT EXISTS write_ahead_log_server_ts_idx
    ON write_ahead_log (server_timestamp);

CREATE INDEX IF NOT EXISTS write_ahead_log_target_idx
    ON write_ahead_log (target_table, server_timestamp);

-- Optional: partial index to make "find the unsynced tail" O(unsynced).
CREATE INDEX IF NOT EXISTS write_ahead_log_unsynced_idx
    ON write_ahead_log (server_timestamp)
    WHERE synced = FALSE;

COMMENT ON TABLE write_ahead_log IS
    'Stage 1 append-only write-ahead log. Every client-originated write '
    'passes through here before fanning out to specialised tables. '
    'Idempotency_key is client-generated UUID; duplicate inserts hit the '
    'UNIQUE constraint and are treated as success.';

COMMENT ON COLUMN write_ahead_log.idempotency_key IS
    'Client-generated UUID (crypto.randomUUID()). Used for retry-safe '
    'inserts. ON CONFLICT (idempotency_key) DO NOTHING is the canonical '
    'write pattern.';

COMMENT ON COLUMN write_ahead_log.participant_id IS
    'users.id (UUID) as TEXT. Matches the identifier stored in the '
    'browser under localStorage.user_id.';

COMMENT ON COLUMN write_ahead_log.client_timestamp IS
    'ISO timestamp captured at the moment the browser enqueued the '
    'event. Use this (not server_timestamp) for behavioural analysis.';

COMMENT ON COLUMN write_ahead_log.synced IS
    'Reserved for Stage 2 server-side replay. Stage 1 leaves this FALSE.';
