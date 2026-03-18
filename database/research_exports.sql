-- ================================================================
-- SoL2LBot: Research Analysis Exports
-- Chapter 4: Adaptive AI Scaffolding for SRL Skill Internalization
--
-- PURPOSE: One file, one query per analysis need.
--          Copy-paste into Supabase SQL Editor → export CSV → load in R/Python.
--
-- NOTES:
--   • External survey data (MSLQ, AGQ-R, GLAT, SEVT, BPNSFS, CDSII, exam scores)
--     must be merged with these exports by user email in R/Python.
--   • Text-analytic indicators (revision depth, feedback integration) are
--     computed in Python from EXPORT_RQ2_TEXT below.
--   • All timestamps are UTC.
--
-- QUERIES:
--   1. OVERVIEW          — participation dashboard
--   2. TIMELINE          — complete per-user event timeline
--   3. EXPORT_RQ1        — between-group comparison dataset
--   4. EXPORT_RQ2_BEHAV  — LPA behavioral indicators (Bot only)
--   5. EXPORT_RQ2_TEXT   — raw text for Python text-analytic indicators
--   6. EXPORT_RQ3_RQ4    — engagement→outcome + moderation dataset
--   7. INTEGRITY         — pre-analysis data quality checks
-- ================================================================


-- ================================================================
-- 1. OVERVIEW — Run first to check participation & balance
-- ================================================================
-- Returns one row per user with completion status across all phases,
-- event counts, and time spent. Use to verify N, condition balance,
-- and identify dropouts before analysis.
SELECT
    u.id                                                      AS user_id,
    u.email,
    u.name,
    u.profile_data->>'year'                                   AS year,        -- Freshman/Sophomore/Junior/Senior
    u.profile_data->>'major'                                  AS major,
    u.profile_data->>'challenging_course'                     AS course,
    u.profile_data->>'coach_tone'                             AS tone,        -- warm/direct
    COALESCE(s.metadata->>'condition', 'unknown')             AS condition,   -- bot/static
    s.created_at                                              AS enrolled_at,

    -- Phase completion (boolean flags)
    EXISTS(SELECT 1 FROM phase_completion_analytics p WHERE p.session_id=s.id AND p.phase='phase1' AND p.completed_successfully) AS p1,
    EXISTS(SELECT 1 FROM phase_completion_analytics p WHERE p.session_id=s.id AND p.phase='phase2' AND p.completed_successfully) AS p2,
    EXISTS(SELECT 1 FROM phase_completion_analytics p WHERE p.session_id=s.id AND p.phase='phase3' AND p.completed_successfully) AS p3,
    EXISTS(SELECT 1 FROM phase_completion_analytics p WHERE p.session_id=s.id AND p.phase='phase4' AND p.completed_successfully) AS p4,
    EXISTS(SELECT 1 FROM phase_completion_analytics p WHERE p.session_id=s.id AND p.phase='phase5' AND p.completed_successfully) AS p5,
    EXISTS(SELECT 1 FROM phase_completion_analytics p WHERE p.session_id=s.id AND p.phase='phase6' AND p.completed_successfully) AS p6,
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id=s.id AND completed_successfully) AS phases_done,

    -- Engagement counts
    (SELECT COUNT(*) FROM content_interaction_logs WHERE session_id=s.id)                                              AS total_events,
    (SELECT COUNT(*) FROM assessments WHERE session_id=s.id)                                                           AS total_assessments,
    (SELECT COUNT(*) FROM user_revision_tracking WHERE session_id=s.id)                                                AS total_revisions,
    (SELECT COUNT(*) FROM content_interaction_logs WHERE session_id=s.id AND interaction_type='floating_chat_question') AS quick_help_questions,

    -- Time (minutes)
    ROUND(COALESCE((SELECT SUM(total_time_seconds) FROM phase_completion_analytics WHERE session_id=s.id)::numeric / 60.0, 0), 1) AS total_phase_min,

    -- Last activity
    (SELECT MAX(timestamp) FROM content_interaction_logs WHERE session_id=s.id) AS last_activity

FROM users u
JOIN sessions s ON u.id = s.user_id
ORDER BY s.created_at;


