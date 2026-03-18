-- ================================================================
-- SoL2LBot: Complete Supabase Query Reference
-- Chapter 4: Adaptive AI Scaffolding for SRL Skill Internalization
--
-- HOW TO USE:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Copy-paste the section you need
--   3. Modify date ranges / filters as needed
--
-- SECTIONS:
--   A. DATA RESET (clear test data, keep schema)
--   B. GENERAL OVERVIEW (participation, completion, health checks)
--   C. RQ1 — Between-Group Comparison (Bot vs Static)
--   D. RQ2 — Engagement Profiles (LPA Input Data)
--   E. RQ3 & RQ4 — Engagement-Outcome & Moderation
--   F. FULL DATA EXPORTS (for R / Python analysis)
--   G. DATA INTEGRITY CHECKS (run before analysis)
-- ================================================================


-- ████████████████████████████████████████████████████████████████
-- SECTION A: DATA RESET
-- Clear all test/pilot data while keeping the schema intact.
-- Run this BEFORE your actual experiment begins.
-- ████████████████████████████████████████████████████████████████

-- A1: CLEAR ALL DATA (keep tables, drop all rows)
-- WARNING: This deletes ALL data. Back up first if needed!
-- Order matters due to foreign key constraints.
TRUNCATE TABLE feedback_style_views CASCADE;
TRUNCATE TABLE phase_completion_analytics CASCADE;
TRUNCATE TABLE quiz_session_summary CASCADE;
TRUNCATE TABLE knowledge_check_attempts CASCADE;
TRUNCATE TABLE user_chat_analytics CASCADE;
TRUNCATE TABLE llm_interactions CASCADE;
TRUNCATE TABLE video_interaction_events CASCADE;
TRUNCATE TABLE user_video_analytics CASCADE;
TRUNCATE TABLE click_events CASCADE;
TRUNCATE TABLE chat_conversations CASCADE;
TRUNCATE TABLE user_inputs CASCADE;
TRUNCATE TABLE navigation_events CASCADE;
TRUNCATE TABLE content_interaction_logs CASCADE;
TRUNCATE TABLE user_revision_tracking CASCADE;
TRUNCATE TABLE assessments CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE user_data CASCADE;
TRUNCATE TABLE sessions CASCADE;
TRUNCATE TABLE users CASCADE;

-- Verify all tables are empty
SELECT 'users' AS tbl, COUNT(*) AS rows FROM users
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL SELECT 'content_interaction_logs', COUNT(*) FROM content_interaction_logs
UNION ALL SELECT 'user_inputs', COUNT(*) FROM user_inputs
UNION ALL SELECT 'user_video_analytics', COUNT(*) FROM user_video_analytics
UNION ALL SELECT 'quiz_session_summary', COUNT(*) FROM quiz_session_summary
UNION ALL SELECT 'user_chat_analytics', COUNT(*) FROM user_chat_analytics
UNION ALL SELECT 'phase_completion_analytics', COUNT(*) FROM phase_completion_analytics
UNION ALL SELECT 'user_revision_tracking', COUNT(*) FROM user_revision_tracking
UNION ALL SELECT 'llm_interactions', COUNT(*) FROM llm_interactions
ORDER BY tbl;


-- A2: SELECTIVE CLEAR — Delete only test data (keep real experiment data)
-- Use this if you mixed test accounts with real participants
-- Adjust the email patterns to match your test accounts
DELETE FROM feedback_style_views WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM phase_completion_analytics WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM quiz_session_summary WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM knowledge_check_attempts WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM user_chat_analytics WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM llm_interactions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM video_interaction_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM user_video_analytics WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM click_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM chat_conversations WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM user_inputs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM navigation_events WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM content_interaction_logs WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM user_revision_tracking WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM assessments WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%'));
DELETE FROM user_data WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%');
DELETE FROM users WHERE email LIKE '%test%' OR email LIKE '%example.com%';


-- ████████████████████████████████████████████████████████████████
-- SECTION B: GENERAL OVERVIEW
-- Run these first to understand participation and system health
-- ████████████████████████████████████████████████████████████████

-- B1: Participation summary (high-level dashboard)
SELECT
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT s.id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN s.metadata->>'condition' = 'bot' THEN u.id END) AS bot_users,
    COUNT(DISTINCT CASE WHEN s.metadata->>'condition' = 'static' THEN u.id END) AS static_users,
    COUNT(DISTINCT CASE WHEN s.metadata->>'condition' IS NULL OR s.metadata->>'condition' = '' THEN u.id END) AS no_condition_users,
    MIN(s.created_at)::date AS first_session,
    MAX(s.created_at)::date AS latest_session
FROM users u
JOIN sessions s ON u.id = s.user_id;


-- B2: Per-user progress overview (who completed what)
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    s.id AS session_id,
    COALESCE(s.metadata->>'condition', 'none') AS condition,
    s.created_at::date AS start_date,
    -- Phase completion flags
    EXISTS(SELECT 1 FROM phase_completion_analytics pca WHERE pca.session_id = s.id AND pca.phase = 'phase1' AND pca.completed_successfully) AS p1_done,
    EXISTS(SELECT 1 FROM phase_completion_analytics pca WHERE pca.session_id = s.id AND pca.phase = 'phase2' AND pca.completed_successfully) AS p2_done,
    EXISTS(SELECT 1 FROM phase_completion_analytics pca WHERE pca.session_id = s.id AND pca.phase = 'phase3' AND pca.completed_successfully) AS p3_done,
    EXISTS(SELECT 1 FROM phase_completion_analytics pca WHERE pca.session_id = s.id AND pca.phase = 'phase4' AND pca.completed_successfully) AS p4_done,
    EXISTS(SELECT 1 FROM phase_completion_analytics pca WHERE pca.session_id = s.id AND pca.phase = 'phase5' AND pca.completed_successfully) AS p5_done,
    EXISTS(SELECT 1 FROM phase_completion_analytics pca WHERE pca.session_id = s.id AND pca.phase = 'phase6' AND pca.completed_successfully) AS p6_done,
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id = s.id AND completed_successfully) AS phases_completed,
    -- Has assessment data?
    (SELECT COUNT(*) FROM assessments WHERE session_id = s.id) AS assessment_count,
    -- Has video data?
    (SELECT COUNT(*) FROM user_video_analytics WHERE session_id = s.id) AS video_records,
    -- Has quiz data?
    (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id = s.id AND completed = true) AS quiz_records,
    -- Total events logged
    (SELECT COUNT(*) FROM content_interaction_logs WHERE session_id = s.id) AS total_events,
    -- Last activity
    (SELECT MAX(timestamp) FROM content_interaction_logs WHERE session_id = s.id) AS last_activity
FROM users u
JOIN sessions s ON u.id = s.user_id
ORDER BY s.created_at DESC;


-- B3: Phase completion funnel
SELECT
    'Phase 1' AS phase,
    COUNT(DISTINCT CASE WHEN pca.phase = 'phase1' THEN pca.session_id END) AS started,
    COUNT(DISTINCT CASE WHEN pca.phase = 'phase1' AND pca.completed_successfully THEN pca.session_id END) AS completed
