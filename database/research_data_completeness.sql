-- =====================================================================
-- Stage 2 — Researcher tooling: data completeness check
-- =====================================================================
-- Run this in Supabase SQL Editor to see, per participant:
--   - How many WAL events we captured (across all tables)
--   - Whether each phase has the expected minimum events
--   - Whether chat turns are complete (user + assistant + optional assessment)
--   - Whether the session was ever "created" in the research sense
--   - A flag column indicating if the participant's data is COMPLETE
--     enough to include in analysis, or PARTIAL (review manually)
--
-- Use this BEFORE you run your statistical analyses. Any participant
-- with "status = PARTIAL" should be investigated before inclusion.
--
-- This query scans `write_ahead_log` only. It does NOT join the
-- older analytics tables (messages, assessments, etc.) — those may
-- or may not agree with WAL depending on whether dual-write both
-- landed. For research-grade data, WAL is the ground truth.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Per-participant completeness summary
-- ---------------------------------------------------------------------
WITH participant_stats AS (
    SELECT
        participant_id,
        COUNT(*) AS total_events,
        COUNT(*) FILTER (WHERE target_table = 'sessions')                 AS session_events,
        COUNT(*) FILTER (WHERE target_table = 'messages')                 AS messages_events,
        COUNT(*) FILTER (WHERE target_table = 'assessments')              AS assessments_events,
        COUNT(*) FILTER (WHERE target_table = 'knowledge_check_attempts') AS knowledge_checks,
        COUNT(*) FILTER (WHERE target_table = 'user_inputs')              AS user_inputs,
        COUNT(*) FILTER (WHERE target_table = 'content_interaction_logs') AS interaction_logs,
        COUNT(*) FILTER (WHERE target_table = 'click_events')             AS click_events,
        COUNT(*) FILTER (WHERE target_table = 'navigation_events')        AS nav_events,
        COUNT(*) FILTER (WHERE target_table = 'phase_completion_analytics') AS phase_completions,
        COUNT(*) FILTER (WHERE target_table = 'user_video_analytics'
                         OR target_table = 'video_interaction_events')    AS video_events,
        COUNT(DISTINCT (payload->>'phase')) FILTER (WHERE payload ? 'phase'
                                                     AND payload->>'phase' LIKE 'phase%')
                                                                          AS distinct_phases,
        MIN(client_timestamp)                                             AS first_event,
        MAX(client_timestamp)                                             AS last_event,
        (MAX(client_timestamp) - MIN(client_timestamp))                   AS session_duration,
        -- Heuristics for "student actually did the experiment"
        BOOL_OR(event_type = 'session_created'
                OR event_type = 'fallback_session_registered')            AS has_session,
        BOOL_OR(event_type = 'final_submission'
                OR event_type = 'post_assessment_submitted')              AS has_final_submission
    FROM   write_ahead_log
    WHERE  participant_id NOT LIKE 'stage1-%'      -- exclude Stage 1 test rigs
      AND  participant_id NOT LIKE 'stage2-smoke-%' -- exclude Stage 2 smoke tests
      AND  participant_id NOT LIKE 'pending:%'     -- exclude pre-login synth ids
    GROUP BY participant_id
)
SELECT
    participant_id,
    total_events,
    distinct_phases,
    session_duration,
    session_events,
    messages_events,
    assessments_events,
    knowledge_checks,
    phase_completions,
    has_session,
    has_final_submission,
    first_event,
    last_event,
    -- Research-quality flag
    CASE
        WHEN NOT has_session THEN 'NO_SESSION'
        WHEN distinct_phases < 6 THEN 'PARTIAL_PHASES'
        WHEN NOT has_final_submission THEN 'NO_FINAL_SUBMISSION'
        WHEN messages_events = 0 THEN 'NO_CHAT'
        WHEN assessments_events = 0 THEN 'NO_ASSESSMENTS'
        ELSE 'COMPLETE'
    END                                                                  AS status
FROM   participant_stats
ORDER  BY first_event DESC;

