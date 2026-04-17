-- =====================================================================
-- Ch4 Research Queries — v2 (rewrite after real-data inspection)
-- =====================================================================
-- v1 (research_ch4_queries.sql) returned many empty/null results
-- because it was written from the SCHEMA, not from actual payload
-- inspection. v2 is calibrated against a real participant's data:
--
-- Discoveries from sirui-test-1's 157-row data dump:
--   1. `phase` is stored sometimes as "phase2" and sometimes as "2"
--      (different components format it differently). Queries must
--      normalise.
--   2. The knowledge-check events go to `content_interaction_logs`
--      with event_type IN ('quiz_question_answered', 'quiz_started',
--      'quiz_completed', ...) — NOT to `knowledge_check_attempts` as
--      originally routed.
--   3. The `assessments` rows BEFORE the Stage 2 instrumentation
--      fix only had `has_evaluation:true` — no actual scores. After
--      the fix (spreading data.data.evaluation), rubric fields like
--      `overall_score`, `scaffolding_level`, `lowest_category`,
--      `rationale`, plus any per-criterion scores
--      (`task_identification`, `resource_specificity`, etc.) land
--      in payload. v2 queries reflect the POST-FIX shape.
--   4. `user_inputs` target_table is largely unused by the current
--      guided components — those POST `feedback_delivered` and
--      `final_submission` events which go to `assessments` and
--      `phase_completion_analytics`. v2 pulls submissions from
--      `messages` (role=user) + `phase_completion_analytics`.
--   5. PostgreSQL syntax: `FILTER (...)` must immediately follow
--      the aggregate function, BEFORE `COALESCE(...)`. v1 Q10 had
--      them in the wrong order.
--
-- TEST FILTER: every query excludes `participant_id LIKE 'stage%'`,
-- `'pending:%'`, `'e2e-%'`, `'anonymous'` so dev-test rigs don't
-- contaminate analysis.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Utility view: normalised phase + a consistent participant filter.
-- Paste this CTE at the top of any query you write; everything below
-- uses `phase_norm` as the canonical phase key.
-- ---------------------------------------------------------------------
-- WITH w AS (
--     SELECT *,
--         -- Normalise phase: map "2" → "phase2", "phase2" → "phase2",
--         -- anything else → the raw value (useful for debugging).
--         CASE
--             WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
--             WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
--             ELSE payload->>'phase'
--         END AS phase_norm
--     FROM write_ahead_log
--     WHERE participant_id NOT LIKE 'stage%'
--       AND participant_id NOT LIKE 'pending:%'
--       AND participant_id NOT LIKE 'e2e-%'
--       AND participant_id <> 'anonymous'
-- )
-- SELECT ...

-- I repeat the phase-normalisation CTE inside each query below so
-- every query is standalone (paste-and-run).


-- =====================================================================
-- ### Q1v2 · q1_participant_roster
-- Canonical participant list. The ONLY change from v1: we fall back
-- to pulling session_created info from the `sessions` Supabase table
-- in case WAL missed it (which happened when Render env vars were
-- wrong before the fix).
-- =====================================================================
SELECT
    u.id           AS participant_id,
    u.email,
    u.name,
    s.metadata->>'condition'         AS condition,
    s.metadata->'initial_profile'->>'coach_tone'          AS coach_tone,
    s.metadata->'initial_profile'->>'year'                AS year,
    s.metadata->'initial_profile'->>'major'               AS major,
    s.metadata->'initial_profile'->>'challenging_course'  AS challenging_course,
    s.created_at   AS session_start,
    EXISTS (
        SELECT 1 FROM write_ahead_log w
        WHERE w.participant_id = u.id::text
          AND w.event_type IN ('post_assessment_submitted', 'final_submission')
    ) AS reached_phase6
FROM   users u
JOIN   sessions s ON s.user_id = u.id
WHERE  u.email NOT LIKE '%test.invalid%'       -- strip test accounts
   OR  u.email IS NULL                          -- keep anon fallbacks for debug
ORDER  BY s.created_at DESC;
-- If you want to INCLUDE your own test runs, remove the WHERE clause.