FROM phase_completion_analytics pca
UNION ALL
SELECT 'Phase 2',
    COUNT(DISTINCT CASE WHEN phase = 'phase2' THEN session_id END),
    COUNT(DISTINCT CASE WHEN phase = 'phase2' AND completed_successfully THEN session_id END)
FROM phase_completion_analytics
UNION ALL
SELECT 'Phase 3',
    COUNT(DISTINCT CASE WHEN phase = 'phase3' THEN session_id END),
    COUNT(DISTINCT CASE WHEN phase = 'phase3' AND completed_successfully THEN session_id END)
FROM phase_completion_analytics
UNION ALL
SELECT 'Phase 4',
    COUNT(DISTINCT CASE WHEN phase = 'phase4' THEN session_id END),
    COUNT(DISTINCT CASE WHEN phase = 'phase4' AND completed_successfully THEN session_id END)
FROM phase_completion_analytics
UNION ALL
SELECT 'Phase 5',
    COUNT(DISTINCT CASE WHEN phase = 'phase5' THEN session_id END),
    COUNT(DISTINCT CASE WHEN phase = 'phase5' AND completed_successfully THEN session_id END)
FROM phase_completion_analytics
UNION ALL
SELECT 'Phase 6',
    COUNT(DISTINCT CASE WHEN phase = 'phase6' THEN session_id END),
    COUNT(DISTINCT CASE WHEN phase = 'phase6' AND completed_successfully THEN session_id END)
FROM phase_completion_analytics;


-- B4: Time per phase (minutes)
SELECT
    phase,
    COUNT(DISTINCT session_id) AS n,
    ROUND(AVG(total_time_seconds)::numeric / 60.0, 1) AS avg_min,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_time_seconds)::numeric / 60.0, 1) AS median_min,
    ROUND(MIN(total_time_seconds)::numeric / 60.0, 1) AS min_min,
    ROUND(MAX(total_time_seconds)::numeric / 60.0, 1) AS max_min
FROM phase_completion_analytics
WHERE completed_successfully = true
GROUP BY phase
ORDER BY phase;


-- B5: Daily participation trend
SELECT
    DATE(cil.timestamp) AS day,
    COUNT(DISTINCT cil.user_id) AS active_users,
    COUNT(DISTINCT cil.session_id) AS active_sessions,
    COUNT(*) AS total_events
FROM content_interaction_logs cil
GROUP BY DATE(cil.timestamp)
ORDER BY day DESC;


-- B6: Row counts across all tables (system health check)
SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL SELECT 'messages', COUNT(*) FROM messages
UNION ALL SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL SELECT 'content_interaction_logs', COUNT(*) FROM content_interaction_logs
UNION ALL SELECT 'navigation_events', COUNT(*) FROM navigation_events
UNION ALL SELECT 'user_inputs', COUNT(*) FROM user_inputs
UNION ALL SELECT 'chat_conversations', COUNT(*) FROM chat_conversations
UNION ALL SELECT 'click_events', COUNT(*) FROM click_events
UNION ALL SELECT 'user_video_analytics', COUNT(*) FROM user_video_analytics
UNION ALL SELECT 'video_interaction_events', COUNT(*) FROM video_interaction_events
UNION ALL SELECT 'knowledge_check_attempts', COUNT(*) FROM knowledge_check_attempts
UNION ALL SELECT 'quiz_session_summary', COUNT(*) FROM quiz_session_summary
UNION ALL SELECT 'phase_completion_analytics', COUNT(*) FROM phase_completion_analytics
UNION ALL SELECT 'user_chat_analytics', COUNT(*) FROM user_chat_analytics
UNION ALL SELECT 'user_revision_tracking', COUNT(*) FROM user_revision_tracking
UNION ALL SELECT 'llm_interactions', COUNT(*) FROM llm_interactions
UNION ALL SELECT 'feedback_style_views', COUNT(*) FROM feedback_style_views
UNION ALL SELECT 'user_data', COUNT(*) FROM user_data
ORDER BY rows DESC;


-- B7: Event type distribution (verify all expected events are being logged)
SELECT
    interaction_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT session_id) AS unique_sessions,
    COUNT(DISTINCT user_id) AS unique_users
FROM content_interaction_logs
GROUP BY interaction_type
ORDER BY event_count DESC;


-- B8: Chatbot interaction overview per phase per user
-- Shows message counts, duration, assessment scores for each chatbot phase (2, 4, 5)
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    uca.phase,
    uca.component,
    uca.chat_start_time,
    uca.chat_end_time,
    uca.total_duration_seconds,
    uca.message_count,
    uca.user_message_count,
    uca.bot_message_count,
    -- Assessment results for this chatbot phase
    (SELECT COUNT(*) FROM assessments a WHERE a.session_id = s.id AND a.phase = uca.phase) AS assessment_attempts,
    (SELECT MAX(a.overall_score) FROM assessments a WHERE a.session_id = s.id AND a.phase = uca.phase) AS best_score,
    (SELECT a.overall_score FROM assessments a WHERE a.session_id = s.id AND a.phase = uca.phase ORDER BY a.attempt_number DESC LIMIT 1) AS final_score,
    -- Revision count for this phase
    (SELECT COUNT(*) FROM user_revision_tracking urt WHERE urt.session_id = s.id AND urt.phase = uca.phase) AS revision_count
FROM user_chat_analytics uca
JOIN sessions s ON uca.session_id = s.id
JOIN users u ON uca.user_id = u.id
WHERE uca.phase IN ('phase2', 'phase4', 'phase5')
ORDER BY u.id, uca.phase;


-- B9: Chatbot interaction summary (aggregated across all users)
SELECT
    uca.phase,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    COUNT(DISTINCT uca.user_id) AS n_users,
    ROUND(AVG(uca.total_duration_seconds)::numeric / 60.0, 1) AS avg_duration_min,
    ROUND(AVG(uca.message_count)::numeric, 1) AS avg_messages,
    ROUND(AVG(uca.user_message_count)::numeric, 1) AS avg_user_msgs,
    ROUND(AVG(uca.bot_message_count)::numeric, 1) AS avg_bot_msgs,
    -- Assessment stats
    ROUND(AVG(best.score)::numeric, 3) AS avg_best_score,
    ROUND(AVG(rev.cnt)::numeric, 1) AS avg_revisions
FROM user_chat_analytics uca
JOIN sessions s ON uca.session_id = s.id
LEFT JOIN (
    SELECT session_id, phase, MAX(overall_score) AS score
    FROM assessments GROUP BY session_id, phase
) best ON best.session_id = s.id AND best.phase = uca.phase
LEFT JOIN (
    SELECT session_id, phase, COUNT(*) AS cnt
    FROM user_revision_tracking GROUP BY session_id, phase
) rev ON rev.session_id = s.id AND rev.phase = uca.phase
WHERE uca.phase IN ('phase2', 'phase4', 'phase5')
GROUP BY uca.phase, COALESCE(s.metadata->>'condition', 'unknown')
ORDER BY uca.phase;


