-- =====================================================================
-- Stage 2.2 — Researcher tooling: data analysis BY CONDITION
-- =====================================================================
-- Stage 2.2 auto-tags every WAL record with the participant's
-- experimental condition (`payload.condition`: 'bot' or 'static')
-- and coach tone (`payload.coach_tone`: 'warm' / 'direct' / etc.),
-- read from localStorage at capture time.
--
-- This lets you filter, group, or compare by experimental condition
-- WITHOUT joining back to the session_created event.
--
-- Run these in Supabase SQL Editor (project moowjbwvntdsrrgxbtal).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PARTICIPANT COUNT BY CONDITION
--    How many participants are in each arm? (Randomisation check.)
-- ---------------------------------------------------------------------
SELECT
    payload->>'condition'    AS condition,
    payload->>'coach_tone'   AS coach_tone,
    COUNT(DISTINCT participant_id) AS n_participants
FROM   write_ahead_log
WHERE  participant_id NOT LIKE 'stage%'         -- exclude dev/test rigs
  AND  participant_id NOT LIKE 'pending:%'      -- exclude pre-login
  AND  payload ? 'condition'                    -- only tagged records
GROUP  BY payload->>'condition', payload->>'coach_tone'
ORDER  BY condition, coach_tone;

-- ---------------------------------------------------------------------
-- 2. EVENT VOLUME PER CONDITION × TARGET TABLE
--    Does each condition generate the expected amount of each type
--    of event? Big asymmetries here are a signal that instrumentation
--    is missing for one arm.
--
--    NOTE: It's EXPECTED that 'static' condition has 0 rows in
--    `messages` (component='main' or 'floating_chatbot') because
--    control students don't see the chatbot.
-- ---------------------------------------------------------------------
SELECT
    payload->>'condition'          AS condition,
    target_table,
    COUNT(*)                        AS events,
    COUNT(DISTINCT participant_id)  AS n_participants,
    ROUND(COUNT(*)::numeric
          / NULLIF(COUNT(DISTINCT participant_id), 0), 1)
                                    AS events_per_participant
FROM   write_ahead_log
WHERE  participant_id NOT LIKE 'stage%'
  AND  participant_id NOT LIKE 'pending:%'
  AND  payload ? 'condition'
GROUP  BY payload->>'condition', target_table
ORDER  BY condition, target_table;

-- ---------------------------------------------------------------------
-- 3. COMPLETENESS-BY-CONDITION SUMMARY
--    Per-participant roll-up with status column, grouped by condition.
--    Use this to confirm completion rates are comparable across arms.
-- ---------------------------------------------------------------------
WITH per_participant AS (
    SELECT
        participant_id,
        MIN(payload->>'condition')   AS condition,
        COUNT(*)                      AS total_events,
        COUNT(DISTINCT (payload->>'phase')) FILTER (WHERE payload ? 'phase'
                                                    AND payload->>'phase' LIKE 'phase%')
                                      AS distinct_phases,
        BOOL_OR(event_type = 'session_created'
                OR event_type = 'fallback_session_registered') AS has_session,
        BOOL_OR(event_type = 'final_submission'
                OR event_type = 'post_assessment_submitted')   AS has_final
    FROM   write_ahead_log
    WHERE  participant_id NOT LIKE 'stage%'
      AND  participant_id NOT LIKE 'pending:%'
    GROUP BY participant_id
)
SELECT
    condition,
    COUNT(*)                                          AS n_participants,
    COUNT(*) FILTER (WHERE has_session)               AS has_session,
    COUNT(*) FILTER (WHERE distinct_phases >= 6)      AS finished_all_phases,
    COUNT(*) FILTER (WHERE has_final)                 AS submitted_final,
    ROUND(AVG(total_events), 1)                       AS avg_events,
    ROUND(AVG(distinct_phases), 2)                    AS avg_phases_reached
FROM   per_participant
WHERE  condition IS NOT NULL
GROUP  BY condition
ORDER  BY condition;

-- ---------------------------------------------------------------------
-- 4. UNCONDITIONED PARTICIPANTS (should be empty after Stage 2.2)
--    Rows that somehow slipped through WITHOUT a condition tag. If
--    any show up, the participant's localStorage.solbot_condition
--    was missing at capture time — investigate manually.
-- ---------------------------------------------------------------------
SELECT
    participant_id,
    COUNT(*)                  AS untagged_events,
    MIN(client_timestamp)     AS first_seen,
    MAX(client_timestamp)     AS last_seen,
    array_agg(DISTINCT target_table) AS tables_affected
FROM   write_ahead_log
WHERE  participant_id NOT LIKE 'stage%'
  AND  participant_id NOT LIKE 'pending:%'
  AND  NOT (payload ? 'condition')
GROUP  BY participant_id
ORDER  BY first_seen DESC;

-- ---------------------------------------------------------------------
-- 5. CONDITION-LEVEL COMPARISONS (for the pre-registered analysis)
--    This is a template. Replace the metric of interest.
--    Example: average time on task by condition (client_timestamp
--    range per participant, averaged within condition).
-- ---------------------------------------------------------------------
WITH pp AS (
    SELECT
        participant_id,
        payload->>'condition'  AS condition,
        MIN(client_timestamp)   AS first_event,
        MAX(client_timestamp)   AS last_event
    FROM   write_ahead_log
    WHERE  participant_id NOT LIKE 'stage%'
      AND  payload ? 'condition'
    GROUP BY participant_id, payload->>'condition'
)
SELECT
    condition,
    COUNT(*)                                                        AS n,
    ROUND(EXTRACT(EPOCH FROM AVG(last_event - first_event))/60, 1)  AS avg_session_minutes,
    ROUND(EXTRACT(EPOCH FROM STDDEV(last_event - first_event))/60, 1)
                                                                    AS sd_session_minutes
FROM   pp
WHERE  condition IS NOT NULL
GROUP  BY condition
ORDER  BY condition;

-- ---------------------------------------------------------------------
-- 6. SANITY: where did the condition assignment come from?
--    Every participant's condition should appear in a session_created
--    (or fallback_session_registered) WAL row. Confirms the
--    randomisation chain is captured.
-- ---------------------------------------------------------------------
SELECT
    participant_id,
    payload->>'condition'    AS assigned_condition,
    payload->>'coach_tone'   AS coach_tone,
    event_type,
    client_timestamp
FROM   write_ahead_log
WHERE  event_type IN ('session_created', 'fallback_session_registered')
  AND  participant_id NOT LIKE 'stage%'
ORDER  BY client_timestamp DESC
LIMIT  50;