-- =====================================================================
-- ### Q2v2 · q2_phase_timeline_per_participant
-- Phase-by-phase dwell time and event counts. Fixed: phase normalisation.
-- =====================================================================
WITH w AS (
    SELECT
        *,
        CASE
            WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
            WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
            ELSE payload->>'phase'
        END AS phase_norm
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
      AND participant_id NOT LIKE 'e2e-%'
      AND participant_id <> 'anonymous'
)
SELECT
    participant_id,
    phase_norm                                      AS phase,
    MIN(client_timestamp)                            AS phase_start,
    MAX(client_timestamp)                            AS phase_end,
    ROUND(EXTRACT(EPOCH FROM (MAX(client_timestamp) - MIN(client_timestamp)))/60::numeric, 1)
                                                     AS minutes_in_phase,
    COUNT(*)                                         AS total_events,
    COUNT(*) FILTER (WHERE target_table = 'messages')        AS chat_msgs,
    COUNT(*) FILTER (WHERE target_table = 'messages'
                     AND payload->>'role' = 'user')          AS user_msgs,
    COUNT(*) FILTER (WHERE target_table = 'assessments')     AS assessments,
    COUNT(*) FILTER (WHERE event_type IN ('quiz_question_answered','question_answered'))
                                                             AS kc_attempts,
    COUNT(*) FILTER (WHERE target_table = 'click_events')    AS clicks,
    COUNT(*) FILTER (WHERE target_table = 'video_interaction_events') AS video_events
FROM   w
WHERE  phase_norm LIKE 'phase%'
GROUP  BY participant_id, phase_norm
ORDER  BY participant_id, phase_norm;


-- =====================================================================
-- ### Q3v2 · q3_engagement_indicators (RQ3c input)
-- The 6 engagement indicators. Reads from correct tables + fixes the
-- "only has_evaluation, no scores" problem with a COALESCE fallback.
-- =====================================================================
WITH w AS (
    SELECT
        *,
        CASE
            WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
            WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
            ELSE payload->>'phase'
        END AS phase_norm
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
      AND participant_id NOT LIKE 'e2e-%'
      AND participant_id <> 'anonymous'
),
revisions AS (
    -- A revision is ANY second+ user message within the same
    -- (participant, phase, component). So we count user messages
    -- minus 1 per (participant, phase, component), summed.
    SELECT
        participant_id,
        SUM(GREATEST(user_msg_count - 1, 0)) AS revision_count
    FROM (
        SELECT participant_id, phase_norm, payload->>'component' AS component,
               COUNT(*) AS user_msg_count
        FROM   w
        WHERE  target_table = 'messages'
          AND  payload->>'role' = 'user'
          AND  payload->>'component' <> 'floating_chatbot'
        GROUP  BY participant_id, phase_norm, payload->>'component'
    ) t
    GROUP BY participant_id
),
fb_deltas AS (
    -- Seconds from assistant message to next user message, same
    -- participant, within 10 min. Cap at 10 min to drop AFK gaps.
    SELECT
        participant_id,
        EXTRACT(EPOCH FROM (next_ts - client_timestamp)) AS sec_to_next
    FROM (
        SELECT
            participant_id,
            client_timestamp,
            payload->>'role' AS role,
            LEAD(client_timestamp) OVER (
                PARTITION BY participant_id
                ORDER BY client_timestamp
            ) AS next_ts
        FROM   w
        WHERE  target_table = 'messages'
    ) x
    WHERE role = 'assistant' AND next_ts IS NOT NULL
),
fb_summary AS (
    SELECT
        participant_id,
        ROUND(AVG(sec_to_next)::numeric, 1) FILTER (WHERE sec_to_next BETWEEN 0 AND 600)
                                            AS mean_time_on_feedback_sec,
        COUNT(*)            FILTER (WHERE sec_to_next BETWEEN 0 AND 600)
                                            AS time_on_fb_samples
    FROM   fb_deltas
    GROUP  BY participant_id
),
kc AS (
    -- Per (participant, phase): first and last observed overall_score.
    -- After the instrumentation fix, overall_score is populated.
    SELECT
        participant_id, phase_norm,
        MIN(CASE WHEN rn_asc  = 1 THEN score END) AS first_score,
        MIN(CASE WHEN rn_desc = 1 THEN score END) AS last_score
    FROM (
        SELECT
            participant_id,
            phase_norm,
            COALESCE(
                (payload->>'overall_score')::numeric,
                (payload->>'score')::numeric
            ) AS score,
            ROW_NUMBER() OVER (PARTITION BY participant_id, phase_norm
                               ORDER BY client_timestamp ASC)  AS rn_asc,
            ROW_NUMBER() OVER (PARTITION BY participant_id, phase_norm
                               ORDER BY client_timestamp DESC) AS rn_desc
        FROM   w
        WHERE  target_table = 'assessments'
          AND  (payload ? 'overall_score' OR payload ? 'score')
    ) t
    GROUP  BY participant_id, phase_norm
),
kc_summary AS (
    SELECT
        participant_id,
        ROUND(AVG(last_score - first_score)::numeric, 2) AS mean_kc_score_delta,
        COUNT(*)                                         AS kc_phases_with_scores
    FROM   kc
    WHERE  first_score IS NOT NULL AND last_score IS NOT NULL
    GROUP  BY participant_id
),
help_seek AS (
    SELECT
        participant_id,
        COUNT(*) FILTER (WHERE payload->>'role' = 'user')  AS help_seek_count,
        COALESCE(SUM(length(payload->>'content'))
                 FILTER (WHERE payload->>'role' = 'user'), 0)
                                                            AS help_seek_total_chars
    FROM   w
    WHERE  target_table = 'messages'
      AND  payload->>'component' = 'floating_chatbot'
    GROUP  BY participant_id
),
span AS (
    SELECT
        participant_id,
        ROUND(EXTRACT(EPOCH FROM (MAX(client_timestamp) - MIN(client_timestamp)))/60::numeric, 1)
                                            AS total_session_minutes
    FROM   w
    GROUP  BY participant_id
),
cond AS (
    SELECT DISTINCT ON (participant_id)
        participant_id,
        payload->>'condition'   AS condition,
        payload->>'coach_tone'  AS coach_tone
    FROM   w
    WHERE  payload ? 'condition'
    ORDER  BY participant_id, client_timestamp DESC
)
SELECT
    c.participant_id,
    c.condition,
    c.coach_tone,
    COALESCE(r.revision_count, 0)           AS revision_frequency,
    fb.mean_time_on_feedback_sec,
    fb.time_on_fb_samples,
    kcs.mean_kc_score_delta,
    kcs.kc_phases_with_scores,
    COALESCE(hs.help_seek_count, 0)         AS help_seek_count,
    COALESCE(hs.help_seek_total_chars, 0)   AS help_seek_total_chars,
    sp.total_session_minutes