-- B10: Final feedback ratings overview (from summary page)
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    (cil.interaction_data->'ratings'->>'usefulness')::int AS usefulness,
    (cil.interaction_data->'ratings'->>'satisfaction')::int AS satisfaction,
    (cil.interaction_data->'ratings'->>'recommendation')::int AS recommendation,
    cil.interaction_data->>'feedback_text' AS feedback_text,
    cil.timestamp
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u ON cil.user_id = u.id
WHERE cil.interaction_type = 'final_feedback'
ORDER BY cil.timestamp DESC;


-- B11: User data table overview (progress tracking, phase completions)
SELECT
    u.id AS user_id,
    u.name,
    ud.data_type,
    ud.value,
    ud.metadata,
    ud.created_at
FROM user_data ud
JOIN users u ON ud.user_id = u.id
ORDER BY u.id, ud.created_at;


-- B12: User pace — time to complete each phase + leave/return patterns
-- How long each user took, how many times they left, total away time
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    cil.phase,
    -- Total events in this phase
    COUNT(*) AS total_events,
    -- First and last event timestamps → total elapsed time
    MIN(cil.timestamp) AS phase_start,
    MAX(cil.timestamp) AS phase_end,
    ROUND(EXTRACT(EPOCH FROM (MAX(cil.timestamp) - MIN(cil.timestamp)))::numeric / 60.0, 1) AS elapsed_minutes,
    -- Leave/return tracking
    COUNT(CASE WHEN cil.interaction_type = 'user_left_page' THEN 1 END) AS leave_count,
    COUNT(CASE WHEN cil.interaction_type = 'user_returned_to_page' THEN 1 END) AS return_count,
    -- Total away time (sum of away_duration_seconds from return events)
    ROUND(COALESCE(SUM(
        CASE WHEN cil.interaction_type = 'user_returned_to_page'
        THEN (cil.interaction_data->>'away_duration_seconds')::numeric END
    ), 0) / 60.0, 1) AS total_away_minutes,
    -- Active time = elapsed - away
    ROUND((EXTRACT(EPOCH FROM (MAX(cil.timestamp) - MIN(cil.timestamp)))::numeric -
        COALESCE(SUM(CASE WHEN cil.interaction_type = 'user_returned_to_page'
            THEN (cil.interaction_data->>'away_duration_seconds')::numeric END), 0)
    ) / 60.0, 1) AS active_minutes
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u ON cil.user_id = u.id
WHERE cil.phase IS NOT NULL
GROUP BY u.id, u.name, COALESCE(s.metadata->>'condition', 'unknown'), cil.phase, s.id
ORDER BY u.id, cil.phase;


-- B13: Video interaction trace — every play/pause/seek/rewind per video
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    vie.phase,
    vie.video_name,
    vie.event_type,
    vie.playback_position,
    vie.total_watched_seconds,
    vie.event_timestamp,
    vie.metadata
FROM video_interaction_events vie
JOIN sessions s ON vie.session_id = s.id
JOIN users u ON vie.user_id = u.id
ORDER BY u.id, vie.phase, vie.event_timestamp;


-- B14: Video analytics summary per user per video
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    uva.phase,
    uva.video_name,
    uva.total_duration_seconds AS video_length_sec,
    uva.watched_duration_seconds,
    uva.completion_percentage,
    uva.play_count,
    uva.pause_count,
    uva.rewind_count,
    uva.fast_forward_count,
    uva.seek_count,
    uva.last_position,
    uva.first_play_at,
    uva.completed_at,
    uva.last_interaction_at,
    uva.engagement_score
FROM user_video_analytics uva
JOIN sessions s ON uva.session_id = s.id
JOIN users u ON uva.user_id = u.id
ORDER BY u.id, uva.phase;


-- B15: Quick Help (floating chatbot) — every question & response with full text
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    cil.phase,
    cil.interaction_type,
    -- Question details
    cil.interaction_data->>'question' AS question_text,
    -- Response details
    cil.interaction_data->>'response' AS response_text,
    cil.interaction_data->>'model' AS model_used,
    -- Context
    cil.interaction_data->>'page' AS page_url,
    cil.interaction_data->>'trigger' AS open_trigger,
    -- Session timing
    (cil.interaction_data->>'duration_seconds')::numeric AS session_duration_sec,
    (cil.interaction_data->>'message_count')::int AS message_count_at_event,
    cil.timestamp
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u ON cil.user_id = u.id
WHERE cil.interaction_type IN (
    'floating_chatbot_opened', 'floating_chatbot_closed',
    'floating_chat_question', 'floating_chat_response'
)
ORDER BY u.id, cil.timestamp;


-- B16: Quick Help vs Main Chatbot concurrent usage
-- Detect if user had Quick Help open while on a chatbot phase page
SELECT
    u.id AS user_id,
    u.name,
    cil.phase,
    cil.interaction_type,
    cil.interaction_data->>'page' AS page,
    cil.timestamp,
    -- Flag: is this a Quick Help event on a chatbot phase page?
    CASE WHEN cil.interaction_type IN ('floating_chat_question', 'floating_chat_response')
         AND cil.phase IN ('phase2', 'phase4', 'phase5')
    THEN true ELSE false END AS quick_help_during_chatbot_phase
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u ON cil.user_id = u.id
WHERE cil.interaction_type IN (
    'floating_chatbot_opened', 'floating_chatbot_closed',
    'floating_chat_question', 'floating_chat_response',
    'chat_message'
)
  AND cil.phase IN ('phase2', 'phase4', 'phase5')
ORDER BY u.id, cil.timestamp;


-- B17: Quiz accuracy — per question detail
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    kca.phase,
    kca.question_id,
    kca.question_text,
    kca.question_type,
    kca.attempt_number,
    kca.selected_answer,
    kca.correct_answer,
    kca.is_correct,
    kca.time_to_answer_seconds,
    kca.time_to_first_interaction_seconds,
    kca.confidence_level,
    kca.help_used,
    kca.answer_changed,
    kca.answer_changes,
    kca.thinking_time_seconds,
    kca.explanation_viewed,
    kca.retry_count,
    kca.created_at
FROM knowledge_check_attempts kca
JOIN sessions s ON kca.session_id = s.id
JOIN users u ON kca.user_id = u.id
ORDER BY u.id, kca.phase, kca.created_at;


-- B18: Quiz session summary — pre/post test per user
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    qss.phase,
    COALESCE(qss.test_type, qss.metadata->>'test_type', 'unknown') AS test_type,
    qss.total_questions,
    qss.correct_answers,
    qss.incorrect_answers,
    qss.accuracy_percentage,
    qss.average_time_per_question_seconds,
    qss.total_time_seconds,
    qss.first_attempt_accuracy,
    qss.completed,
    qss.quiz_start_time,
    qss.quiz_end_time
FROM quiz_session_summary qss
JOIN sessions s ON qss.session_id = s.id
JOIN users u ON qss.user_id = u.id
ORDER BY u.id, qss.phase;