-- ================================================================
-- 2. TIMELINE — Complete per-user event timeline
-- ================================================================
-- Every interaction event in chronological order per user.
-- Use for: sequence analysis, process mining, debugging missing data.
-- Export as CSV; filter by user_id in R/Python as needed.
--
-- COLUMNS:
--   user_id, email        — participant identifiers
--   condition             — bot / static
--   phase                 — phase1-phase6
--   event_type            — e.g. video_play, chat_message, quiz_question_answered, ...
--   component             — UI component that generated the event
--   event_data            — full JSON payload (varies by event_type)
--   event_time            — UTC timestamp
SELECT
    u.id                                                  AS user_id,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown')         AS condition,
    cil.phase,
    cil.interaction_type                                  AS event_type,
    cil.component,
    cil.interaction_data                                  AS event_data,
    cil.timestamp                                         AS event_time
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u   ON cil.user_id   = u.id
ORDER BY u.id, cil.timestamp;


-- ================================================================
-- 3. EXPORT_RQ1 — Between-Group Comparison (Bot vs Static)
-- ================================================================
-- RQ1a: "Do Bot students show greater improvement in skill mastery,
--        motivational beliefs, and exam performance vs Static?"
-- RQ1b: "Do Bot students maintain gains at 3-4 week follow-up?"
--
-- Analysis: ANCOVA (condition → outcomes, controlling for baseline)
--
-- COLUMNS:
--   user_id, email, condition      — identifiers + IV
--   year, major, course, tone      — demographics
--
--   p2_initial / p2_final          — Phase 2 (Task Analysis) assessment: first vs last attempt score
--   p4_initial / p4_final          — Phase 4 (Goal Setting) assessment
--   p5_initial / p5_final          — Phase 5 (Monitoring) assessment
--   p2_attempts, p4_attempts, p5_attempts — number of assessment attempts per phase
--   avg_initial_score              — mean of all first-attempt scores (baseline SRL quality)
--   avg_final_score                — mean of all final-attempt scores (post SRL quality)
--   srl_improvement                — avg_final - avg_initial (within-platform gain)
--
--   quiz_pre_accuracy              — pre-test quiz accuracy (%) across phases
--   quiz_post_accuracy             — post-test quiz accuracy (%)
--   quiz_gain                      — post - pre
--
--   phase6_aiming_grade            — self-reported target grade (A/B/C/D/F)
--   phase6_expected_grade          — self-reported expected grade
--   phase6_preparation             — self-reported preparation level
--   phase6_plan_text               — written exam preparation plan (text, for qualitative)
--
--   total_learning_min             — total time on platform (minutes)
--   phases_completed               — count of completed phases (0-6)
--   video_completion_pct           — average video completion %
--
-- NOTE: Merge with external survey data (MSLQ T0/T1/T2, AGQ-R, GLAT, SEVT,
--       Exam 1/2/3 scores, GPA) by email in R/Python for full ANCOVA model.
SELECT
    u.id                                                  AS user_id,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown')         AS condition,
    u.profile_data->>'year'                               AS year,
    u.profile_data->>'major'                              AS major,
    u.profile_data->>'challenging_course'                 AS course,
    u.profile_data->>'coach_tone'                         AS tone,

    -- Phase 2 assessment scores
    p2_first.score                                        AS p2_initial,
    p2_last.score                                         AS p2_final,
    p2_ct.cnt                                             AS p2_attempts,
    -- Phase 4 assessment scores
    p4_first.score                                        AS p4_initial,
    p4_last.score                                         AS p4_final,
    p4_ct.cnt                                             AS p4_attempts,
    -- Phase 5 assessment scores
    p5_first.score                                        AS p5_initial,
    p5_last.score                                         AS p5_final,
    p5_ct.cnt                                             AS p5_attempts,

    -- Aggregated SRL scores
    ROUND(((COALESCE(p2_first.score,0) + COALESCE(p4_first.score,0) + COALESCE(p5_first.score,0))
           / NULLIF(  (CASE WHEN p2_first.score IS NOT NULL THEN 1 ELSE 0 END)
                    + (CASE WHEN p4_first.score IS NOT NULL THEN 1 ELSE 0 END)
                    + (CASE WHEN p5_first.score IS NOT NULL THEN 1 ELSE 0 END), 0))::numeric, 3)
                                                          AS avg_initial_score,
    ROUND(((COALESCE(p2_last.score,0) + COALESCE(p4_last.score,0) + COALESCE(p5_last.score,0))
           / NULLIF(  (CASE WHEN p2_last.score IS NOT NULL THEN 1 ELSE 0 END)
                    + (CASE WHEN p4_last.score IS NOT NULL THEN 1 ELSE 0 END)
                    + (CASE WHEN p5_last.score IS NOT NULL THEN 1 ELSE 0 END), 0))::numeric, 3)
                                                          AS avg_final_score,

    -- Quiz accuracy
    pre_q.accuracy                                        AS quiz_pre_accuracy,
    post_q.accuracy                                       AS quiz_post_accuracy,
    ROUND((COALESCE(post_q.accuracy,0) - COALESCE(pre_q.accuracy,0))::numeric, 1)
                                                          AS quiz_gain,

    -- Phase 6 post-assessment
    p6_evt.aiming_grade                                   AS phase6_aiming_grade,
    p6_evt.expected_grade                                 AS phase6_expected_grade,
    p6_evt.preparation_level                              AS phase6_preparation,
    p6_txt.value                                          AS phase6_plan_text,

    -- Platform engagement summary
    ROUND(COALESCE(time_d.total_sec, 0)::numeric / 60.0, 1)
                                                          AS total_learning_min,
    COALESCE(comp.phases_done, 0)                         AS phases_completed,
    COALESCE(vid.avg_pct, 0)                              AS video_completion_pct,

    s.created_at                                          AS session_start