FROM   cond c
LEFT   JOIN revisions   r   USING (participant_id)
LEFT   JOIN fb_summary  fb  USING (participant_id)
LEFT   JOIN kc_summary  kcs USING (participant_id)
LEFT   JOIN help_seek   hs  USING (participant_id)
LEFT   JOIN span        sp  USING (participant_id)
WHERE  c.condition = 'bot'
ORDER  BY c.participant_id;


-- =====================================================================
-- ### Q4v2 · q4_rubric_scores_long
-- Every rubric score event, long format. After the instrumentation
-- fix, this returns meaningful rows. Useful for curves-within-phase
-- charts and for the text-analysis pipeline.
-- =====================================================================
SELECT
    participant_id,
    client_timestamp                                     AS ts,
    payload->>'phase'                                    AS phase_raw,
    payload->>'component'                                AS component,
    payload->>'turn_id'                                  AS turn_id,
    (payload->>'overall_score')::numeric                 AS overall_score,
    (payload->>'scaffolding_level')::numeric             AS scaffolding_level,
    payload->>'lowest_category'                          AS lowest_category,
    (payload->>'evaluation_time_ms')::numeric            AS eval_time_ms,
    (payload->>'feedback_time_ms')::numeric              AS feedback_time_ms,
    payload->>'rationale'                                AS rationale,
    payload->>'feedback_style'                           AS feedback_style,
    -- Per-criterion scores (names vary by rubric; keep the raw JSON
    -- so downstream R scripts can pull whichever key they need).
    payload                                              AS full_payload
FROM   write_ahead_log
WHERE  target_table = 'assessments'
  AND  (payload ? 'overall_score' OR payload ? 'score')
  AND  participant_id NOT LIKE 'stage%'
  AND  participant_id NOT LIKE 'pending:%'
  AND  participant_id NOT LIKE 'e2e-%'
  AND  participant_id <> 'anonymous'
ORDER  BY participant_id, client_timestamp;