-- ---------------------------------------------------------------------
-- Chat-turn integrity check: for every turn_id in the messages table,
-- confirm we have at least a user message. Assistant response is
-- expected but may be missing if the LLM call failed. Assessment is
-- optional (only main chat, not floating chatbot).
-- ---------------------------------------------------------------------
WITH turns AS (
    SELECT
        participant_id,
        payload->>'turn_id'                                               AS turn_id,
        payload->>'phase'                                                 AS phase,
        payload->>'component'                                             AS component,
        COUNT(*) FILTER (WHERE target_table = 'messages'
                         AND payload->>'role' = 'user')                   AS user_msgs,
        COUNT(*) FILTER (WHERE target_table = 'messages'
                         AND payload->>'role' = 'assistant')              AS asst_msgs,
        COUNT(*) FILTER (WHERE target_table = 'assessments')              AS assessments
    FROM   write_ahead_log
    WHERE  payload ? 'turn_id'
      AND  participant_id NOT LIKE 'stage%'
    GROUP  BY participant_id, payload->>'turn_id', payload->>'phase', payload->>'component'
)
SELECT
    participant_id,
    phase,
    component,
    COUNT(*)                                                              AS total_turns,
    COUNT(*) FILTER (WHERE user_msgs = 0)                                 AS missing_user,
    COUNT(*) FILTER (WHERE asst_msgs = 0)                                 AS missing_assistant,
    COUNT(*) FILTER (WHERE component = 'main' AND assessments = 0)        AS main_without_assessment
FROM   turns
GROUP  BY participant_id, phase, component
HAVING COUNT(*) FILTER (WHERE user_msgs = 0) > 0
    OR COUNT(*) FILTER (WHERE asst_msgs = 0) > 0
ORDER  BY participant_id, phase;

-- ---------------------------------------------------------------------
-- Phase coverage matrix: for each participant × phase, did we get
-- any data at all? (Research analysis typically requires all 6
-- phases per participant.)
-- ---------------------------------------------------------------------
SELECT
    participant_id,
    COUNT(*) FILTER (WHERE payload->>'phase' = 'phase1')       AS phase1_events,
    COUNT(*) FILTER (WHERE payload->>'phase' = 'phase2')       AS phase2_events,
    COUNT(*) FILTER (WHERE payload->>'phase' = 'phase3')       AS phase3_events,
    COUNT(*) FILTER (WHERE payload->>'phase' = 'phase4')       AS phase4_events,
    COUNT(*) FILTER (WHERE payload->>'phase' = 'phase5')       AS phase5_events,
    COUNT(*) FILTER (WHERE payload->>'phase' = 'phase6')       AS phase6_events
FROM   write_ahead_log
WHERE  participant_id NOT LIKE 'stage%'
  AND  participant_id NOT LIKE 'pending:%'
GROUP  BY participant_id
ORDER  BY participant_id;

-- ---------------------------------------------------------------------
-- Condition assignment audit: which condition was each participant
-- assigned to? (Randomisation-check data; matters for pre-registered
-- analyses.)
-- ---------------------------------------------------------------------
SELECT
    participant_id,
    payload->>'condition'    AS condition,
    payload->>'coach_tone'   AS coach_tone,
    payload->>'email'        AS email,
    client_timestamp         AS session_started
FROM   write_ahead_log
WHERE  event_type = 'session_created'
  AND  participant_id NOT LIKE 'stage%'
ORDER  BY client_timestamp;

-- ---------------------------------------------------------------------
-- Failed events audit: the DataLayer archives records that couldn't
-- be synced after 20 retry attempts. If ANY rows exist in the
-- `:failed` localStorage key of ANY participant, the researcher
-- should be alerted. Since we can't query localStorage from SQL,
-- this section is a placeholder for Stage 3's server-side failed-
-- event collector. For now, it's a reminder:
-- ---------------------------------------------------------------------
SELECT
    'Check individual participant browsers for localStorage key ' ||
    'sol2l_wal_queue_v1:<pid>:failed — if non-empty, data is stuck '
    || 'in the browser and needs manual recovery.'  AS note;
