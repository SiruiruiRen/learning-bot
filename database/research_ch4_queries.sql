-- =====================================================================
-- Ch4 Dissertation Queries (Bot-condition only, N ≈ 60)
-- =====================================================================
-- Pre-registered design: N=102 with Bot/MMI 2:1 random assignment.
-- Practical collection: ~60 students, all Bot condition. That means:
--   ✓ RQ3c  — LPA within-Bot engagement profiles        ← primary focus
--   ✓ RQ3d  — profile → T1/T2 outcomes                  ← primary focus
--   ✓ Descriptives, dose-response, manipulation checks  ← needed
--   ✗ RQ3a/3b — Bot vs MMI comparison                   ← not possible (no MMI)
--   ✗ RQ3e  — first-gen × condition moderation         ← partial (can test main effect of first-gen within Bot)
--
-- These queries read the Supabase `write_ahead_log` table. Surveys,
-- exam scores, and LMS traces live OUTSIDE the platform (Qualtrics,
-- Canvas) and will be joined in R/Python on `participant_id` = users.id.
--
-- Run each numbered query independently. Everything past "-- ###" is
-- a new query. Query names match the proposal extraction so they can
-- drive a reproducible analysis pipeline.
-- =====================================================================


-- =====================================================================
-- ### Q1 · q1_participant_roster
-- For every participant: when they started, their condition, tone,
-- whether first-gen flag was captured, and whether they reached the
-- final phase 6 assessment.
--
-- Use as the CANONICAL participant list. Everything joins to this.
-- =====================================================================
WITH first_session AS (
    SELECT DISTINCT ON (participant_id)
        participant_id,
        payload->>'email'       AS email,
        payload->>'name'        AS name,
        payload->>'condition'   AS condition,
        payload->>'coach_tone'  AS coach_tone,
        (payload->'profile_data'->>'year')              AS year,
        (payload->'profile_data'->>'major')             AS major,
        (payload->'profile_data'->>'challenging_course') AS course,
        client_timestamp        AS started_at
    FROM   write_ahead_log
    WHERE  event_type = 'session_created'
      AND  participant_id NOT LIKE 'stage%'
      AND  participant_id NOT LIKE 'pending:%'
      AND  participant_id NOT LIKE 'e2e-%'
    ORDER BY participant_id, client_timestamp
),
final_submission AS (
    SELECT DISTINCT participant_id
    FROM   write_ahead_log
    WHERE  event_type IN ('post_assessment_submitted', 'final_submission')
)
SELECT
    fs.participant_id,
    fs.email,
    fs.name,
    fs.condition,
    fs.coach_tone,
    fs.year,
    fs.major,
    fs.course,
    fs.started_at,
    (finals.participant_id IS NOT NULL) AS reached_phase6
FROM   first_session fs
LEFT JOIN final_submission finals USING (participant_id)
ORDER BY fs.started_at;


-- =====================================================================
-- ### Q2 · q2_phase_timeline_per_participant
-- One row per (participant, phase) with entry time, exit time,
-- duration, and event counts. Drives dose-response analyses.
-- =====================================================================
WITH phase_events AS (
    SELECT
        participant_id,
        payload->>'phase'   AS phase,
        MIN(client_timestamp) AS phase_start,
        MAX(client_timestamp) AS phase_end,
        COUNT(*)              AS total_events,
        COUNT(*) FILTER (WHERE target_table = 'messages')             AS chat_msgs,
        COUNT(*) FILTER (WHERE target_table = 'messages'
                         AND payload->>'role' = 'user')               AS user_msgs,
        COUNT(*) FILTER (WHERE target_table = 'assessments')          AS assessments,
        COUNT(*) FILTER (WHERE target_table = 'knowledge_check_attempts') AS kc_attempts,
        COUNT(*) FILTER (WHERE target_table = 'user_inputs')          AS submissions,
        COUNT(*) FILTER (WHERE target_table = 'click_events')         AS clicks
    FROM   write_ahead_log
    WHERE  payload ? 'phase'
      AND  payload->>'phase' LIKE 'phase%'
      AND  participant_id NOT LIKE 'stage%'
      AND  participant_id NOT LIKE 'pending:%'
    GROUP  BY participant_id, payload->>'phase'
)
SELECT
    participant_id,
    phase,
    phase_start,
    phase_end,
    EXTRACT(EPOCH FROM (phase_end - phase_start))/60 AS minutes_in_phase,
    total_events, chat_msgs, user_msgs, assessments, kc_attempts, submissions, clicks