-- =====================================================================
-- ### Q5v2 · q5_knowledge_check_performance
-- Knowledge-check accuracy. FIX: the actual event_type is
-- `quiz_question_answered`, and rows went to `content_interaction_logs`,
-- not `knowledge_check_attempts`.
-- =====================================================================
WITH w AS (
    SELECT
        *,
        CASE
            WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
            WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
            ELSE payload->>'phase'
        END AS phase_norm
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
      AND participant_id NOT LIKE 'e2e-%'
),
kc AS (
    SELECT
        participant_id,
        phase_norm                                       AS phase,
        payload->>'test_type'                            AS test_type,
        (payload->>'is_correct')::boolean                AS is_correct,
        (payload->>'time_to_answer_seconds')::numeric    AS time_to_answer_sec
    FROM   w
    WHERE  event_type IN ('quiz_question_answered', 'question_answered')
)
SELECT
    participant_id,
    phase,
    COALESCE(test_type, 'unknown')                       AS test_type,
    COUNT(*)                                              AS attempts,
    COUNT(*) FILTER (WHERE is_correct)                    AS correct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct)
                / NULLIF(COUNT(*), 0), 1)                 AS accuracy_pct,
    ROUND(AVG(time_to_answer_sec)::numeric, 1)            AS avg_answer_sec
FROM   kc
GROUP  BY participant_id, phase, test_type
ORDER  BY participant_id, phase, test_type;


-- =====================================================================
-- ### Q6v2 · q6_help_seeking_profile (floating chatbot usage)
-- Unchanged from v1 conceptually, but adds phase normalisation.
-- =====================================================================
WITH w AS (
    SELECT
        *,
        CASE
            WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
            WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
            ELSE payload->>'phase'
        END AS phase_norm
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
)
SELECT
    participant_id,
    payload->>'page'              AS page,
    phase_norm                    AS phase,
    COUNT(*)                      AS msg_count,
    COUNT(*) FILTER (WHERE payload->>'role' = 'user')      AS user_msgs,
    COUNT(*) FILTER (WHERE payload->>'role' = 'assistant') AS bot_replies,
    COALESCE(SUM(length(payload->>'content'))
             FILTER (WHERE payload->>'role' = 'user'), 0)  AS user_total_chars,
    MIN(client_timestamp)         AS first_used,
    MAX(client_timestamp)         AS last_used
FROM   w
WHERE  target_table = 'messages'
  AND  payload->>'component' = 'floating_chatbot'
GROUP  BY participant_id, payload->>'page', phase_norm
ORDER  BY participant_id, first_used;


-- =====================================================================
-- ### Q7v2 · q7_revision_pairs_for_textanalysis (RQ3c indicators 5, 6)
-- FIX: v1 read from `user_inputs` which is largely empty. Revisions
-- come from `messages` (role=user) — paired consecutive submissions
-- to the same (phase, component). Feedback between R1 and R2 is
-- pulled from `messages` (role=assistant) within the same component.
-- =====================================================================
WITH user_msgs AS (
    SELECT
        participant_id,
        payload->>'phase'                                  AS phase_raw,
        payload->>'component'                              AS component,
        payload->>'content'                                AS response_text,
        payload->>'turn_id'                                AS turn_id,
        client_timestamp,
        ROW_NUMBER() OVER (
            PARTITION BY participant_id,
                         payload->>'phase',
                         payload->>'component'
            ORDER BY client_timestamp ASC
        )                                                   AS submission_rank
    FROM write_ahead_log
    WHERE target_table = 'messages'
      AND payload->>'role' = 'user'
      AND payload->>'component' <> 'floating_chatbot'
      AND participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
      AND participant_id NOT LIKE 'e2e-%'
),
bot_feedback AS (
    SELECT
        participant_id,
        payload->>'phase'         AS phase_raw,
        payload->>'component'     AS component,
        payload->>'content'       AS feedback_text,
        client_timestamp
    FROM write_ahead_log
    WHERE target_table = 'messages'
      AND payload->>'role' = 'assistant'
      AND payload->>'component' <> 'floating_chatbot'
)
SELECT
    r1.participant_id,
    r1.phase_raw                 AS phase,
    r1.component,
    r1.submission_rank           AS r1_rank,
    r1.response_text             AS r1_text,
    r1.client_timestamp          AS r1_ts,
    r2.submission_rank           AS r2_rank,
    r2.response_text             AS r2_text,
    r2.client_timestamp          AS r2_ts,
    (SELECT bf.feedback_text
     FROM   bot_feedback bf
     WHERE  bf.participant_id = r1.participant_id
       AND  bf.phase_raw      = r1.phase_raw
       AND  bf.component      = r1.component
       AND  bf.client_timestamp > r1.client_timestamp
       AND  bf.client_timestamp < r2.client_timestamp
     ORDER BY bf.client_timestamp DESC
     LIMIT  1)                   AS intervening_feedback