FROM users u
JOIN sessions s ON u.id = s.user_id

-- Phase 2 first/last scores & count
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number) AS rn FROM assessments WHERE phase='phase2') p2_first ON u.id=p2_first.user_id AND s.id=p2_first.session_id AND p2_first.rn=1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase='phase2') p2_last ON u.id=p2_last.user_id AND s.id=p2_last.session_id AND p2_last.rn=1
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS cnt FROM assessments WHERE phase='phase2' GROUP BY user_id, session_id) p2_ct ON u.id=p2_ct.user_id AND s.id=p2_ct.session_id

-- Phase 4 first/last scores & count
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number) AS rn FROM assessments WHERE phase='phase4') p4_first ON u.id=p4_first.user_id AND s.id=p4_first.session_id AND p4_first.rn=1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase='phase4') p4_last ON u.id=p4_last.user_id AND s.id=p4_last.session_id AND p4_last.rn=1
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS cnt FROM assessments WHERE phase='phase4' GROUP BY user_id, session_id) p4_ct ON u.id=p4_ct.user_id AND s.id=p4_ct.session_id

-- Phase 5 first/last scores & count
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number) AS rn FROM assessments WHERE phase='phase5') p5_first ON u.id=p5_first.user_id AND s.id=p5_first.session_id AND p5_first.rn=1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase='phase5') p5_last ON u.id=p5_last.user_id AND s.id=p5_last.session_id AND p5_last.rn=1
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS cnt FROM assessments WHERE phase='phase5' GROUP BY user_id, session_id) p5_ct ON u.id=p5_ct.user_id AND s.id=p5_ct.session_id

-- Quiz pre/post accuracy (averaged across phases)
LEFT JOIN (
    SELECT user_id, session_id, ROUND(AVG(accuracy_percentage)::numeric, 1) AS accuracy
    FROM quiz_session_summary
    WHERE completed AND COALESCE(test_type, metadata->>'test_type') = 'pre'
    GROUP BY user_id, session_id
) pre_q ON u.id=pre_q.user_id AND s.id=pre_q.session_id
LEFT JOIN (
    SELECT user_id, session_id, ROUND(AVG(accuracy_percentage)::numeric, 1) AS accuracy
    FROM quiz_session_summary
    WHERE completed AND COALESCE(test_type, metadata->>'test_type') = 'post'
    GROUP BY user_id, session_id
) post_q ON u.id=post_q.user_id AND s.id=post_q.session_id

-- Phase 6 event data (grades, preparation)
LEFT JOIN (
    SELECT user_id,
           interaction_data->>'aiming_grade'      AS aiming_grade,
           interaction_data->>'expected_grade'     AS expected_grade,
           interaction_data->>'preparation_level'  AS preparation_level
    FROM content_interaction_logs
    WHERE interaction_type = 'post_assessment_submitted'
) p6_evt ON u.id = p6_evt.user_id

-- Phase 6 written plan text (from user_data table)
LEFT JOIN (
    SELECT user_id, value,
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM user_data WHERE data_type = 'final_exam_preparation_plan'
) p6_txt ON u.id = p6_txt.user_id AND p6_txt.rn = 1