-- B19: Navigation trace — every page view, Next button click, phase transition
SELECT
    u.id AS user_id,
    u.name,
    ne.event_type,
    ne.from_path,
    ne.to_path,
    ne.from_phase,
    ne.to_phase,
    ne.button_text,
    ne.time_on_page_seconds,
    ne.timestamp
FROM navigation_events ne
JOIN sessions s ON ne.session_id = s.id
JOIN users u ON ne.user_id = u.id
ORDER BY u.id, ne.timestamp;


-- B20: Feedback style switching behavior (did users view alternative style?)
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    fsv.phase,
    fsv.component,
    fsv.original_style,
    fsv.alternative_style,
    fsv.viewed_at
FROM feedback_style_views fsv
JOIN sessions s ON fsv.session_id = s.id
JOIN users u ON fsv.user_id = u.id
ORDER BY u.id, fsv.viewed_at;


-- B21: Complete engagement dashboard — one row per user with ALL metrics
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    u.profile_data->>'year' AS year_level,
    u.profile_data->>'major' AS major,
    u.profile_data->>'challenging_course' AS course,
    u.profile_data->>'coach_tone' AS tone,
    -- Completion
    COALESCE(comp.phases_done, 0) AS phases_completed,
    -- Total time
    COALESCE(time_d.total_min, 0) AS total_learning_min,
    COALESCE(time_d.active_min, 0) AS active_learning_min,
    -- Leave/return
    COALESCE(leave_d.total_leaves, 0) AS total_leaves,
    COALESCE(leave_d.total_away_min, 0) AS total_away_min,
    -- Video engagement
    COALESCE(vid.videos_watched, 0) AS videos_watched,
    COALESCE(vid.avg_completion, 0) AS avg_video_completion_pct,
    COALESCE(vid.total_pauses, 0) AS total_video_pauses,
    COALESCE(vid.total_rewinds, 0) AS total_video_rewinds,
    -- Chat engagement
    COALESCE(chat.total_chat_messages, 0) AS total_chat_messages,
    COALESCE(chat.total_chat_min, 0) AS total_chat_min,
    -- Quick Help
    COALESCE(qh.quick_help_opens, 0) AS quick_help_opens,
    COALESCE(qh.quick_help_questions, 0) AS quick_help_questions,
    -- Quiz
    COALESCE(quiz_d.avg_accuracy, 0) AS avg_quiz_accuracy,
    COALESCE(quiz_d.total_questions_answered, 0) AS total_quiz_questions,
    -- Assessment / Revision
    COALESCE(assess.total_assessments, 0) AS total_assessments,
    COALESCE(assess.avg_score, 0) AS avg_assessment_score,
    COALESCE(rev_d.total_revisions, 0) AS total_revisions,
    -- Feedback style
    COALESCE(fsv_d.style_switches, 0) AS feedback_style_switches,
    -- Session info
    s.created_at AS session_start,
    (SELECT MAX(timestamp) FROM content_interaction_logs WHERE session_id = s.id) AS last_activity
FROM users u
JOIN sessions s ON u.id = s.user_id
-- Completion
LEFT JOIN (
    SELECT user_id, session_id, COUNT(DISTINCT phase) AS phases_done
    FROM phase_completion_analytics WHERE completed_successfully GROUP BY user_id, session_id
) comp ON u.id = comp.user_id AND s.id = comp.session_id
-- Time
LEFT JOIN (
    SELECT cil2.user_id, cil2.session_id,
        ROUND(EXTRACT(EPOCH FROM (MAX(cil2.timestamp) - MIN(cil2.timestamp)))::numeric / 60.0, 1) AS total_min,
        ROUND((EXTRACT(EPOCH FROM (MAX(cil2.timestamp) - MIN(cil2.timestamp)))::numeric -
            COALESCE(SUM(CASE WHEN cil2.interaction_type = 'user_returned_to_page'
                THEN (cil2.interaction_data->>'away_duration_seconds')::numeric END), 0)
        ) / 60.0, 1) AS active_min
    FROM content_interaction_logs cil2 GROUP BY cil2.user_id, cil2.session_id
) time_d ON u.id = time_d.user_id AND s.id = time_d.session_id
-- Leave/return
LEFT JOIN (
    SELECT user_id, session_id,
        COUNT(CASE WHEN interaction_type = 'user_left_page' THEN 1 END) AS total_leaves,
        ROUND(COALESCE(SUM(CASE WHEN interaction_type = 'user_returned_to_page'
            THEN (interaction_data->>'away_duration_seconds')::numeric END), 0) / 60.0, 1) AS total_away_min
    FROM content_interaction_logs GROUP BY user_id, session_id
) leave_d ON u.id = leave_d.user_id AND s.id = leave_d.session_id
-- Video
LEFT JOIN (
    SELECT user_id, session_id,
        COUNT(*) AS videos_watched,
        ROUND(AVG(completion_percentage)::numeric, 1) AS avg_completion,
        SUM(pause_count) AS total_pauses,
        SUM(rewind_count) AS total_rewinds
    FROM user_video_analytics GROUP BY user_id, session_id
) vid ON u.id = vid.user_id AND s.id = vid.session_id
-- Chat
LEFT JOIN (
    SELECT user_id, session_id,
        SUM(message_count) AS total_chat_messages,
        ROUND(SUM(total_duration_seconds)::numeric / 60.0, 1) AS total_chat_min
    FROM user_chat_analytics
    WHERE component != 'floating_chatbot'
    GROUP BY user_id, session_id
) chat ON u.id = chat.user_id AND s.id = chat.session_id
-- Quick Help
LEFT JOIN (
    SELECT user_id, session_id,
        COUNT(CASE WHEN interaction_type = 'floating_chatbot_opened' THEN 1 END) AS quick_help_opens,
        COUNT(CASE WHEN interaction_type = 'floating_chat_question' THEN 1 END) AS quick_help_questions
    FROM content_interaction_logs
    WHERE interaction_type IN ('floating_chatbot_opened', 'floating_chat_question')
    GROUP BY user_id, session_id
) qh ON u.id = qh.user_id AND s.id = qh.session_id
-- Quiz
LEFT JOIN (
    SELECT user_id, session_id,
        ROUND(AVG(accuracy_percentage)::numeric, 1) AS avg_accuracy,
        SUM(total_questions) AS total_questions_answered
    FROM quiz_session_summary WHERE completed GROUP BY user_id, session_id
) quiz_d ON u.id = quiz_d.user_id AND s.id = quiz_d.session_id
-- Assessment
LEFT JOIN (
    SELECT user_id, session_id,
        COUNT(*) AS total_assessments,
        ROUND(AVG(overall_score)::numeric, 3) AS avg_score
    FROM assessments GROUP BY user_id, session_id
) assess ON u.id = assess.user_id AND s.id = assess.session_id
-- Revision
LEFT JOIN (
    SELECT user_id, session_id, COUNT(*) AS total_revisions
    FROM user_revision_tracking GROUP BY user_id, session_id
) rev_d ON u.id = rev_d.user_id AND s.id = rev_d.session_id
-- Feedback style switches
LEFT JOIN (
    SELECT user_id, session_id, COUNT(*) AS style_switches
    FROM feedback_style_views GROUP BY user_id, session_id
) fsv_d ON u.id = fsv_d.user_id AND s.id = fsv_d.session_id
ORDER BY u.id;


