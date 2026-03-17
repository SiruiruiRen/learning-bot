-- ================================================================
-- SoL2LBot Research Analysis Queries
-- Aligned with Chapter 4: Adaptive AI Scaffolding for SRL Skill Internalization
-- Research Questions: RQ1a, RQ1b, RQ2, RQ3, RQ4
-- ================================================================

-- ============================================================
-- SECTION 1: BASIC DASHBOARD — 参加概况 (Participation Overview)
-- ============================================================

-- Q1: User participation count by custom date range (with condition)
-- Usage: Replace date placeholders with your desired range
SELECT
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT s.id) AS total_sessions,
    COUNT(DISTINCT CASE WHEN s.metadata->>'condition' = 'bot' THEN u.id END) AS bot_condition_users,
    COUNT(DISTINCT CASE WHEN s.metadata->>'condition' = 'static' THEN u.id END) AS static_condition_users,
    MIN(s.created_at)::date AS earliest_session,
    MAX(s.created_at)::date AS latest_session
FROM users u
JOIN sessions s ON u.id = s.user_id
WHERE s.created_at >= '2026-01-01'  -- Change start date
  AND s.created_at < '2026-12-31';  -- Change end date


-- Q2: User progress overview — which phase each user is at
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    s.id AS session_id,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    s.created_at AS session_start,
    MAX(CASE WHEN cil.phase IS NOT NULL THEN cil.phase END) AS latest_phase_activity,
    COUNT(DISTINCT cil.phase) AS phases_touched,
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id = s.id AND completed_successfully) AS phases_completed,
    MAX(cil.timestamp) AS last_activity_time,
    ROUND(EXTRACT(EPOCH FROM (MAX(cil.timestamp) - s.created_at)) / 3600.0, 1) AS total_hours_elapsed
FROM users u
JOIN sessions s ON u.id = s.user_id
LEFT JOIN content_interaction_logs cil ON s.id = cil.session_id
GROUP BY u.id, u.name, u.email, s.id, s.metadata, s.created_at
ORDER BY session_start DESC;


-- Q3: Overall completion rate by phase
SELECT
    phase,
    COUNT(DISTINCT session_id) AS users_started,
    COUNT(DISTINCT CASE WHEN completed_successfully THEN session_id END) AS users_completed,
    ROUND(
        COUNT(DISTINCT CASE WHEN completed_successfully THEN session_id END)::numeric * 100.0
        / GREATEST(COUNT(DISTINCT session_id), 1), 1
    ) AS completion_rate_pct,
    ROUND(AVG(total_time_seconds)::numeric / 60.0, 1) AS avg_minutes
FROM phase_completion_analytics
GROUP BY phase
ORDER BY phase;


-- Q4: Average time spent per phase (from content_interaction_logs timestamps)
SELECT
    phase,
    COUNT(DISTINCT session_id) AS unique_users,
    ROUND(AVG(phase_duration_min)::numeric, 1) AS avg_minutes,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY phase_duration_min)::numeric, 1) AS median_minutes,
    ROUND(MIN(phase_duration_min)::numeric, 1) AS min_minutes,
    ROUND(MAX(phase_duration_min)::numeric, 1) AS max_minutes
FROM (
    SELECT
        session_id,
        phase,
        EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 60.0 AS phase_duration_min
    FROM content_interaction_logs
    WHERE phase IS NOT NULL
    GROUP BY session_id, phase
) sub
GROUP BY phase
ORDER BY phase;


-- Q5: Daily active users trend
SELECT
    DATE(cil.timestamp) AS activity_date,
    COUNT(DISTINCT cil.session_id) AS active_sessions,
    COUNT(DISTINCT cil.user_id) AS active_users,
    COUNT(*) AS total_interactions,
    COUNT(DISTINCT cil.phase) AS phases_accessed
FROM content_interaction_logs cil
GROUP BY DATE(cil.timestamp)
ORDER BY activity_date DESC;


-- ============================================================
-- SECTION 2: RQ1 — Between-Group Comparison (Bot vs Static)
-- RQ1a: Immediate effects on skill mastery, motivation, exam
-- RQ1b: Do Bot gains persist at 3-4 week follow-up?
-- ============================================================

-- Q6: Assessment scores by condition — for ANCOVA / t-tests
-- Returns per-user, per-phase scores with condition label
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    a.phase,
    a.component,
    a.attempt_number,
    a.overall_score,
    a.lowest_category,
    a.scaffolding_level,
    a.evaluation,
    a.created_at