-- Total time
LEFT JOIN (
    SELECT user_id, session_id, SUM(total_time_seconds) AS total_sec
    FROM phase_completion_analytics GROUP BY user_id, session_id
) time_d ON u.id=time_d.user_id AND s.id=time_d.session_id

-- Phases completed
LEFT JOIN (
    SELECT user_id, session_id, COUNT(DISTINCT phase) AS phases_done
    FROM phase_completion_analytics WHERE completed_successfully GROUP BY user_id, session_id
) comp ON u.id=comp.user_id AND s.id=comp.session_id

-- Video completion
LEFT JOIN (
    SELECT user_id, session_id, ROUND(AVG(completion_percentage)::numeric, 1) AS avg_pct
    FROM user_video_analytics GROUP BY user_id, session_id
) vid ON u.id=vid.user_id AND s.id=vid.session_id

ORDER BY u.id;


-- ================================================================
-- 4. EXPORT_RQ2_BEHAV — LPA Behavioral Indicators (Bot only)
-- ================================================================
-- RQ2: "What distinct latent profiles of behavioral engagement emerge?"
-- Analysis: Latent Profile Analysis with 4 behavioral + 2 text-analytic indicators.
--
-- This query exports the 4 BEHAVIORAL indicators. The 2 text-analytic
-- indicators (revision depth, feedback integration) must be computed
-- in Python from EXPORT_RQ2_TEXT below.
--
-- COLUMNS:
--   user_id, email                 — identifiers (merge key for surveys)
--
--   i1_revision_freq               — Indicator 1: total revision submissions across all phases
--                                    Higher = more iterative engagement with feedback
--
--   i2_time_on_feedback_sec        — Indicator 2: average seconds between receiving AI feedback
--                                    and starting a revision (feedback_delivered → revision_started)
--                                    Higher = more time processing feedback before acting
--
--   i3_srl_quality_improvement     — Indicator 3: average (final_score - initial_score) across
--                                    all assessed phases. Range depends on rubric scale.
--                                    Higher = greater quality improvement through revisions
--
--   i4_help_seeking_count          — Indicator 4: total questions asked in Quick Help floating chatbot
--                                    Higher = more self-initiated help-seeking behavior
--
--   [context columns]
--   phases_with_revisions          — how many distinct phases had revisions
--   total_assessment_attempts      — total assessment submissions (revisions + initial)
--   avg_assessment_score           — mean score across all assessments
--
-- NOTE: After computing I5 (revision depth) and I6 (feedback integration)
--       in Python, standardize all 6 indicators (z-scores) before LPA.
SELECT
    u.id                                                  AS user_id,
    u.email,

    -- I1: Revision frequency
    COALESCE(rev.total_revisions, 0)                      AS i1_revision_freq,

    -- I2: Time-on-feedback (seconds)
    COALESCE(tof.avg_sec, 0)                              AS i2_time_on_feedback_sec,

    -- I3: SRL quality improvement
    COALESCE(srl.avg_improvement, 0)                      AS i3_srl_quality_improvement,

    -- I4: Help-seeking count
    COALESCE(help.total_questions, 0)                     AS i4_help_seeking_count,

    -- Context
    COALESCE(rev.phases_revised, 0)                       AS phases_with_revisions,
    COALESCE(assess.total_attempts, 0)                    AS total_assessment_attempts,
    ROUND(COALESCE(assess.avg_score, 0)::numeric, 3)     AS avg_assessment_score

FROM users u
JOIN sessions s ON u.id = s.user_id

-- I1
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_revisions, COUNT(DISTINCT phase) AS phases_revised
    FROM user_revision_tracking GROUP BY user_id
) rev ON u.id = rev.user_id

-- I2
LEFT JOIN (
    SELECT fd.user_id,
           ROUND(AVG(EXTRACT(EPOCH FROM (rs.ts - fd.ts)))::numeric, 1) AS avg_sec
    FROM (
        SELECT session_id, user_id, phase, component, timestamp AS ts,
               ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
        FROM content_interaction_logs WHERE interaction_type = 'feedback_delivered'
    ) fd
    JOIN (
        SELECT session_id, phase, component, timestamp AS ts,
               ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
        FROM content_interaction_logs WHERE interaction_type = 'revision_started'
    ) rs ON fd.session_id=rs.session_id AND fd.phase=rs.phase AND fd.component=rs.component AND fd.seq=rs.seq
    GROUP BY fd.user_id
) tof ON u.id = tof.user_id