-- ████████████████████████████████████████████████████████████████
-- SECTION C: RQ1 — Between-Group Comparison (Bot vs Static)
-- RQ1a: Immediate effects (skill mastery, motivation, exam)
-- RQ1b: Retention at 3-4 week follow-up
-- ████████████████████████████████████████████████████████████████

-- C1: Assessment scores by condition (main RQ1a outcome)
-- Export this for ANCOVA in R/Python
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    a.phase,
    a.component,
    a.attempt_number,
    a.overall_score,
    a.lowest_category,
    a.scaffolding_level,
    a.feedback_style,
    a.evaluation,
    a.evaluation_time_ms,
    a.feedback_time_ms,
    a.created_at
FROM assessments a
JOIN sessions s ON a.session_id = s.id
JOIN users u ON a.user_id = u.id
ORDER BY u.id, a.phase, a.attempt_number;


-- C2: Initial vs final KC scores by condition (SRL quality improvement)
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    a.phase,
    a.component,
    COUNT(DISTINCT a.user_id) AS n_users,
    -- First attempt
    ROUND(AVG(CASE WHEN a.attempt_number = 1 THEN a.overall_score END)::numeric, 3) AS avg_initial_score,
    ROUND(STDDEV(CASE WHEN a.attempt_number = 1 THEN a.overall_score END)::numeric, 3) AS sd_initial,
    -- Final attempt
    ROUND(AVG(final_s.final_score)::numeric, 3) AS avg_final_score,
    ROUND(STDDEV(final_s.final_score)::numeric, 3) AS sd_final,
    -- Improvement
    ROUND(AVG(final_s.final_score - CASE WHEN a.attempt_number = 1 THEN a.overall_score END)::numeric, 3) AS avg_improvement
FROM assessments a
JOIN sessions s ON a.session_id = s.id
LEFT JOIN (
    SELECT user_id, session_id, phase, component, overall_score AS final_score,
           ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
    FROM assessments
) final_s ON a.user_id = final_s.user_id AND a.session_id = final_s.session_id
    AND a.phase = final_s.phase AND a.component = final_s.component AND final_s.rn = 1
WHERE a.attempt_number = 1
GROUP BY COALESCE(s.metadata->>'condition', 'unknown'), a.phase, a.component
ORDER BY a.phase;


-- C3: Quiz pre/post by condition
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    qss.phase,
    COALESCE(qss.metadata->>'test_type', 'unknown') AS test_type,
    COUNT(DISTINCT qss.user_id) AS n,
    ROUND(AVG(qss.accuracy_percentage)::numeric, 1) AS avg_accuracy,
    ROUND(STDDEV(qss.accuracy_percentage)::numeric, 1) AS sd_accuracy,
    ROUND(AVG(qss.total_time_seconds)::numeric, 0) AS avg_time_sec
FROM quiz_session_summary qss
JOIN sessions s ON qss.session_id = s.id
WHERE qss.completed = true
GROUP BY COALESCE(s.metadata->>'condition', 'unknown'), qss.phase, COALESCE(qss.metadata->>'test_type', 'unknown')
ORDER BY qss.phase, test_type;


-- C4: Video engagement by condition
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    uva.phase,
    COUNT(DISTINCT uva.user_id) AS n,
    ROUND(AVG(uva.completion_percentage)::numeric, 1) AS avg_completion_pct,
    ROUND(AVG(uva.watched_duration_seconds)::numeric, 0) AS avg_watched_sec,
    ROUND(AVG(uva.play_count)::numeric, 1) AS avg_plays,
    ROUND(AVG(uva.pause_count)::numeric, 1) AS avg_pauses,
    ROUND(AVG(uva.rewind_count)::numeric, 1) AS avg_rewinds,
    ROUND(AVG(uva.seek_count)::numeric, 1) AS avg_seeks
FROM user_video_analytics uva
JOIN sessions s ON uva.session_id = s.id
GROUP BY COALESCE(s.metadata->>'condition', 'unknown'), uva.phase
ORDER BY uva.phase;


-- C5: Phase 6 post-assessment responses by condition
-- Grades + preparation level come from content_interaction_logs (event metadata)
-- The actual exam preparation plan TEXT is stored in user_data table
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    -- From event log (content_interaction_logs)
    cil.interaction_data->>'aiming_grade' AS aiming_grade,
    cil.interaction_data->>'expected_grade' AS expected_grade,
    cil.interaction_data->>'preparation_level' AS preparation_level,
    (cil.interaction_data->>'answer_length')::int AS answer_length,
    cil.timestamp,
    -- From user_data table (the actual written plan)
    ud.value AS exam_prep_plan_text
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u ON cil.user_id = u.id
LEFT JOIN user_data ud ON ud.user_id = u.id AND ud.data_type = 'final_exam_preparation_plan'
WHERE cil.interaction_type = 'post_assessment_submitted'
ORDER BY u.id;


-- C6: Total learning time by condition (for time-on-task comparison)
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    COUNT(DISTINCT pca.user_id) AS n,
    ROUND(AVG(total_min)::numeric, 1) AS avg_total_min,
    ROUND(STDDEV(total_min)::numeric, 1) AS sd_total_min,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_min)::numeric, 1) AS median_total_min
FROM (
    SELECT session_id, user_id, SUM(total_time_seconds) / 60.0 AS total_min
    FROM phase_completion_analytics
    WHERE completed_successfully = true
    GROUP BY session_id, user_id
) pca
JOIN sessions s ON pca.session_id = s.id
GROUP BY COALESCE(s.metadata->>'condition', 'unknown');


-- ████████████████████████████████████████████████████████████████
-- SECTION D: RQ2 — Engagement Profiles (Bot Condition Only)
-- 6 indicators for Latent Profile Analysis (LPA)
-- Indicators 1-4: Behavioral trace (from platform logs)
-- Indicators 5-6: Text-analytic (computed in Python from raw text)
-- ████████████████████████████████████████████████████████████████

-- D1: Indicator 1 — Revision frequency per user per phase
SELECT
    urt.user_id,
    u.name,
    urt.phase,
    urt.component,
    COUNT(*) AS revision_count
FROM user_revision_tracking urt
JOIN users u ON urt.user_id = u.id
JOIN sessions s ON urt.session_id = s.id
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
GROUP BY urt.user_id, u.name, urt.phase, urt.component
ORDER BY urt.user_id, urt.phase;


-- D2: Indicator 2 — Time-on-feedback (seconds between feedback and next user action)
SELECT
    fd.user_id,
    u.name,
    fd.phase,
    fd.component,
    fd.feedback_time,
    rs.revision_time,
    ROUND(EXTRACT(EPOCH FROM (rs.revision_time - fd.feedback_time))::numeric, 1) AS time_on_feedback_sec