FROM   phase_events
ORDER  BY participant_id, phase;


-- =====================================================================
-- ### Q3 · q3_engagement_indicators (RQ3c input, Bot only)
-- The six engagement indicators from Table 4.2 of the proposal —
-- the ones that can be computed purely from platform logs. (Indicators
-- 5 & 6 are text-based and need an offline pass; Q7 pulls the R1/R2
-- pairs for that.)
--
-- Per participant, one row:
--   revision_frequency           — total # of revision turns (turn with revision_number > 1 or attempt > 1)
--   mean_time_on_feedback_sec    — sec between feedback and next user action, averaged
--   kc_score_delta               — final rubric score minus first rubric score per phase, averaged
--   help_seek_count              — # of floating-chatbot user messages
--   help_seek_total_chars        — total typed chars in floating chatbot
--   total_session_minutes        — participant's span (first → last WAL event)
--
-- Feed these into LPA (after z-scoring in R).
-- =====================================================================
WITH base AS (
    SELECT
        w.participant_id,
        w.client_timestamp,
        w.target_table,
        w.event_type,
        w.payload
    FROM   write_ahead_log w
    WHERE  w.participant_id NOT LIKE 'stage%'
      AND  w.participant_id NOT LIKE 'pending:%'
),
-- Revisions: any user_inputs or messages beyond the first within a
-- (phase, component). Proxy: revision_number > 1, OR attempt_number > 1,
-- OR more than one user message in a turn.
revisions AS (
    SELECT
        participant_id,
        COUNT(*) AS revision_count
    FROM   base
    WHERE  (
              (payload->>'revision_number')::int > 1
           OR (payload->>'attempt_number')::int > 1
           OR event_type IN ('revision_submitted', 'revision_started')
           )
    GROUP  BY participant_id
),
-- Time-on-feedback: for each assistant 'messages' record, measure the
-- seconds until the SAME participant's next user message (ordered by
-- time). Using LEAD() over the participant's event stream.
fb_deltas AS (
    SELECT
        participant_id,
        EXTRACT(EPOCH FROM (next_ts - client_timestamp)) AS sec_to_next
    FROM (
        SELECT
            participant_id,
            client_timestamp,
            target_table,
            payload->>'role' AS role,
            LEAD(client_timestamp) OVER (
                PARTITION BY participant_id
                ORDER BY client_timestamp
            ) AS next_ts
        FROM base
        WHERE target_table = 'messages'
    ) x
    WHERE role = 'assistant' AND next_ts IS NOT NULL
),
fb_summary AS (
    SELECT
        participant_id,
        AVG(sec_to_next) FILTER (WHERE sec_to_next BETWEEN 0 AND 600) AS mean_time_on_feedback_sec,
        COUNT(*)         FILTER (WHERE sec_to_next BETWEEN 0 AND 600) AS time_on_fb_samples
    FROM   fb_deltas
    GROUP  BY participant_id
),
-- KC score delta: per phase, ordered by timestamp, compute
-- (last overall_score − first overall_score). Then average over phases.
kc AS (
    SELECT
        participant_id,
        payload->>'phase' AS phase,
        MIN(CASE WHEN rn_asc  = 1 THEN (payload->>'overall_score')::numeric END) AS first_score,
        MIN(CASE WHEN rn_desc = 1 THEN (payload->>'overall_score')::numeric END) AS last_score
    FROM (
        SELECT
            participant_id,
            payload,
            client_timestamp,
            ROW_NUMBER() OVER (PARTITION BY participant_id, payload->>'phase'
                               ORDER BY client_timestamp ASC)  AS rn_asc,
            ROW_NUMBER() OVER (PARTITION BY participant_id, payload->>'phase'
                               ORDER BY client_timestamp DESC) AS rn_desc
        FROM   base
        WHERE  target_table = 'assessments'
          AND  payload ? 'overall_score'
          AND  payload ? 'phase'
    ) t
    GROUP  BY participant_id, payload->>'phase'
),
kc_summary AS (
    SELECT
        participant_id,
        AVG(last_score - first_score) AS mean_kc_score_delta,
        COUNT(*)                       AS kc_phases
    FROM   kc
    WHERE  first_score IS NOT NULL AND last_score IS NOT NULL
    GROUP  BY participant_id
),
help_seek AS (
    SELECT
        participant_id,
        COUNT(*)                                              AS help_seek_count,
        COALESCE(SUM(length(payload->>'content')::numeric), 0) AS help_seek_total_chars
    FROM   base
    WHERE  target_table = 'messages'
      AND  payload->>'component' = 'floating_chatbot'
      AND  payload->>'role' = 'user'
    GROUP  BY participant_id
),
span AS (
    SELECT
        participant_id,
        EXTRACT(EPOCH FROM (MAX(client_timestamp) - MIN(client_timestamp)))/60 AS total_session_minutes
    FROM   base
    GROUP  BY participant_id
)
SELECT
    r.participant_id,
    r.condition,
    r.coach_tone,
    COALESCE(rv.revision_count, 0)         AS revision_frequency,
    fb.mean_time_on_feedback_sec,
    fb.time_on_fb_samples,
    kcs.mean_kc_score_delta,
    COALESCE(hs.help_seek_count, 0)        AS help_seek_count,
    COALESCE(hs.help_seek_total_chars, 0)  AS help_seek_total_chars,
    sp.total_session_minutes