-- I3
LEFT JOIN (
    SELECT a1.user_id, ROUND(AVG(al.s - a1.s)::numeric, 3) AS avg_improvement
    FROM (SELECT user_id, session_id, phase, component, overall_score AS s,
                 ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number) AS rn
          FROM assessments) a1
    JOIN (SELECT user_id, session_id, phase, component, overall_score AS s,
                 ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
          FROM assessments) al
    ON a1.user_id=al.user_id AND a1.session_id=al.session_id AND a1.phase=al.phase AND a1.component=al.component
    WHERE a1.rn=1 AND al.rn=1
    GROUP BY a1.user_id
) srl ON u.id = srl.user_id

-- I4
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_questions
    FROM content_interaction_logs WHERE interaction_type = 'floating_chat_question'
    GROUP BY user_id
) help ON u.id = help.user_id

-- Assessment context
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_attempts, AVG(overall_score) AS avg_score
    FROM assessments GROUP BY user_id
) assess ON u.id = assess.user_id

WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY u.id;


-- ================================================================
-- 5. EXPORT_RQ2_TEXT — Raw Text for Python Text-Analytic Indicators
-- ================================================================
-- Export user submissions + AI feedback text for computing:
--   I5 (revision depth): cosine distance between R1 and R2 embeddings
--   I6 (feedback integration): cosine similarity between feedback and R2-R1 delta
--
-- COLUMNS:
--   user_id, email                 — identifiers
--   phase, component               — which SRL phase/component
--   attempt_number                  — 1 = initial, 2+ = revision
--   user_response_text              — what the student wrote
--   feedback_text                   — AI feedback given after this attempt
--   overall_score                   — rubric score for this attempt
--   scaffolding_level               — feedback scaffolding level used
--   feedback_style                  — warm / direct
--   created_at                      — timestamp
--
-- PROCESSING IN PYTHON:
--   For each user×phase×component:
--     R1 = attempt 1 text, R2 = attempt 2 text, F = feedback after attempt 1
--     I5 = 1 - cosine_similarity(embed(R1), embed(R2))   [higher = more revision]
--     I6 = cosine_similarity(embed(R2 - R1), embed(F))   [higher = feedback integrated]
SELECT
    u.id                              AS user_id,
    u.email,
    a.phase,
    a.component,
    a.attempt_number,
    ui.input_value                    AS user_response_text,
    a.feedback_content                AS feedback_text,
    a.overall_score,
    a.scaffolding_level,
    a.feedback_style,
    a.created_at
FROM assessments a
JOIN users u    ON a.user_id = u.id
JOIN sessions s ON a.session_id = s.id
LEFT JOIN user_inputs ui ON a.session_id = ui.session_id
    AND a.phase      = ui.phase
    AND a.component  = ui.component
    AND ui.is_submission = true
    AND ui.attempt_number = a.attempt_number
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY u.id, a.phase, a.component, a.attempt_number;