FROM (
    SELECT session_id, user_id, phase, component, timestamp AS feedback_time,
           ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
    FROM content_interaction_logs
    WHERE interaction_type = 'feedback_delivered'
) fd
JOIN (
    SELECT session_id, user_id, phase, component, timestamp AS revision_time,
           ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
    FROM content_interaction_logs
    WHERE interaction_type = 'revision_started'
) rs ON fd.session_id = rs.session_id AND fd.phase = rs.phase
    AND fd.component = rs.component AND fd.seq = rs.seq
JOIN users u ON fd.user_id = u.id
JOIN sessions s ON fd.session_id = s.id
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY fd.user_id, fd.phase;


-- D3: Indicator 3 — SRL quality improvement (initial→final KC score change)
SELECT
    a_first.user_id,
    u.name,
    a_first.phase,
    a_first.component,
    a_first.overall_score AS initial_score,
    a_last.overall_score AS final_score,
    ROUND((a_last.overall_score - a_first.overall_score)::numeric, 3) AS srl_improvement,
    a_last.attempt_number AS total_attempts
FROM (
    SELECT user_id, session_id, phase, component, overall_score,
           ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number ASC) AS rn
    FROM assessments
) a_first
JOIN (
    SELECT user_id, session_id, phase, component, overall_score, attempt_number,
           ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
    FROM assessments
) a_last ON a_first.user_id = a_last.user_id AND a_first.session_id = a_last.session_id
    AND a_first.phase = a_last.phase AND a_first.component = a_last.component
JOIN users u ON a_first.user_id = u.id
JOIN sessions s ON a_first.session_id = s.id
WHERE a_first.rn = 1 AND a_last.rn = 1
  AND COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY a_first.user_id, a_first.phase;


-- D4: Indicator 4 — Student-initiated help-seeking (Quick Help / floating chatbot)
SELECT
    cil.user_id,
    u.name,
    cil.phase,
    COUNT(CASE WHEN cil.interaction_type = 'floating_chatbot_opened' THEN 1 END) AS opens,
    COUNT(CASE WHEN cil.interaction_type = 'floating_chat_question' THEN 1 END) AS questions_asked,
    COUNT(CASE WHEN cil.interaction_type = 'floating_chat_response' THEN 1 END) AS responses_received,
    ROUND(AVG(
        CASE WHEN cil.interaction_type = 'floating_chatbot_closed'
        THEN (cil.interaction_data->>'duration_seconds')::numeric END
    ), 1) AS avg_session_sec
FROM content_interaction_logs cil
JOIN users u ON cil.user_id = u.id
JOIN sessions s ON cil.session_id = s.id
WHERE cil.interaction_type IN ('floating_chatbot_opened', 'floating_chatbot_closed',
                                'floating_chat_question', 'floating_chat_response')
  AND COALESCE(s.metadata->>'condition', '') = 'bot'
GROUP BY cil.user_id, u.name, cil.phase
ORDER BY cil.user_id, cil.phase;


-- D5: Raw text export for Indicators 5 & 6 (revision depth & feedback integration)
-- Export to CSV → compute in Python with sentence embeddings
-- Returns: R1 (initial), feedback, R2 (revised) for each user×phase×attempt
SELECT
    a.user_id,
    u.name,
    a.session_id,
    a.phase,
    a.component,
    a.attempt_number,
    -- User's submission text
    ui.input_value AS user_response_text,
    -- AI feedback text
    a.feedback_content AS feedback_text,
    -- Score
    a.overall_score,
    a.lowest_category,
    a.scaffolding_level,
    a.created_at
FROM assessments a
JOIN users u ON a.user_id = u.id
JOIN sessions s ON a.session_id = s.id
LEFT JOIN user_inputs ui ON a.session_id = ui.session_id
    AND a.phase = ui.phase
    AND a.component = ui.component
    AND ui.is_submission = true
    AND ui.attempt_number = a.attempt_number
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY a.user_id, a.phase, a.attempt_number;


-- D6: Combined LPA input dataset (all 4 behavioral indicators per user)
-- Merge into one row per user for LPA input
SELECT
    u.id AS user_id,
    u.name,
    -- I1: Total revision frequency across all phases
    COALESCE(rev.total_revisions, 0) AS i1_revision_freq,
    -- I2: Average time-on-feedback (seconds)
    COALESCE(tof.avg_time_on_feedback, 0) AS i2_avg_time_on_feedback,
    -- I3: Average SRL quality improvement
    COALESCE(srl.avg_improvement, 0) AS i3_srl_improvement,
    -- I4: Total help-seeking questions
    COALESCE(help.total_questions, 0) AS i4_help_seeking,
    -- Indicators 5-6 must be computed in Python from D5 export
    -- Additional metadata for context
    COALESCE(rev.phases_with_revisions, 0) AS phases_with_revisions,
    COALESCE(assess.total_attempts, 0) AS total_assessment_attempts,
    COALESCE(assess.avg_score, 0) AS avg_assessment_score
FROM users u
JOIN sessions s ON u.id = s.user_id
-- I1: Revision frequency
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_revisions, COUNT(DISTINCT phase) AS phases_with_revisions
    FROM user_revision_tracking
    GROUP BY user_id
) rev ON u.id = rev.user_id
-- I2: Time-on-feedback
LEFT JOIN (
    SELECT fd.user_id,
           ROUND(AVG(EXTRACT(EPOCH FROM (rs.ts - fd.ts)))::numeric, 1) AS avg_time_on_feedback
    FROM (
        SELECT session_id, user_id, phase, component, timestamp AS ts,
               ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
        FROM content_interaction_logs WHERE interaction_type = 'feedback_delivered'
    ) fd
    JOIN (
        SELECT session_id, phase, component, timestamp AS ts,
               ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
        FROM content_interaction_logs WHERE interaction_type = 'revision_started'
    ) rs ON fd.session_id = rs.session_id AND fd.phase = rs.phase
        AND fd.component = rs.component AND fd.seq = rs.seq
    GROUP BY fd.user_id
) tof ON u.id = tof.user_id
-- I3: SRL improvement
LEFT JOIN (
    SELECT a1.user_id, ROUND(AVG(al.score - a1.score)::numeric, 3) AS avg_improvement
    FROM (
        SELECT user_id, session_id, phase, component, overall_score AS score,
               ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number ASC) AS rn
        FROM assessments
    ) a1
    JOIN (
        SELECT user_id, session_id, phase, component, overall_score AS score,
               ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
        FROM assessments
    ) al ON a1.user_id = al.user_id AND a1.session_id = al.session_id
        AND a1.phase = al.phase AND a1.component = al.component
    WHERE a1.rn = 1 AND al.rn = 1
    GROUP BY a1.user_id
) srl ON u.id = srl.user_id
-- I4: Help-seeking
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_questions
    FROM content_interaction_logs
    WHERE interaction_type = 'floating_chat_question'
    GROUP BY user_id
) help ON u.id = help.user_id
-- Assessment summary
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_attempts, ROUND(AVG(overall_score)::numeric, 3) AS avg_score
    FROM assessments
    GROUP BY user_id
) assess ON u.id = assess.user_id
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY u.id;