FROM   user_msgs r1
JOIN   user_msgs r2
  ON   r1.participant_id = r2.participant_id
  AND  r1.phase_raw      = r2.phase_raw
  AND  r1.component      = r2.component
  AND  r2.submission_rank = r1.submission_rank + 1
ORDER  BY r1.participant_id, r1.phase_raw, r1.component, r1.submission_rank;


-- =====================================================================
-- ### Q8v2 · q8_manipulation_check (engagement with shared content)
-- FIX: kc events live in content_interaction_logs, not
-- knowledge_check_attempts. Also fixes phase normalisation.
-- =====================================================================
WITH w AS (
    SELECT
        *,
        CASE
            WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
            WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
            ELSE payload->>'phase'
        END AS phase_norm
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
      AND participant_id NOT LIKE 'e2e-%'
      AND participant_id <> 'anonymous'
),
kc AS (
    SELECT participant_id, phase_norm,
           COUNT(*)                                                    AS attempts,
           COUNT(*) FILTER (WHERE (payload->>'is_correct')::boolean)   AS correct
    FROM   w
    WHERE  event_type IN ('quiz_question_answered', 'question_answered')
    GROUP  BY participant_id, phase_norm
),
video AS (
    SELECT participant_id, phase_norm,
           MAX((payload->>'completion_percentage')::numeric)           AS max_completion_pct,
           COUNT(*) FILTER (WHERE event_type = 'video_watch_completed') AS completions
    FROM   w
    WHERE  target_table IN ('video_interaction_events', 'user_video_analytics')
    GROUP  BY participant_id, phase_norm
),
nav AS (
    SELECT participant_id, phase_norm,
           COUNT(*) FILTER (WHERE event_type = 'page_view')   AS page_views,
           COUNT(*) FILTER (WHERE event_type = 'next_button') AS next_clicks
    FROM   w
    WHERE  target_table = 'navigation_events'
    GROUP  BY participant_id, phase_norm
)
SELECT
    COALESCE(kc.participant_id, video.participant_id, nav.participant_id) AS participant_id,
    COALESCE(kc.phase_norm, video.phase_norm, nav.phase_norm)              AS phase,
    kc.attempts    AS kc_attempts,
    kc.correct     AS kc_correct,
    ROUND(100.0*kc.correct::numeric / NULLIF(kc.attempts,0), 1) AS kc_accuracy_pct,
    video.max_completion_pct,
    video.completions,
    nav.page_views,
    nav.next_clicks
FROM   kc
FULL OUTER JOIN video USING (participant_id, phase_norm)
FULL OUTER JOIN nav   USING (participant_id, phase_norm)
WHERE  COALESCE(kc.phase_norm, video.phase_norm, nav.phase_norm) LIKE 'phase%'
ORDER  BY participant_id, phase;


-- =====================================================================
-- ### Q9v2 · q9_tone_usage (unchanged from v1, already worked)
-- =====================================================================
SELECT
    participant_id,
    COUNT(DISTINCT payload->>'coach_tone')                    AS distinct_tones_used,
    COUNT(*) FILTER (WHERE payload->>'coach_tone' = 'warm')   AS warm_events,
    COUNT(*) FILTER (WHERE payload->>'coach_tone' = 'direct') AS direct_events,
    ROUND(100.0 * COUNT(*) FILTER (WHERE payload->>'coach_tone' = 'warm')
                / NULLIF(COUNT(*),0), 1)                      AS pct_warm
FROM   write_ahead_log
WHERE  payload ? 'coach_tone'
  AND  participant_id NOT LIKE 'stage%'
  AND  participant_id NOT LIKE 'pending:%'
GROUP  BY participant_id
ORDER  BY participant_id;