FROM assessments a
JOIN sessions s ON a.session_id = s.id
JOIN users u ON a.user_id = u.id
ORDER BY u.id, a.phase, a.attempt_number;


-- Q7: KC (Knowledge Component) scores by phase and condition
-- Initial vs final response comparison for SRL quality improvement
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    a.phase,
    a.component,
    COUNT(DISTINCT a.user_id) AS n_users,
    -- First attempt scores
    ROUND(AVG(CASE WHEN a.attempt_number = 1 THEN a.overall_score END)::numeric, 3) AS avg_initial_score,
    ROUND(STDDEV(CASE WHEN a.attempt_number = 1 THEN a.overall_score END)::numeric, 3) AS sd_initial_score,
    -- Final attempt scores (max attempt per user)
    ROUND(AVG(final_scores.final_score)::numeric, 3) AS avg_final_score,
    ROUND(STDDEV(final_scores.final_score)::numeric, 3) AS sd_final_score,
    -- Improvement
    ROUND(AVG(final_scores.final_score - CASE WHEN a.attempt_number = 1 THEN a.overall_score END)::numeric, 3) AS avg_improvement
FROM assessments a
JOIN sessions s ON a.session_id = s.id
LEFT JOIN (
    SELECT user_id, session_id, phase, component, overall_score AS final_score,
           ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
    FROM assessments
) final_scores ON a.user_id = final_scores.user_id
    AND a.session_id = final_scores.session_id
    AND a.phase = final_scores.phase
    AND a.component = final_scores.component
    AND final_scores.rn = 1
WHERE a.attempt_number = 1
GROUP BY condition, a.phase, a.component
ORDER BY a.phase;


-- Q8: Quiz accuracy by condition (pre-test / post-test)
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    qss.phase,
    COALESCE(qss.metadata->>'test_type', 'unknown') AS test_type,
    COUNT(DISTINCT qss.user_id) AS n_users,
    ROUND(AVG(qss.accuracy_percentage)::numeric, 1) AS avg_accuracy_pct,
    ROUND(STDDEV(qss.accuracy_percentage)::numeric, 1) AS sd_accuracy_pct,
    ROUND(AVG(qss.total_questions)::numeric, 1) AS avg_questions,
    ROUND(AVG(qss.correct_answers)::numeric, 1) AS avg_correct
FROM quiz_session_summary qss
JOIN sessions s ON qss.session_id = s.id
WHERE qss.completed = true
GROUP BY condition, qss.phase, test_type
ORDER BY qss.phase, test_type;


-- Q9: Video engagement by condition
SELECT
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    uva.phase,
    COUNT(DISTINCT uva.user_id) AS n_users,
    ROUND(AVG(uva.completion_percentage)::numeric, 1) AS avg_video_completion_pct,
    ROUND(AVG(uva.watched_duration_seconds)::numeric, 0) AS avg_watched_seconds,
    ROUND(AVG(uva.play_count)::numeric, 1) AS avg_play_count,
    ROUND(AVG(uva.pause_count)::numeric, 1) AS avg_pause_count,
    ROUND(AVG(uva.rewind_count)::numeric, 1) AS avg_rewind_count
FROM user_video_analytics uva
JOIN sessions s ON uva.session_id = s.id
GROUP BY condition, uva.phase
ORDER BY uva.phase;


-- ============================================================
-- SECTION 3: RQ2 — Engagement Profile Data (Bot Condition Only)
-- 6 indicators for Latent Profile Analysis (LPA)
-- ============================================================

-- Q10: Indicator 1 — Revision frequency per user per phase
-- Number of revisions after feedback
SELECT
    urt.user_id,
    u.name,
    urt.phase,
    urt.component,
    COUNT(*) AS revision_count,
    ROUND(AVG(urt.score_improvement)::numeric, 3) AS avg_score_change_per_revision
FROM user_revision_tracking urt
JOIN users u ON urt.user_id = u.id
JOIN sessions s ON urt.session_id = s.id
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
GROUP BY urt.user_id, u.name, urt.phase, urt.component
ORDER BY urt.user_id, urt.phase;


-- Q11: Indicator 2 — Time-on-feedback per user per phase
-- Seconds between feedback_delivered and revision_started events
SELECT
    fd.user_id,
    u.name,
    fd.phase,
    fd.component,
    fd.feedback_time,
    rs.revision_time,
    ROUND(EXTRACT(EPOCH FROM (rs.revision_time - fd.feedback_time))::numeric, 1) AS time_on_feedback_seconds
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
) rs ON fd.session_id = rs.session_id AND fd.phase = rs.phase AND fd.component = rs.component AND fd.seq = rs.seq
JOIN users u ON fd.user_id = u.id
JOIN sessions s ON fd.session_id = s.id
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY fd.user_id, fd.phase;