-- ================================================================
-- 6. EXPORT_RQ3_RQ4 — Engagement→Outcome + Moderation (Bot only)
-- ================================================================
-- RQ3: "Does deep engagement predict greater gains?" (ANCOVA)
-- RQ4: "Do baseline characteristics moderate engagement→outcome?" (regression + interactions)
--
-- One row per Bot user. Contains ALL platform-derived variables needed.
-- Engagement profile membership (from RQ2 LPA) is assigned in R/Python after LPA.
--
-- COLUMNS:
--   user_id, email                 — merge key for external surveys
--   year, major, course, tone      — demographics / covariates
--
--   [Engagement indicators — same as EXPORT_RQ2_BEHAV]
--   i1_revision_freq ... i4_help_seeking_count
--
--   [Platform outcomes — DVs for ANCOVA]
--   p2_initial, p2_final, p4_initial, p4_final, p5_initial, p5_final
--   avg_initial_score, avg_final_score, srl_improvement
--   quiz_pre_accuracy, quiz_post_accuracy, quiz_gain
--
--   [Engagement context]
--   total_learning_min, phases_completed
--   total_chat_messages, total_chat_min
--   video_completion_pct, total_video_pauses, total_video_rewinds
--   quick_help_opens, quick_help_questions
--   feedback_style_switches
--
--   [Phase 6 self-report]
--   phase6_aiming_grade, phase6_expected_grade, phase6_preparation
--
-- NOTE: After LPA in R, add engagement_profile column, then run ANCOVA:
--   DV ~ engagement_profile + Exam1 + MSLQ_baseline + ...
SELECT
    u.id                                                  AS user_id,
    u.email,
    u.profile_data->>'year'                               AS year,
    u.profile_data->>'major'                              AS major,
    u.profile_data->>'challenging_course'                 AS course,
    u.profile_data->>'coach_tone'                         AS tone,

    -- === Engagement Indicators (RQ2 inputs) ===
    COALESCE(rev.total_revisions, 0)                      AS i1_revision_freq,
    COALESCE(tof.avg_sec, 0)                              AS i2_time_on_feedback_sec,
    COALESCE(srl.avg_improvement, 0)                      AS i3_srl_quality_improvement,
    COALESCE(help.total_questions, 0)                     AS i4_help_seeking_count,

    -- === Platform Outcomes ===
    -- Per-phase assessment scores
    p2_first.score AS p2_initial, p2_last.score AS p2_final, COALESCE(p2_ct.cnt,0) AS p2_attempts,
    p4_first.score AS p4_initial, p4_last.score AS p4_final, COALESCE(p4_ct.cnt,0) AS p4_attempts,
    p5_first.score AS p5_initial, p5_last.score AS p5_final, COALESCE(p5_ct.cnt,0) AS p5_attempts,

    -- Aggregated scores
    ROUND(((COALESCE(p2_first.score,0)+COALESCE(p4_first.score,0)+COALESCE(p5_first.score,0))
           / NULLIF((CASE WHEN p2_first.score IS NOT NULL THEN 1 ELSE 0 END)
                   +(CASE WHEN p4_first.score IS NOT NULL THEN 1 ELSE 0 END)
                   +(CASE WHEN p5_first.score IS NOT NULL THEN 1 ELSE 0 END),0))::numeric,3)
                                                          AS avg_initial_score,
    ROUND(((COALESCE(p2_last.score,0)+COALESCE(p4_last.score,0)+COALESCE(p5_last.score,0))
           / NULLIF((CASE WHEN p2_last.score IS NOT NULL THEN 1 ELSE 0 END)
                   +(CASE WHEN p4_last.score IS NOT NULL THEN 1 ELSE 0 END)
                   +(CASE WHEN p5_last.score IS NOT NULL THEN 1 ELSE 0 END),0))::numeric,3)
                                                          AS avg_final_score,

    -- Quiz
    pre_q.accuracy  AS quiz_pre_accuracy,
    post_q.accuracy AS quiz_post_accuracy,
    ROUND((COALESCE(post_q.accuracy,0)-COALESCE(pre_q.accuracy,0))::numeric,1) AS quiz_gain,

    -- === Engagement Context ===
    ROUND(COALESCE(time_d.total_sec,0)::numeric/60.0,1)  AS total_learning_min,
    COALESCE(comp.phases_done, 0)                         AS phases_completed,
    COALESCE(chat.total_msgs, 0)                          AS total_chat_messages,
    ROUND(COALESCE(chat.total_sec,0)::numeric/60.0,1)    AS total_chat_min,
    COALESCE(vid.avg_pct, 0)                              AS video_completion_pct,
    COALESCE(vid.pauses, 0)                               AS total_video_pauses,
    COALESCE(vid.rewinds, 0)                              AS total_video_rewinds,
    COALESCE(qh.opens, 0)                                 AS quick_help_opens,
    COALESCE(qh.questions, 0)                             AS quick_help_questions,
    COALESCE(fsv_d.switches, 0)                           AS feedback_style_switches,

    -- Leave/return
    COALESCE(leave_d.leaves, 0)                           AS total_leaves,
    ROUND(COALESCE(leave_d.away_sec,0)::numeric/60.0,1)  AS total_away_min,

    -- Phase 6
    p6_evt.aiming_grade                                   AS phase6_aiming_grade,
    p6_evt.expected_grade                                 AS phase6_expected_grade,
    p6_evt.preparation_level                              AS phase6_preparation,

    s.created_at                                          AS session_start

FROM users u
JOIN sessions s ON u.id = s.user_id