FROM (SELECT DISTINCT ON (participant_id)
        participant_id,
        payload->>'condition' AS condition,
        payload->>'coach_tone' AS coach_tone
      FROM write_ahead_log
      WHERE event_type = 'session_created'
        AND participant_id NOT LIKE 'stage%'
      ORDER BY participant_id, client_timestamp) r
LEFT JOIN revisions   rv  USING (participant_id)
LEFT JOIN fb_summary  fb  USING (participant_id)
LEFT JOIN kc_summary  kcs USING (participant_id)
LEFT JOIN help_seek   hs  USING (participant_id)
LEFT JOIN span        sp  USING (participant_id)
WHERE r.condition = 'bot'
ORDER BY r.participant_id;


-- =====================================================================
-- ### Q4 · q4_rubric_scores_long (RQ3c / RQ3d component)
-- Every rubric score event with phase, component, scaffolding level.
-- Long format (one row per assessment event). Use this to compute
-- within-phase improvement curves, or a heatmap of scaffolding-level
-- usage by phase.
-- =====================================================================
SELECT
    participant_id,
    client_timestamp                         AS ts,
    payload->>'phase'                        AS phase,
    payload->>'component'                    AS component,
    (payload->>'overall_score')::numeric     AS overall_score,
    (payload->>'scaffolding_level')::numeric AS scaffolding_level,
    payload->>'lowest_category'              AS lowest_category,
    payload->>'turn_id'                      AS turn_id
FROM   write_ahead_log
WHERE  target_table = 'assessments'
  AND  payload ? 'overall_score'
  AND  participant_id NOT LIKE 'stage%'
  AND  participant_id NOT LIKE 'pending:%'
ORDER BY participant_id, client_timestamp;