-- Q12: Indicator 3 — SRL quality improvement (initial vs final KC scores)
SELECT
    a_first.user_id,
    u.name,
    a_first.phase,
    a_first.component,
    a_first.overall_score AS initial_score,
    a_last.overall_score AS final_score,
    ROUND((a_last.overall_score - a_first.overall_score)::numeric, 3) AS srl_quality_improvement
FROM (
    SELECT user_id, session_id, phase, component, overall_score,
           ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number ASC) AS rn
    FROM assessments
) a_first
JOIN (
    SELECT user_id, session_id, phase, component, overall_score,
           ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
    FROM assessments
) a_last ON a_first.user_id = a_last.user_id
    AND a_first.session_id = a_last.session_id
    AND a_first.phase = a_last.phase
    AND a_first.component = a_last.component
JOIN users u ON a_first.user_id = u.id
JOIN sessions s ON a_first.session_id = s.id
WHERE a_first.rn = 1 AND a_last.rn = 1
  AND COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY a_first.user_id, a_first.phase;


-- Q13: Indicator 4 — Student-initiated help-seeking (Quick Help usage)
SELECT
    cil.user_id,
    u.name,
    cil.phase,
    -- Open/close frequency
    COUNT(CASE WHEN cil.interaction_type = 'floating_chatbot_opened' THEN 1 END) AS quick_help_opens,
    COUNT(CASE WHEN cil.interaction_type = 'floating_chatbot_closed' THEN 1 END) AS quick_help_closes,
    -- Questions asked
    COUNT(CASE WHEN cil.interaction_type = 'floating_chat_question' THEN 1 END) AS questions_asked,
    -- Responses received
    COUNT(CASE WHEN cil.interaction_type = 'floating_chat_response' THEN 1 END) AS responses_received,
    -- Average session duration (from open/close metadata)
    ROUND(AVG(
        CASE WHEN cil.interaction_type = 'floating_chatbot_closed'
        THEN (cil.interaction_data->>'duration_seconds')::numeric END
    ), 1) AS avg_session_duration_sec
FROM content_interaction_logs cil
JOIN users u ON cil.user_id = u.id
JOIN sessions s ON cil.session_id = s.id
WHERE cil.interaction_type IN ('floating_chatbot_opened', 'floating_chatbot_closed', 'floating_chat_question', 'floating_chat_response')
  AND COALESCE(s.metadata->>'condition', '') = 'bot'
GROUP BY cil.user_id, u.name, cil.phase
ORDER BY cil.user_id, cil.phase;


-- Q14: Raw data export for text-analytic indicators 5 & 6
-- (Revision depth & Feedback integration)
-- Returns: initial response (R1), feedback text, revised response (R2)
SELECT
    a.user_id,
    u.name,
    a.phase,
    a.component,
    a.attempt_number,
    -- User's submission text (from user_inputs)
    ui.input_value AS user_response_text,
    -- AI feedback text
    a.feedback_content AS feedback_text,
    -- Score for this attempt
    a.overall_score,
    a.evaluation,
    a.created_at
FROM assessments a
JOIN users u ON a.user_id = u.id
JOIN sessions s ON a.session_id = s.id
LEFT JOIN user_inputs ui ON a.session_id = ui.session_id
    AND a.phase = ui.phase
    AND a.component = ui.component
    AND ui.is_submission = true
    AND ui.input_type = 'chat_message'
WHERE COALESCE(s.metadata->>'condition', '') = 'bot'
ORDER BY a.user_id, a.phase, a.attempt_number;


-- ============================================================
-- SECTION 4: RQ3 & RQ4 — Engagement-Outcome Relations
-- RQ3: Does deep engagement predict greater gains?
-- RQ4: Do baseline characteristics moderate engagement-outcome?
-- ============================================================

-- Q15: Combined engagement indicators + outcome variables per user
-- Merge all 6 engagement indicators with outcome scores
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    -- Indicator 1: Revision frequency (total across phases)
    COALESCE(rev.total_revisions, 0) AS revision_frequency,
    -- Indicator 2: Avg time-on-feedback
    COALESCE(tof.avg_time_on_feedback_sec, 0) AS avg_time_on_feedback_sec,
    -- Indicator 3: SRL quality improvement (avg across phases)
    COALESCE(srl.avg_srl_improvement, 0) AS avg_srl_quality_improvement,
    -- Indicator 4: Help-seeking (total quick help questions)
    COALESCE(help.total_questions_asked, 0) AS help_seeking_frequency,
    -- Outcome: Average assessment score
    COALESCE(outcomes.avg_score, 0) AS avg_assessment_score,
    -- Outcome: Final phase reached
    COALESCE(outcomes.phases_completed, 0) AS phases_completed,
    -- Outcome: Quiz accuracy
    COALESCE(quiz_out.avg_quiz_accuracy, 0) AS avg_quiz_accuracy
