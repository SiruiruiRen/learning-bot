-- =====================================================================
-- Stage 1 — DataLayer end-to-end verification
-- =====================================================================
-- Run this in Supabase SQL Editor AFTER the Playwright suite finishes.
-- It checks three things:
--   1. Every expected event per persona actually landed.
--   2. No duplicate idempotency_keys.
--   3. client_timestamp ordering is preserved (no clock skew weirdness).
--
-- You paste the participant ids printed by Playwright into the
-- :participants CTE below. (SQL Editor does not support bind
-- parameters, so we inline them.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Health check — table exists and is shaped correctly.
-- ---------------------------------------------------------------------
SELECT
    'write_ahead_log'                                    AS check_name,
    EXISTS (
        SELECT 1
        FROM   information_schema.tables
        WHERE  table_schema = 'public'
        AND    table_name   = 'write_ahead_log'
    )                                                    AS pass;

-- Confirm the UNIQUE constraint we rely on for idempotency exists.
SELECT
    'idempotency_unique'                                 AS check_name,
    EXISTS (
        SELECT 1
        FROM   pg_indexes
        WHERE  schemaname = 'public'
        AND    tablename  = 'write_ahead_log'
        AND    indexdef LIKE '%UNIQUE%idempotency_key%'
    )                                                    AS pass;

-- ---------------------------------------------------------------------
-- 1. Per-persona record counts.
--    Replace the participant ids below with the ones from the
--    Playwright HTML report (Annotations tab → "participant").
-- ---------------------------------------------------------------------
WITH participants AS (
    SELECT * FROM (VALUES
        -- PASTE IDS HERE — one per row. Example:
        -- ('stage1-persona-fast-1abc-2def'),
        -- ('stage1-persona-thoughtful-3ghi-4jkl'),
        -- ('stage1-persona-disruptive-5mno-6pqr'),
        -- ('stage1-persona-offline-7stu-8vwx'),
        -- ('stage1-persona-slow-llm-9yz-0abc')
        (NULL::TEXT)
    ) AS t(participant_id)
    WHERE participant_id IS NOT NULL
),
counts AS (
    SELECT
        w.participant_id,
        COUNT(*)                                            AS row_count,
        COUNT(DISTINCT w.idempotency_key)                   AS unique_keys,
        COUNT(DISTINCT w.target_table)                      AS distinct_tables,
        MIN(w.client_timestamp)                             AS first_event,
        MAX(w.client_timestamp)                             AS last_event,
        MAX(w.server_timestamp) - MIN(w.client_timestamp)   AS total_span
    FROM   write_ahead_log w
    JOIN   participants     p USING (participant_id)
    GROUP  BY w.participant_id
)
SELECT
    participant_id,
    row_count,
    unique_keys,
    (row_count = unique_keys)                            AS no_duplicates,
    distinct_tables,
    first_event,
    last_event,
    total_span
FROM   counts
ORDER  BY participant_id;

-- ---------------------------------------------------------------------
-- 2. Expected minimums per persona.
--    Adjust the numbers if you change the personas in
--    app/dev/data-layer-test/page.tsx.
-- ---------------------------------------------------------------------
WITH participants AS (
    SELECT * FROM (VALUES
        -- ('stage1-persona-fast-...',        'fast',        12),
        -- ('stage1-persona-thoughtful-...',  'thoughtful',  18),
        -- ('stage1-persona-disruptive-...',  'disruptive',   3),
        -- ('stage1-persona-offline-...',     'offline',      5),
        -- ('stage1-persona-slow-llm-...',    'slow_llm',     3)
        (NULL::TEXT, NULL::TEXT, NULL::INT)
    ) AS t(participant_id, persona, expected_min)
    WHERE participant_id IS NOT NULL
)
SELECT
    p.persona,
    p.participant_id,
    p.expected_min,
    COUNT(w.id)                                          AS actual,
    (COUNT(w.id) >= p.expected_min)                      AS pass
FROM   participants    p
LEFT   JOIN write_ahead_log w USING (participant_id)
GROUP  BY p.persona, p.participant_id, p.expected_min
ORDER  BY p.persona;

-- ---------------------------------------------------------------------
-- 3. Duplicate detection — global (not scoped to participants).
--    If this returns any rows, the UNIQUE constraint is not doing its
--    job or the client is somehow issuing duplicate UUIDs.
-- ---------------------------------------------------------------------
SELECT
    idempotency_key,
    COUNT(*) AS duplicate_count
FROM   write_ahead_log
GROUP  BY idempotency_key
HAVING COUNT(*) > 1;

-- ---------------------------------------------------------------------
-- 4. Clock-skew sanity check.
--    client_timestamp should precede or equal server_timestamp within
--    a few seconds. Flag anything where the client appears > 60s ahead
--    of the server (suggests a bad client clock — research-valid but
--    worth noticing).
-- ---------------------------------------------------------------------
SELECT
    participant_id,
    idempotency_key,
    client_timestamp,
    server_timestamp,
    (client_timestamp - server_timestamp) AS skew
FROM   write_ahead_log
WHERE  client_timestamp > server_timestamp + INTERVAL '60 seconds'
   OR  server_timestamp > client_timestamp + INTERVAL '300 seconds'
ORDER  BY server_timestamp DESC
LIMIT  50;

-- ---------------------------------------------------------------------
-- 5. Recent activity feed (last 100 rows).
--    Useful when you just ran the test suite and want a quick eyeball
--    check of what landed.
-- ---------------------------------------------------------------------
SELECT
    id,
    participant_id,
    target_table,
    event_type,
    jsonb_pretty(payload) AS payload,
    client_timestamp,
    server_timestamp,
    attempts
FROM   write_ahead_log
ORDER  BY server_timestamp DESC
LIMIT  100;

-- ---------------------------------------------------------------------
-- 6. Cleanup helper — uncomment to delete all Stage 1 test rows.
--    This ONLY touches rows whose participant_id starts with the
--    Stage 1 prefix, so production data cannot be harmed.
-- ---------------------------------------------------------------------
-- DELETE FROM write_ahead_log
-- WHERE  participant_id LIKE 'stage1-%';