-- =====================================================================
-- ### Q5 · q5_knowledge_check_performance
-- Pre/post and per-phase knowledge-check accuracy per participant.
-- The proposal doesn't require a KC-accuracy analysis on the bot
-- platform (that's Exam 1/2/3 via Canvas), but this is useful for
-- manipulation checks ("did participants actually engage with
-- content?"), and for describing the Bot-only sample.
-- =====================================================================
WITH kc AS (
    SELECT
        participant_id,
        payload->>'phase'                     AS phase,
        payload->>'test_type'                 AS test_type,
        payload->>'event_type'                AS kc_event,
        (payload->>'is_correct')::boolean     AS is_correct,
        (payload->>'time_to_answer_seconds')::numeric AS time_to_answer_sec
    FROM   write_ahead_log
    WHERE  target_table = 'knowledge_check_attempts'
      AND  payload->>'event_type' = 'question_answered'
      AND  participant_id NOT LIKE 'stage%'
)
SELECT
    participant_id,
    phase,
    COALESCE(test_type, 'unknown') AS test_type,
    COUNT(*)                                                       AS questions_attempted,
    COUNT(*) FILTER (WHERE is_correct)                             AS correct,
    ROUND(100.0 * COUNT(*) FILTER (WHERE is_correct)
                / NULLIF(COUNT(*), 0), 1)                          AS accuracy_pct,
    ROUND(AVG(time_to_answer_sec)::numeric, 1)                     AS avg_answer_sec
FROM   kc
GROUP  BY participant_id, phase, test_type
ORDER  BY participant_id, phase, test_type;


-- =====================================================================
-- ### Q6 · q6_help_seeking_profile (floating chatbot use)
-- Indicator #4 of the engagement table. Who uses the popup chatbot,
-- how often, on which pages, and what kinds of questions?
-- =====================================================================
SELECT
    participant_id,
    payload->>'page'    AS page,
    payload->>'phase'   AS phase,
    COUNT(*)             AS msg_count,
    COUNT(*) FILTER (WHERE payload->>'role' = 'user')         AS user_msgs,
    COUNT(*) FILTER (WHERE payload->>'role' = 'assistant')    AS bot_replies,
    MIN(client_timestamp) AS first_used,
    MAX(client_timestamp) AS last_used
FROM   write_ahead_log
WHERE  target_table = 'messages'
  AND  payload->>'component' = 'floating_chatbot'
  AND  participant_id NOT LIKE 'stage%'
GROUP  BY participant_id, payload->>'page', payload->>'phase'
ORDER  BY participant_id, first_used;


-- =====================================================================
-- ### Q7 · q7_revision_pairs_for_textanalysis (RQ3c indicators 5 & 6)
-- Extract R1 vs R2 text pairs for each participant × phase ×
-- component so you can run offline lexical / semantic analysis in
-- Python / R. This is the STRUCTURED INPUT for computing:
--   - revision depth (R1 vs R2)
--   - feedback integration (feedback vs R2)
-- Both of those composite indicators go into the LPA alongside the
-- numerical indicators from Q3.
-- =====================================================================
WITH submissions AS (
    SELECT
        participant_id,
        payload->>'phase'                          AS phase,
        payload->>'component'                      AS component,
        payload->>'turn_id'                        AS turn_id,
        payload->>'input_value'                    AS response_text,
        (payload->>'revision_number')::int         AS revision_number,
        (payload->>'attempt_number')::int          AS attempt_number,
        client_timestamp                            AS ts,
        ROW_NUMBER() OVER (
            PARTITION BY participant_id, payload->>'phase', payload->>'component'
            ORDER BY client_timestamp ASC
        )                                           AS within_phase_rank
    FROM   write_ahead_log
    WHERE  target_table = 'user_inputs'
      AND  payload ? 'input_value'
      AND  participant_id NOT LIKE 'stage%'
),
feedback_msgs AS (
    SELECT
        participant_id,
        payload->>'turn_id'     AS turn_id,
        payload->>'phase'       AS phase,
        payload->>'component'   AS component,
        payload->>'content'     AS feedback_text,
        client_timestamp         AS ts
    FROM   write_ahead_log
    WHERE  target_table = 'messages'
      AND  payload->>'role' = 'assistant'
)
SELECT
    s1.participant_id,
    s1.phase,
    s1.component,
    s1.within_phase_rank     AS r1_rank,
    s1.response_text         AS r1_text,
    s1.ts                    AS r1_ts,
    s2.within_phase_rank     AS r2_rank,
    s2.response_text         AS r2_text,
    s2.ts                    AS r2_ts,
    -- Feedback between them: most recent assistant msg where its ts
    -- falls between r1_ts and r2_ts for the same participant.
    (SELECT fm.feedback_text
     FROM   feedback_msgs fm
     WHERE  fm.participant_id = s1.participant_id
       AND  fm.ts > s1.ts AND fm.ts < s2.ts
     ORDER BY fm.ts DESC
     LIMIT 1)                AS intervening_feedback
FROM submissions s1
JOIN submissions s2
  ON  s1.participant_id = s2.participant_id
  AND s1.phase          = s2.phase
  AND s1.component      = s2.component
  AND s2.within_phase_rank = s1.within_phase_rank + 1
ORDER BY s1.participant_id, s1.phase, s1.component, s1.within_phase_rank;


-- =====================================================================
-- ### Q8 · q8_manipulation_check (engagement with shared content)
-- Knowledge-check accuracy + video completion rate + navigation
-- events per phase. For a Bot-only sample this is descriptive;
-- when MMI data arrives later, same query can be grouped by
-- condition to test equivalence on shared content (proposal
-- "preliminary checks").
-- =====================================================================
WITH kc AS (
    SELECT
        participant_id,
        payload->>'phase' AS phase,
        COUNT(*)           AS attempts,
        COUNT(*) FILTER (WHERE (payload->>'is_correct')::boolean) AS correct
    FROM   write_ahead_log
    WHERE  target_table = 'knowledge_check_attempts'
      AND  payload->>'event_type' = 'question_answered'
      AND  participant_id NOT LIKE 'stage%'
    GROUP  BY participant_id, payload->>'phase'
),
video AS (
    SELECT
        participant_id,
        payload->>'phase' AS phase,
        MAX((payload->>'completion_percentage')::numeric) AS max_completion_pct,
        COUNT(*) FILTER (WHERE event_type = 'video_watch_completed') AS completions
    FROM   write_ahead_log
    WHERE  target_table IN ('video_interaction_events', 'user_video_analytics')
      AND  participant_id NOT LIKE 'stage%'
    GROUP  BY participant_id, payload->>'phase'
),
nav AS (
    SELECT
        participant_id,
        payload->>'phase' AS phase,
        COUNT(*) FILTER (WHERE event_type = 'page_view')   AS page_views,
        COUNT(*) FILTER (WHERE event_type = 'next_button') AS next_clicks
    FROM   write_ahead_log
    WHERE  target_table = 'navigation_events'
    GROUP  BY participant_id, payload->>'phase'
)
SELECT
    COALESCE(kc.participant_id, video.participant_id, nav.participant_id) AS participant_id,
    COALESCE(kc.phase, video.phase, nav.phase)                             AS phase,
    kc.attempts      AS kc_attempts,
    kc.correct       AS kc_correct,
    ROUND(100.0*kc.correct::numeric / NULLIF(kc.attempts,0), 1) AS kc_accuracy_pct,
    video.max_completion_pct,
    video.completions,
    nav.page_views,
    nav.next_clicks
FROM   kc
FULL OUTER JOIN video USING (participant_id, phase)
FULL OUTER JOIN nav   USING (participant_id, phase)
ORDER  BY participant_id, phase;


-- =====================================================================
-- ### Q9 · q9_tone_usage (exploratory, relates to BPNSFS/autonomy)
-- Did each participant's tone preference stay warm/direct across
-- phases, or did they flip? Flip-rate is an exploratory individual-
-- difference measure that may correlate with autonomy satisfaction
-- (BPNSFS, T1 survey).
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
GROUP  BY participant_id
ORDER  BY participant_id;


-- =====================================================================
-- ### Q10 · q10_analysis_ready_wide_master
-- One row per Bot participant. Joins Q1 + Q3 + Q5 + Q8 + Q9 into a
-- wide table ready for export to R / Python. The researcher's
-- analysis script only needs to:
--   (a) pull this from Supabase into a DataFrame
--   (b) merge with Qualtrics survey CSV on email/participant_id
--   (c) merge with Canvas exam CSV
--   (d) run LPA, ANCOVA, etc.
-- =====================================================================
WITH roster AS (
    SELECT DISTINCT ON (participant_id)
        participant_id,
        payload->>'email'      AS email,
        payload->>'condition'  AS condition,
        payload->>'coach_tone' AS coach_tone,
        (payload->'profile_data'->>'year')              AS year,
        (payload->'profile_data'->>'major')             AS major,
        client_timestamp       AS session_start
    FROM write_ahead_log
    WHERE event_type = 'session_created'
      AND participant_id NOT LIKE 'stage%'
      AND participant_id NOT LIKE 'pending:%'
    ORDER BY participant_id, client_timestamp
),
rev AS (
    SELECT
        participant_id,
        COUNT(*) AS revision_frequency
    FROM write_ahead_log
    WHERE ((payload->>'revision_number')::int > 1
       OR  (payload->>'attempt_number')::int > 1
       OR  event_type IN ('revision_submitted', 'revision_started'))
      AND participant_id NOT LIKE 'stage%'
    GROUP BY participant_id
),
help AS (
    SELECT
        participant_id,
        COUNT(*) FILTER (WHERE payload->>'role' = 'user') AS help_seek_count,
        COALESCE(SUM(length(payload->>'content')), 0) FILTER (WHERE payload->>'role' = 'user')
                                                           AS help_seek_chars
    FROM write_ahead_log
    WHERE target_table = 'messages'
      AND payload->>'component' = 'floating_chatbot'
      AND participant_id NOT LIKE 'stage%'
    GROUP BY participant_id
),
score_progression AS (
    SELECT
        participant_id,
        AVG(last_score - first_score) AS mean_kc_score_delta,
        MAX(last_score)                AS max_observed_score
    FROM (
        SELECT
            participant_id,
            payload->>'phase' AS phase,
            MIN(CASE WHEN rn_asc = 1  THEN (payload->>'overall_score')::numeric END) AS first_score,
            MIN(CASE WHEN rn_desc = 1 THEN (payload->>'overall_score')::numeric END) AS last_score
        FROM (
            SELECT
                participant_id, payload, client_timestamp,
                ROW_NUMBER() OVER (PARTITION BY participant_id, payload->>'phase'
                                   ORDER BY client_timestamp ASC)  AS rn_asc,
                ROW_NUMBER() OVER (PARTITION BY participant_id, payload->>'phase'
                                   ORDER BY client_timestamp DESC) AS rn_desc
            FROM write_ahead_log
            WHERE target_table = 'assessments'
              AND payload ? 'overall_score'
              AND payload ? 'phase'
              AND participant_id NOT LIKE 'stage%'
        ) w
        GROUP BY participant_id, payload->>'phase'
    ) t
    WHERE first_score IS NOT NULL AND last_score IS NOT NULL
    GROUP BY participant_id
),
span AS (
    SELECT
        participant_id,
        EXTRACT(EPOCH FROM (MAX(client_timestamp) - MIN(client_timestamp)))/60
                                              AS total_session_minutes,
        MAX(client_timestamp)                 AS last_activity
    FROM write_ahead_log
    WHERE participant_id NOT LIKE 'stage%'
    GROUP BY participant_id
),
completion AS (
    SELECT DISTINCT
        participant_id,
        TRUE AS reached_phase6
    FROM write_ahead_log
    WHERE event_type IN ('post_assessment_submitted', 'final_submission')
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
    COALESCE(completion.reached_phase6, FALSE)                  AS reached_phase6,
    COALESCE(rev.revision_frequency, 0)                         AS revision_frequency,
    COALESCE(help.help_seek_count, 0)                           AS help_seek_count,
    COALESCE(help.help_seek_chars, 0)                           AS help_seek_chars,
    score_progression.mean_kc_score_delta,
    score_progression.max_observed_score
FROM  roster
LEFT  JOIN rev              USING (participant_id)
LEFT  JOIN help             USING (participant_id)
LEFT  JOIN score_progression USING (participant_id)
LEFT  JOIN span              USING (participant_id)
LEFT  JOIN completion        USING (participant_id)
WHERE roster.condition = 'bot'
ORDER BY roster.session_start;


-- =====================================================================
-- Usage notes for the researcher
-- =====================================================================
-- 1. For every round of data collection, run Q1 first to confirm the
--    participant count and randomisation-balance (condition + coach_tone
--    × year × major).
-- 2. For LPA: export Q3 (or Q10) and Q7 to CSV, do text-based
--    indicators 5 & 6 in Python, z-score all 6 indicators, fit LPA
--    (mclust / tidyLPA in R) with 1–4 profiles, BIC + entropy.
-- 3. For RQ3d: merge Q10's master table with the Qualtrics T1 / T2
--    survey export (keyed on email) and the Canvas exam export;
--    run ANCOVA with profile as IV.
-- 4. Any event missing from the WAL (`participant_id IS NULL` in
--    your JOINS) means it didn't land — run Q2 + Q8 to localize
--    which phase broke and check browser console for that session.