FROM users u
JOIN sessions s ON u.id = s.user_id
-- Indicator 1: Revision frequency
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_revisions
    FROM user_revision_tracking
    GROUP BY user_id
) rev ON u.id = rev.user_id
-- Indicator 2: Time-on-feedback
LEFT JOIN (
    SELECT fd.user_id, ROUND(AVG(EXTRACT(EPOCH FROM (rs.revision_time - fd.feedback_time)))::numeric, 1) AS avg_time_on_feedback_sec
    FROM (
        SELECT session_id, user_id, phase, component, timestamp AS feedback_time,
               ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
        FROM content_interaction_logs WHERE interaction_type = 'feedback_delivered'
    ) fd
    JOIN (
        SELECT session_id, phase, component, timestamp AS revision_time,
               ROW_NUMBER() OVER (PARTITION BY session_id, phase, component ORDER BY timestamp) AS seq
        FROM content_interaction_logs WHERE interaction_type = 'revision_started'
    ) rs ON fd.session_id = rs.session_id AND fd.phase = rs.phase AND fd.component = rs.component AND fd.seq = rs.seq
    GROUP BY fd.user_id
) tof ON u.id = tof.user_id
-- Indicator 3: SRL quality improvement
LEFT JOIN (
    SELECT a1.user_id, ROUND(AVG(a_last.overall_score - a1.overall_score)::numeric, 3) AS avg_srl_improvement
    FROM (
        SELECT user_id, session_id, phase, component, overall_score,
               ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number ASC) AS rn
        FROM assessments
    ) a1
    JOIN (
        SELECT user_id, session_id, phase, component, overall_score,
               ROW_NUMBER() OVER (PARTITION BY user_id, session_id, phase, component ORDER BY attempt_number DESC) AS rn
        FROM assessments
    ) a_last ON a1.user_id = a_last.user_id AND a1.session_id = a_last.session_id
        AND a1.phase = a_last.phase AND a1.component = a_last.component
    WHERE a1.rn = 1 AND a_last.rn = 1
    GROUP BY a1.user_id
) srl ON u.id = srl.user_id
-- Indicator 4: Help-seeking
LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_questions_asked
    FROM content_interaction_logs
    WHERE interaction_type = 'floating_chat_question'
    GROUP BY user_id
) help ON u.id = help.user_id
-- Outcome: Assessment scores
LEFT JOIN (
    SELECT user_id, ROUND(AVG(overall_score)::numeric, 3) AS avg_score,
           COUNT(DISTINCT phase) AS phases_completed
    FROM assessments
    GROUP BY user_id
) outcomes ON u.id = outcomes.user_id
-- Outcome: Quiz accuracy
LEFT JOIN (
    SELECT user_id, ROUND(AVG(accuracy_percentage)::numeric, 1) AS avg_quiz_accuracy
    FROM quiz_session_summary WHERE completed = true
    GROUP BY user_id
) quiz_out ON u.id = quiz_out.user_id
ORDER BY u.id;


-- Q16: Baseline characteristics for moderation analysis (RQ4)
-- First-generation status, prior achievement, demographics
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    -- Profile data (demographics, first-gen status)
    u.profile_data->>'first_gen' AS first_generation_status,
    u.profile_data->>'prior_gpa' AS prior_gpa,
    u.profile_data->>'major' AS major,
    u.profile_data->>'year' AS academic_year,
    u.profile_data->>'gender' AS gender,
    u.profile_data->>'age' AS age,
    -- Pre-test quiz score (baseline achievement proxy)
    pre_quiz.accuracy_percentage AS pre_test_accuracy,
    -- Session metadata
    s.created_at AS enrollment_date,
    s.metadata AS full_session_metadata
FROM users u
JOIN sessions s ON u.id = s.user_id
LEFT JOIN (
    SELECT user_id, session_id, accuracy_percentage
    FROM quiz_session_summary
    WHERE COALESCE(metadata->>'test_type', '') = 'pre' AND completed = true
) pre_quiz ON u.id = pre_quiz.user_id AND s.id = pre_quiz.session_id
ORDER BY u.id;