-- Engagement indicators (same subqueries as EXPORT_RQ2_BEHAV)
LEFT JOIN (SELECT user_id, COUNT(*) AS total_revisions FROM user_revision_tracking GROUP BY user_id) rev ON u.id=rev.user_id
LEFT JOIN (
    SELECT fd.user_id, ROUND(AVG(EXTRACT(EPOCH FROM (rs.ts-fd.ts)))::numeric,1) AS avg_sec
    FROM (SELECT session_id, user_id, phase, component, timestamp AS ts, ROW_NUMBER() OVER (PARTITION BY session_id,phase,component ORDER BY timestamp) AS seq FROM content_interaction_logs WHERE interaction_type='feedback_delivered') fd
    JOIN (SELECT session_id, phase, component, timestamp AS ts, ROW_NUMBER() OVER (PARTITION BY session_id,phase,component ORDER BY timestamp) AS seq FROM content_interaction_logs WHERE interaction_type='revision_started') rs
    ON fd.session_id=rs.session_id AND fd.phase=rs.phase AND fd.component=rs.component AND fd.seq=rs.seq
    GROUP BY fd.user_id
) tof ON u.id=tof.user_id
LEFT JOIN (
    SELECT a1.user_id, ROUND(AVG(al.s-a1.s)::numeric,3) AS avg_improvement
    FROM (SELECT user_id, session_id, phase, component, overall_score AS s, ROW_NUMBER() OVER (PARTITION BY user_id,session_id,phase,component ORDER BY attempt_number) AS rn FROM assessments) a1
    JOIN (SELECT user_id, session_id, phase, component, overall_score AS s, ROW_NUMBER() OVER (PARTITION BY user_id,session_id,phase,component ORDER BY attempt_number DESC) AS rn FROM assessments) al
    ON a1.user_id=al.user_id AND a1.session_id=al.session_id AND a1.phase=al.phase AND a1.component=al.component
    WHERE a1.rn=1 AND al.rn=1 GROUP BY a1.user_id
) srl ON u.id=srl.user_id
LEFT JOIN (SELECT user_id, COUNT(*) AS total_questions FROM content_interaction_logs WHERE interaction_type='floating_chat_question' GROUP BY user_id) help ON u.id=help.user_id

-- Assessment scores (same as EXPORT_RQ1)
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id,session_id ORDER BY attempt_number) AS rn FROM assessments WHERE phase='phase2') p2_first ON u.id=p2_first.user_id AND s.id=p2_first.session_id AND p2_first.rn=1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id,session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase='phase2') p2_last ON u.id=p2_last.user_id AND s.id=p2_last.session_id AND p2_last.rn=1
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS cnt FROM assessments WHERE phase='phase2' GROUP BY user_id, session_id) p2_ct ON u.id=p2_ct.user_id AND s.id=p2_ct.session_id
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id,session_id ORDER BY attempt_number) AS rn FROM assessments WHERE phase='phase4') p4_first ON u.id=p4_first.user_id AND s.id=p4_first.session_id AND p4_first.rn=1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id,session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase='phase4') p4_last ON u.id=p4_last.user_id AND s.id=p4_last.session_id AND p4_last.rn=1
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS cnt FROM assessments WHERE phase='phase4' GROUP BY user_id, session_id) p4_ct ON u.id=p4_ct.user_id AND s.id=p4_ct.session_id
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id,session_id ORDER BY attempt_number) AS rn FROM assessments WHERE phase='phase5') p5_first ON u.id=p5_first.user_id AND s.id=p5_first.session_id AND p5_first.rn=1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id,session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase='phase5') p5_last ON u.id=p5_last.user_id AND s.id=p5_last.session_id AND p5_last.rn=1
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS cnt FROM assessments WHERE phase='phase5' GROUP BY user_id, session_id) p5_ct ON u.id=p5_ct.user_id AND s.id=p5_ct.session_id

-- Quiz
LEFT JOIN (SELECT user_id, session_id, ROUND(AVG(accuracy_percentage)::numeric,1) AS accuracy FROM quiz_session_summary WHERE completed AND COALESCE(test_type,metadata->>'test_type')='pre' GROUP BY user_id, session_id) pre_q ON u.id=pre_q.user_id AND s.id=pre_q.session_id
LEFT JOIN (SELECT user_id, session_id, ROUND(AVG(accuracy_percentage)::numeric,1) AS accuracy FROM quiz_session_summary WHERE completed AND COALESCE(test_type,metadata->>'test_type')='post' GROUP BY user_id, session_id) post_q ON u.id=post_q.user_id AND s.id=post_q.session_id