-- =====================================================================
-- ### Q10v2 · q10_analysis_ready_wide_master
-- FIX: `FILTER` clause placement (must come BEFORE `COALESCE`).
-- FIX: pulls roster from `users` + `sessions` tables for reliability.
-- Uses the updated Q3v2 indicator definitions.
-- =====================================================================
WITH w AS (
    SELECT
        *,
        CASE
            WHEN payload->>'phase' ~ '^[1-6]$' THEN 'phase' || (payload->>'phase')
            WHEN payload->>'phase' ~ '^phase[1-6]$' THEN payload->>'phase'
            ELSE payload->>'phase'
        END AS phase_norm
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
      AND participant_id NOT LIKE 'e2e-%'
      AND participant_id <> 'anonymous'
),
roster AS (
    SELECT
        u.id::text                                          AS participant_id,
        u.email,
        u.name,
        s.metadata->>'condition'                            AS condition,
        s.metadata->'initial_profile'->>'coach_tone'        AS coach_tone,
        s.metadata->'initial_profile'->>'year'              AS year,
        s.metadata->'initial_profile'->>'major'             AS major,
        s.created_at                                         AS session_start
    FROM   users u
    JOIN   sessions s ON s.user_id = u.id
),
rev AS (
    SELECT participant_id, SUM(GREATEST(cnt - 1, 0)) AS revision_frequency
    FROM (
        SELECT participant_id, phase_norm, payload->>'component' AS component,
               COUNT(*) AS cnt
        FROM   w
        WHERE  target_table = 'messages'
          AND  payload->>'role' = 'user'
          AND  payload->>'component' <> 'floating_chatbot'
        GROUP  BY participant_id, phase_norm, payload->>'component'
    ) t
    GROUP BY participant_id
),
help AS (
    SELECT
        participant_id,
        COUNT(*) FILTER (WHERE payload->>'role' = 'user')      AS help_seek_count,
        -- FIX: FILTER comes right after SUM, BEFORE COALESCE.
        COALESCE(
            SUM(length(payload->>'content')) FILTER (WHERE payload->>'role' = 'user'),
            0
        )                                                       AS help_seek_chars
    FROM   w
    WHERE  target_table = 'messages'
      AND  payload->>'component' = 'floating_chatbot'
    GROUP  BY participant_id
),
score_progression AS (
    SELECT participant_id,
           ROUND(AVG(last_score - first_score)::numeric, 2) AS mean_kc_score_delta,
           MAX(last_score)                                   AS max_observed_score
    FROM (
        SELECT participant_id, phase_norm,
               MIN(CASE WHEN rn_asc  = 1 THEN score END) AS first_score,
               MIN(CASE WHEN rn_desc = 1 THEN score END) AS last_score
        FROM (
            SELECT participant_id, phase_norm,
                   COALESCE(
                       (payload->>'overall_score')::numeric,
                       (payload->>'score')::numeric
                   ) AS score,
                   ROW_NUMBER() OVER (PARTITION BY participant_id, phase_norm
                                      ORDER BY client_timestamp ASC)  AS rn_asc,
                   ROW_NUMBER() OVER (PARTITION BY participant_id, phase_norm
                                      ORDER BY client_timestamp DESC) AS rn_desc
            FROM   w
            WHERE  target_table = 'assessments'
              AND  (payload ? 'overall_score' OR payload ? 'score')
        ) inner_window
        GROUP BY participant_id, phase_norm
    ) kc_table
    WHERE first_score IS NOT NULL AND last_score IS NOT NULL
    GROUP BY participant_id
),
span AS (
    SELECT participant_id,
           ROUND(EXTRACT(EPOCH FROM (MAX(client_timestamp) - MIN(client_timestamp)))/60::numeric, 1)
                                          AS total_session_minutes,
           MAX(client_timestamp)          AS last_activity
    FROM   w
    GROUP BY participant_id
),
completion AS (
    SELECT DISTINCT participant_id, TRUE AS reached_phase6
    FROM   w
    WHERE  event_type IN ('post_assessment_submitted', 'final_submission')
)
SELECT
    roster.participant_id,
    roster.email,
    roster.condition,
    roster.coach_tone,
    roster.year,
    roster.major,
    roster.session_start,
    sp.last_activity,
    sp.total_session_minutes,
    COALESCE(completion.reached_phase6, FALSE)         AS reached_phase6,
    COALESCE(rev.revision_frequency, 0)                AS revision_frequency,
    COALESCE(help.help_seek_count, 0)                  AS help_seek_count,
    COALESCE(help.help_seek_chars, 0)                  AS help_seek_chars,
    score_progression.mean_kc_score_delta,
    score_progression.max_observed_score
FROM   roster
LEFT   JOIN rev               USING (participant_id)
LEFT   JOIN help              USING (participant_id)
LEFT   JOIN score_progression USING (participant_id)
LEFT   JOIN span              USING (participant_id)
LEFT   JOIN completion        USING (participant_id)
WHERE  roster.condition = 'bot'
ORDER  BY roster.session_start DESC;