-- ============================================================
-- SECTION 5: CHATBOT INTERACTION ANALYSIS
-- ============================================================

-- Q17: Main chatbot conversations summary (per user, per phase)
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
    uca.average_response_time_seconds,
    uca.engagement_score,
    uca.completion_quality
FROM user_chat_analytics uca
JOIN sessions s ON uca.session_id = s.id
JOIN users u ON uca.user_id = u.id
WHERE uca.component != 'floating_chatbot'
ORDER BY u.id, uca.phase, uca.chat_start_time;


-- Q18: Quick Help chatbot usage (open/close patterns, questions asked)
SELECT
    u.id AS user_id,
    u.name,
    cil.phase,
    cil.interaction_type,
    cil.interaction_data->>'trigger' AS open_trigger,
    cil.interaction_data->>'duration_seconds' AS session_duration_sec,
    cil.interaction_data->>'message_count' AS messages_in_session,
    cil.interaction_data->>'page' AS page_context,
    cil.interaction_data->>'question' AS question_text,
    cil.interaction_data->>'response' AS response_text,
    cil.timestamp
FROM content_interaction_logs cil
JOIN users u ON cil.user_id = u.id
WHERE cil.interaction_type IN (
    'floating_chatbot_opened', 'floating_chatbot_closed',
    'floating_chat_question', 'floating_chat_response'
)
ORDER BY u.id, cil.timestamp;


-- Q19: Message exchange details (user messages, AI responses, timestamps)
-- Full conversation reconstruction per user per phase
SELECT
    u.id AS user_id,
    u.name,
    cil.phase,
    cil.component,
    cil.interaction_data->>'role' AS message_role,
    LEFT(cil.interaction_data->>'content', 500) AS message_content_preview,
    cil.interaction_data->>'score' AS score,
    cil.timestamp AS message_time
FROM content_interaction_logs cil
JOIN users u ON cil.user_id = u.id
WHERE cil.interaction_type = 'chat_message'
ORDER BY u.id, cil.phase, cil.timestamp;


-- ============================================================
-- SECTION 6: DATA COMPLETENESS VERIFICATION
-- ============================================================

-- Q20: Row counts across all analytics tables
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
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
UNION ALL SELECT 'user_engagement_sessions', COUNT(*) FROM user_engagement_sessions
ORDER BY row_count DESC;


-- Q21: Users with missing data — identify incomplete participation
SELECT
    u.id AS user_id,
    u.name,
    COALESCE(s.metadata->>'condition', 'unknown') AS condition,
    -- Check each data source
    (SELECT COUNT(DISTINCT phase) FROM content_interaction_logs WHERE session_id = s.id) AS phases_with_activity,
    (SELECT COUNT(*) FROM assessments WHERE session_id = s.id) AS assessment_count,
    (SELECT COUNT(*) FROM user_video_analytics WHERE session_id = s.id) AS video_records,
    (SELECT COUNT(*) FROM user_chat_analytics WHERE session_id = s.id AND component != 'floating_chatbot') AS main_chat_sessions,
    (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id = s.id AND completed = true) AS completed_quizzes,
    (SELECT COUNT(DISTINCT phase) FROM phase_completion_analytics WHERE session_id = s.id AND completed_successfully) AS phases_completed,
    -- Missing flags
    CASE WHEN (SELECT COUNT(*) FROM assessments WHERE session_id = s.id) = 0 THEN 'MISSING' ELSE 'OK' END AS assessments_status,
    CASE WHEN (SELECT COUNT(*) FROM user_video_analytics WHERE session_id = s.id) = 0 THEN 'MISSING' ELSE 'OK' END AS video_status,
    CASE WHEN (SELECT COUNT(*) FROM user_chat_analytics WHERE session_id = s.id AND component != 'floating_chatbot') = 0 THEN 'MISSING' ELSE 'OK' END AS chat_status,
    CASE WHEN (SELECT COUNT(*) FROM quiz_session_summary WHERE session_id = s.id AND completed = true) = 0 THEN 'MISSING' ELSE 'OK' END AS quiz_status
FROM users u
JOIN sessions s ON u.id = s.user_id
ORDER BY phases_completed ASC, u.name;


-- Q22: Event type distribution — verify all expected events are logged
SELECT
    interaction_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT session_id) AS unique_sessions,
    COUNT(DISTINCT user_id) AS unique_users,
    MIN(timestamp) AS first_occurrence,
    MAX(timestamp) AS last_occurrence
FROM content_interaction_logs
GROUP BY interaction_type
ORDER BY event_count DESC;