-- ████████████████████████████████████████████████████████████████
-- SECTION E: RQ3 & RQ4 — Engagement-Outcome Relations & Moderation
-- RQ3: Does deep engagement predict greater gains?
-- RQ4: Do baseline characteristics moderate engagement-outcome?
-- ████████████████████████████████████████████████████████████████

-- E1: Full dataset for ANCOVA — engagement indicators + outcomes + covariates
-- One row per user — merge everything needed for RQ3 analysis
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    -- Profile/baseline data (covariates for RQ3-4)
    u.profile_data->>'year' AS year_level,
    u.profile_data->>'major' AS major,
    u.profile_data->>'challenging_course' AS target_course,
    u.profile_data->>'coach_tone' AS feedback_preference,
    -- Engagement indicators (RQ2→RQ3 input)
    COALESCE(rev.total_revisions, 0) AS revision_frequency,
    COALESCE(tof.avg_time_on_feedback, 0) AS avg_time_on_feedback_sec,
    COALESCE(srl.avg_improvement, 0) AS srl_quality_improvement,
    COALESCE(help.total_questions, 0) AS help_seeking_count,
    -- Outcome: Assessment scores (per phase)
    COALESCE(p2_score.score, 0) AS phase2_final_score,
    COALESCE(p4_score.score, 0) AS phase4_final_score,
    COALESCE(p5_score.score, 0) AS phase5_final_score,
    COALESCE(outcomes.avg_score, 0) AS overall_avg_score,
    -- Outcome: Quiz accuracy
    COALESCE(quiz.avg_accuracy, 0) AS avg_quiz_accuracy,
    -- Outcome: Phases completed
    COALESCE(completion.phases_done, 0) AS phases_completed,
    -- Time data
    COALESCE(time_data.total_min, 0) AS total_learning_minutes,
    -- Session info
    s.created_at AS session_start
FROM users u
JOIN sessions s ON u.id = s.user_id
-- Engagement indicators (same as D6)
LEFT JOIN (SELECT user_id, COUNT(*) AS total_revisions FROM user_revision_tracking GROUP BY user_id) rev ON u.id = rev.user_id
LEFT JOIN (
    SELECT fd.user_id, ROUND(AVG(EXTRACT(EPOCH FROM (rs.ts - fd.ts)))::numeric, 1) AS avg_time_on_feedback
    FROM (SELECT session_id, user_id, phase, component, timestamp AS ts, ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq FROM content_interaction_logs WHERE interaction_type = 'feedback_delivered') fd
    JOIN (SELECT session_id, phase, component, timestamp AS ts, ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq FROM content_interaction_logs WHERE interaction_type = 'revision_started') rs
    ON fd.session_id = rs.session_id AND fd.phase = rs.phase AND fd.component = rs.component AND fd.seq = rs.seq
    GROUP BY fd.user_id
) tof ON u.id = tof.user_id
LEFT JOIN (
    SELECT a1.user_id, ROUND(AVG(al.s - a1.s)::numeric, 3) AS avg_improvement
    FROM (SELECT user_id, session_id, phase, component, overall_score AS s, ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number ASC) AS rn FROM assessments) a1
    JOIN (SELECT user_id, session_id, phase, component, overall_score AS s, ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn FROM assessments) al
    ON a1.user_id = al.user_id AND a1.session_id = al.session_id AND a1.phase = al.phase AND a1.component = al.component
    WHERE a1.rn = 1 AND al.rn = 1 GROUP BY a1.user_id
) srl ON u.id = srl.user_id
LEFT JOIN (SELECT user_id, COUNT(*) AS total_questions FROM content_interaction_logs WHERE interaction_type = 'floating_chat_question' GROUP BY user_id) help ON u.id = help.user_id
-- Per-phase final scores
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase = 'phase2') p2_score ON u.id = p2_score.user_id AND s.id = p2_score.session_id AND p2_score.rn = 1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase = 'phase4') p4_score ON u.id = p4_score.user_id AND s.id = p4_score.session_id AND p4_score.rn = 1
LEFT JOIN (SELECT user_id, session_id, overall_score AS score, ROW_NUMBER() OVER (PARTITION BY user_id, session_id ORDER BY attempt_number DESC) AS rn FROM assessments WHERE phase = 'phase5') p5_score ON u.id = p5_score.user_id AND s.id = p5_score.session_id AND p5_score.rn = 1
-- Overall score
LEFT JOIN (SELECT user_id, ROUND(AVG(overall_score)::numeric, 3) AS avg_score FROM assessments GROUP BY user_id) outcomes ON u.id = outcomes.user_id
-- Quiz accuracy
LEFT JOIN (SELECT user_id, ROUND(AVG(accuracy_percentage)::numeric, 1) AS avg_accuracy FROM quiz_session_summary WHERE completed = true GROUP BY user_id) quiz ON u.id = quiz.user_id
-- Completion count
LEFT JOIN (SELECT user_id, session_id, COUNT(DISTINCT phase) AS phases_done FROM phase_completion_analytics WHERE completed_successfully GROUP BY user_id, session_id) completion ON u.id = completion.user_id AND s.id = completion.session_id
-- Total time
LEFT JOIN (SELECT user_id, session_id, ROUND(SUM(total_time_seconds)::numeric / 60.0, 1) AS total_min FROM phase_completion_analytics GROUP BY user_id, session_id) time_data ON u.id = time_data.user_id AND s.id = time_data.session_id
ORDER BY u.id;


-- E2: Baseline characteristics for moderation (RQ4)
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    -- Demographics from profile_data
    u.profile_data->>'year' AS year_level,
    u.profile_data->>'major' AS major,
    u.profile_data->>'challenging_course' AS course,
    u.profile_data->>'coach_tone' AS preferred_tone,
    -- Pre-quiz baseline (if exists)
    pre_quiz.accuracy_percentage AS pre_quiz_accuracy,
    -- Session timing
    s.created_at AS enrollment_date
FROM users u
JOIN sessions s ON u.id = s.user_id
LEFT JOIN (
    SELECT user_id, session_id, accuracy_percentage
    FROM quiz_session_summary
    WHERE COALESCE(metadata->>'test_type', '') = 'pre' AND completed = true
) pre_quiz ON u.id = pre_quiz.user_id AND s.id = pre_quiz.session_id
ORDER BY u.id;


-- ████████████████████████████████████████████████████████████████
-- SECTION F: FULL DATA EXPORTS (for R / Python)
-- Export as CSV from Supabase SQL Editor
-- ████████████████████████████████████████████████████████████████

-- F1: Full conversation export (all messages with context)
SELECT
    m.id AS message_id,
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    m.phase,
    m.component,
    m.role,
    m.content,
    m.metadata,
    m.created_at
FROM messages m
JOIN sessions s ON m.session_id = s.id
JOIN users u ON s.user_id = u.id
ORDER BY u.id, m.phase, m.created_at;


-- F2: Full event log export (master interaction log)
SELECT
    cil.id,
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    cil.interaction_type,
    cil.content_type,
    cil.phase,
    cil.component,
    cil.interaction_data,
    cil.timestamp
FROM content_interaction_logs cil
JOIN sessions s ON cil.session_id = s.id
JOIN users u ON cil.user_id = u.id
ORDER BY u.id, cil.timestamp;