-- Context metrics
LEFT JOIN (SELECT user_id, session_id, SUM(total_time_seconds) AS total_sec FROM phase_completion_analytics GROUP BY user_id, session_id) time_d ON u.id=time_d.user_id AND s.id=time_d.session_id
LEFT JOIN (SELECT user_id, session_id, COUNT(DISTINCT phase) AS phases_done FROM phase_completion_analytics WHERE completed_successfully GROUP BY user_id, session_id) comp ON u.id=comp.user_id AND s.id=comp.session_id
LEFT JOIN (SELECT user_id, session_id, SUM(message_count) AS total_msgs, SUM(total_duration_seconds) AS total_sec FROM user_chat_analytics WHERE component!='floating_chatbot' GROUP BY user_id, session_id) chat ON u.id=chat.user_id AND s.id=chat.session_id
LEFT JOIN (SELECT user_id, session_id, ROUND(AVG(completion_percentage)::numeric,1) AS avg_pct, SUM(pause_count) AS pauses, SUM(rewind_count) AS rewinds FROM user_video_analytics GROUP BY user_id, session_id) vid ON u.id=vid.user_id AND s.id=vid.session_id
LEFT JOIN (SELECT user_id, session_id, COUNT(CASE WHEN interaction_type='floating_chatbot_opened' THEN 1 END) AS opens, COUNT(CASE WHEN interaction_type='floating_chat_question' THEN 1 END) AS questions FROM content_interaction_logs WHERE interaction_type IN ('floating_chatbot_opened','floating_chat_question') GROUP BY user_id, session_id) qh ON u.id=qh.user_id AND s.id=qh.session_id
LEFT JOIN (SELECT user_id, session_id, COUNT(*) AS switches FROM feedback_style_views GROUP BY user_id, session_id) fsv_d ON u.id=fsv_d.user_id AND s.id=fsv_d.session_id
LEFT JOIN (SELECT user_id, session_id, COUNT(CASE WHEN interaction_type='user_left_page' THEN 1 END) AS leaves, SUM(CASE WHEN interaction_type='user_returned_to_page' THEN (interaction_data->>'away_duration_seconds')::numeric ELSE 0 END) AS away_sec FROM content_interaction_logs GROUP BY user_id, session_id) leave_d ON u.id=leave_d.user_id AND s.id=leave_d.session_id

-- Phase 6
LEFT JOIN (SELECT user_id, interaction_data->>'aiming_grade' AS aiming_grade, interaction_data->>'expected_grade' AS expected_grade, interaction_data->>'preparation_level' AS preparation_level FROM content_interaction_logs WHERE interaction_type='post_assessment_submitted') p6_evt ON u.id=p6_evt.user_id

WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY u.id;


-- ================================================================
-- 7. INTEGRITY — Pre-analysis data quality checks
-- ================================================================
-- Run this BEFORE exporting analysis datasets to catch issues.
-- Returns one row per user with flags for missing/suspect data.
SELECT
    u.id AS user_id,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,

    -- Completeness flags
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id=s.id AND completed_successfully) AS phases_done,
    (SELECT COUNT(*) FROM assessments WHERE session_id=s.id) AS n_assessments,
    (SELECT COUNT(*) FROM user_video_analytics WHERE session_id=s.id) AS n_videos,
    (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id=s.id AND completed) AS n_quizzes,
    (SELECT COUNT(*) FROM content_interaction_logs WHERE session_id=s.id) AS n_events,

    -- Warning flags
    CASE WHEN (SELECT COUNT(*) FROM assessments WHERE session_id=s.id) = 0 THEN 'MISSING' ELSE 'ok' END AS assess_check,
    CASE WHEN (SELECT COUNT(*) FROM user_video_analytics WHERE session_id=s.id) = 0 THEN 'MISSING' ELSE 'ok' END AS video_check,
    CASE WHEN (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id=s.id AND completed) = 0 THEN 'MISSING' ELSE 'ok' END AS quiz_check,
    CASE WHEN (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id=s.id AND completed_successfully) < 6 THEN 'INCOMPLETE' ELSE 'ok' END AS completion_check,

    -- Duplicate session check
    (SELECT COUNT(*) FROM sessions WHERE user_id=u.id) AS session_count,

    -- Timing
    s.created_at AS enrolled,
    (SELECT MAX(timestamp) FROM content_interaction_logs WHERE session_id=s.id) AS last_event

FROM users u
JOIN sessions s ON u.id = s.user_id
ORDER BY
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id=s.id AND completed_successfully),
    u.email;