-- F3: Full assessment export with feedback text
SELECT
    a.id AS assessment_id,
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    a.phase,
    a.component,
    a.attempt_number,
    a.overall_score,
    a.lowest_category,
    a.scaffolding_level,
    a.rationale,
    a.full_evaluation,
    a.evaluation_method,
    a.feedback_style,
    a.feedback_content,
    a.evaluation_time_ms,
    a.feedback_time_ms,
    a.created_at
FROM assessments a
JOIN sessions s ON a.session_id = s.id
JOIN users u ON a.user_id = u.id
ORDER BY u.id, a.phase, a.attempt_number;


-- F4: Full user inputs export
SELECT
    ui.id,
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    ui.input_type,
    ui.field_name,
    ui.input_value,
    ui.phase,
    ui.component,
    ui.is_submission,
    ui.attempt_number,
    ui.metadata,
    ui.timestamp
FROM user_inputs ui
JOIN sessions s ON ui.session_id = s.id
JOIN users u ON ui.user_id = u.id
ORDER BY u.id, ui.timestamp;


-- F5: Quick Help chatbot interactions (full detail)
SELECT
    cil.id,
    u.id AS user_id,
    u.name,
    cil.phase,
    cil.interaction_type,
    cil.interaction_data->>'question' AS question_text,
    cil.interaction_data->>'response' AS response_text,
    cil.interaction_data->>'trigger' AS trigger_type,
    cil.interaction_data->>'duration_seconds' AS duration_sec,
    cil.interaction_data->>'page' AS page_context,
    cil.timestamp
FROM content_interaction_logs cil
JOIN users u ON cil.user_id = u.id
WHERE cil.interaction_type IN (
    'floating_chatbot_opened', 'floating_chatbot_closed',
    'floating_chat_question', 'floating_chat_response'
)
ORDER BY u.id, cil.timestamp;


-- F6: LLM interaction details (for debugging AI behavior)
SELECT
    li.id,
    u.id AS user_id,
    u.name,
    li.phase,
    li.component,
    li.model_name,
    li.input_tokens,
    li.output_tokens,
    li.duration_ms,
    LEFT(li.system_prompt, 200) AS system_prompt_preview,
    LEFT(li.user_message, 200) AS user_msg_preview,
    LEFT(li.processed_response, 200) AS response_preview,
    li.created_at
FROM llm_interactions li
JOIN users u ON li.user_id = u.id
ORDER BY li.created_at;


-- ████████████████████████████████████████████████████████████████
-- SECTION G: DATA INTEGRITY CHECKS
-- Run these BEFORE analysis to catch missing/inconsistent data
-- ████████████████████████████████████████████████████████████████

-- G1: Users with missing data across key tables
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    (SELECT COUNT(DISTINCT phase) FROM content_interaction_logs WHERE session_id = s.id) AS phases_with_events,
    (SELECT COUNT(*) FROM assessments WHERE session_id = s.id) AS assessments,
    (SELECT COUNT(*) FROM user_video_analytics WHERE session_id = s.id) AS videos,
    (SELECT COUNT(*) FROM user_chat_analytics WHERE session_id = s.id AND component != 'floating_chatbot') AS main_chats,
    (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id = s.id AND completed = true) AS quizzes,
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id = s.id AND completed_successfully) AS completed_phases,
    -- Status flags
    CASE WHEN (SELECT COUNT(*) FROM assessments WHERE session_id = s.id) = 0 THEN '⚠️' ELSE '✓' END AS assess_ok,
    CASE WHEN (SELECT COUNT(*) FROM user_video_analytics WHERE session_id = s.id) = 0 THEN '⚠️' ELSE '✓' END AS video_ok,
    CASE WHEN (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id = s.id AND completed = true) = 0 THEN '⚠️' ELSE '✓' END AS quiz_ok
FROM users u
JOIN sessions s ON u.id = s.user_id
ORDER BY completed_phases ASC, u.name;


-- G2: Check for orphaned records (data without valid session/user)
SELECT 'assessments' AS tbl, COUNT(*) AS orphans
FROM assessments a WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = a.session_id)
UNION ALL
SELECT 'messages', COUNT(*)
FROM messages m WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = m.session_id)
UNION ALL
SELECT 'content_interaction_logs', COUNT(*)
FROM content_interaction_logs c WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = c.session_id)
UNION ALL
SELECT 'user_inputs', COUNT(*)
FROM user_inputs ui WHERE NOT EXISTS (SELECT 1 FROM sessions s WHERE s.id = ui.session_id);


-- G3: Check for duplicate sessions per user (should be 1 per experiment)
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COUNT(s.id) AS session_count,
    STRING_AGG(s.id::text, ', ') AS session_ids
FROM users u
JOIN sessions s ON u.id = s.user_id
GROUP BY u.id, u.name, u.email
HAVING COUNT(s.id) > 1
ORDER BY session_count DESC;


-- G4: Check condition assignment distribution
SELECT
    COALESCE(s.metadata->>'condition', 'NONE/NULL') AS condition,
    COUNT(DISTINCT s.user_id) AS user_count,
    COUNT(DISTINCT s.id) AS session_count
FROM sessions s
GROUP BY COALESCE(s.metadata->>'condition', 'NONE/NULL');


-- G5: Check for users who started but never completed any phase
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    s.created_at AS started,
    (SELECT COUNT(*) FROM content_interaction_logs WHERE session_id = s.id) AS total_events,
    (SELECT MAX(timestamp) FROM content_interaction_logs WHERE session_id = s.id) AS last_event,
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id = s.id AND completed_successfully) AS phases_completed
FROM users u
JOIN sessions s ON u.id = s.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM phase_completion_analytics pca
    WHERE pca.session_id = s.id AND pca.completed_successfully = true
)
ORDER BY s.created_at DESC;


-- G6: Verify expected event types are present for completed phases
-- Check that chatbot phases (2, 4, 5) have chat_message events
SELECT
    pca.session_id,
    u.name,
    pca.phase,
    pca.completed_successfully,
    (SELECT COUNT(*) FROM content_interaction_logs cil
     WHERE cil.session_id = pca.session_id AND cil.phase = pca.phase
     AND cil.interaction_type = 'chat_message') AS chat_messages,
    (SELECT COUNT(*) FROM content_interaction_logs cil
     WHERE cil.session_id = pca.session_id AND cil.phase = pca.phase
     AND cil.interaction_type LIKE 'video_%') AS video_events,
    (SELECT COUNT(*) FROM content_interaction_logs cil
     WHERE cil.session_id = pca.session_id AND cil.phase = pca.phase
     AND cil.interaction_type LIKE 'quiz_%') AS quiz_events,
    (SELECT COUNT(*) FROM assessments a
     WHERE a.session_id = pca.session_id AND a.phase = pca.phase) AS assessment_records
FROM phase_completion_analytics pca
JOIN users u ON pca.user_id = u.id
WHERE pca.completed_successfully = true
  AND pca.phase IN ('phase2', 'phase4', 'phase5')
ORDER BY u.name, pca.phase;
