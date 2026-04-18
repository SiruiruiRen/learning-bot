-- =====================================================================
-- Ch4 Master Participant-Level Export (v1.0 — 2026-04-17)
-- =====================================================================
-- Produces ONE row per participant with every column the Ch4 analysis
-- plan (RQ3a–RQ3e) consumes: condition, tone, behavioural trace
-- engagement indicators, phase-level KC score improvement, time-on-feedback,
-- help-seeking counts + depth, plus derived flags.
--
-- Purpose: drop this CSV into R / SPSS for:
--   - RQ3a/b ANCOVAs (condition-level outcome comparisons, once a
--     multimedia-interactive arm is enabled)
--   - RQ3c Latent Profile Analysis (six z-scored engagement indicators
--     are produced here in RAW form; z-scoring happens in R because it
--     needs the full sample mean/SD)
--   - RQ3d engagement-effect ANCOVA (profile membership × outcome)
--   - RQ3e first-generation moderation (needs demographic join —
--     demographic data is NOT in this export; join in R against
--     university records)
--
-- IMPORTANT: pre-2026-04-17 sessions (sirui-test-1, etc.) are missing
-- assessment scores and feedback_cycle_id tagging. Filter them out in R
-- using first_event_at >= '2026-04-17' unless doing data-pipeline
-- validation analyses.
-- =====================================================================

-- Config: set the cutoff here so researchers can re-export post-freeze
-- without editing every CTE. The default matches the instrumentation
-- fix landing date.
WITH cfg AS (
    SELECT
        '2026-04-17'::timestamptz AS instrumentation_fixed_at,
        -- Optional cohort filters. Set to NULL to include everything.
        NULL::timestamptz AS session_start_after,
        NULL::timestamptz AS session_start_before
),

-- ---------------------------------------------------------------------
-- Normalise phase strings ("2" and "phase2" both used across WAL history)
-- ---------------------------------------------------------------------
normalised_events AS (
    SELECT
        w.*,
        CASE
            WHEN payload->>'phase' ~ '^phase[0-9]+$' THEN payload->>'phase'
            WHEN payload->>'phase' ~ '^[0-9]+$'     THEN 'phase' || (payload->>'phase')
            ELSE NULL
        END AS phase_canon,
        payload->>'component' AS component,
        payload->>'event_type' AS event_type,
        payload->>'feedback_cycle_id' AS feedback_cycle_id,
        payload->>'condition' AS condition,
        payload->>'coach_tone' AS coach_tone
    FROM write_ahead_log w
),

-- ---------------------------------------------------------------------
-- Core participant roster — one row per participant with condition +
-- coach tone MODE across all their events.
-- ---------------------------------------------------------------------
participant_roster AS (
    SELECT
        participant_id,
        MIN(client_timestamp) AS first_event_at,
        MAX(client_timestamp) AS last_event_at,
        -- condition: take the most-frequent non-null value
        MODE() WITHIN GROUP (ORDER BY condition) FILTER (WHERE condition IS NOT NULL)
            AS condition_mode,
        MODE() WITHIN GROUP (ORDER BY coach_tone) FILTER (WHERE coach_tone IS NOT NULL)
            AS coach_tone_mode,
        -- Distinct phases the participant reached
        COUNT(DISTINCT phase_canon) FILTER (WHERE phase_canon IS NOT NULL)
            AS distinct_phases_touched,
        COUNT(*) AS total_events
    FROM normalised_events
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Indicator 1 (behavioural): Revision frequency per phase
--   = count of feedback_delivered events per (participant, phase).
-- Summed across Phase 2/4/5 for the headline indicator; also split by phase.
-- ---------------------------------------------------------------------
revisions_per_phase AS (
    SELECT
        participant_id,
        phase_canon,
        COUNT(*) AS revision_cycles
    FROM normalised_events
    WHERE event_type = 'feedback_delivered'
      AND phase_canon IN ('phase2', 'phase4', 'phase5')
    GROUP BY participant_id, phase_canon
),
revisions_summary AS (
    SELECT
        participant_id,
        SUM(revision_cycles) AS total_revision_cycles,
        SUM(revision_cycles) FILTER (WHERE phase_canon = 'phase2') AS revisions_phase2,
        SUM(revision_cycles) FILTER (WHERE phase_canon = 'phase4') AS revisions_phase4,
        SUM(revision_cycles) FILTER (WHERE phase_canon = 'phase5') AS revisions_phase5
    FROM revisions_per_phase
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Indicator 2 (behavioural): Time-on-feedback
--   = seconds between feedback_delivered and the NEXT user-initiated
--     event (revision_started or next chat_message).
-- Uses LEAD() over time-ordered events per participant × phase.
-- ---------------------------------------------------------------------
feedback_events AS (
    SELECT
        participant_id,
        phase_canon,
        component,
        feedback_cycle_id,
        client_timestamp AS fb_at,
        LEAD(client_timestamp) OVER (
            PARTITION BY participant_id, phase_canon
            ORDER BY client_timestamp
        ) AS next_event_at
    FROM normalised_events
    WHERE phase_canon IN ('phase2', 'phase4', 'phase5')
      AND event_type IN (
          'feedback_delivered',
          'revision_started',
          'chat_message',
          'text_input',
          'final_submission'
      )
),
time_on_feedback AS (
    SELECT
        participant_id,
        EXTRACT(EPOCH FROM (next_event_at - fb_at)) AS sec_to_next
    FROM feedback_events
    WHERE next_event_at IS NOT NULL
),
time_on_feedback_summary AS (
    SELECT
        participant_id,
        -- Filter out extreme outliers (>10 min = left page); cap samples
        -- we include in the mean so it's a stable engagement signal.
        ROUND(
            (AVG(sec_to_next) FILTER (WHERE sec_to_next BETWEEN 0 AND 600))::numeric,
            2
        ) AS mean_sec_on_feedback,
        COUNT(*) FILTER (WHERE sec_to_next BETWEEN 0 AND 600)
            AS time_on_fb_samples
    FROM time_on_feedback
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Indicator 3 (behavioural): KC score improvement per phase
--   = max(overall_score) − min(overall_score) per (participant, phase).
-- Uses feedback_delivered payload which now contains the full evaluation.
-- ---------------------------------------------------------------------
kc_scores AS (
    SELECT
        participant_id,
        phase_canon,
        (payload->>'overall_score')::numeric AS overall_score,
        client_timestamp
    FROM normalised_events
    WHERE event_type = 'feedback_delivered'
      AND payload ? 'overall_score'
      AND phase_canon IN ('phase2', 'phase4', 'phase5')
),
kc_improvement_per_phase AS (
    SELECT
        participant_id,
        phase_canon,
        MIN(overall_score) AS first_score,
        MAX(overall_score) AS best_score,
        MAX(overall_score) - MIN(overall_score) AS delta
    FROM kc_scores
    GROUP BY participant_id, phase_canon
),
kc_improvement_summary AS (
    SELECT
        participant_id,
        ROUND(AVG(delta)::numeric, 2) AS mean_kc_score_delta,
        MAX(best_score) AS max_observed_score,
        MIN(first_score) AS min_first_score,
        SUM(delta) FILTER (WHERE phase_canon = 'phase2') AS kc_delta_phase2,
        SUM(delta) FILTER (WHERE phase_canon = 'phase4') AS kc_delta_phase4,
        SUM(delta) FILTER (WHERE phase_canon = 'phase5') AS kc_delta_phase5
    FROM kc_improvement_per_phase
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Indicator 4 (behavioural): Help-seeking — floating chatbot activations
--   Frequency: count of floating_chat_question events per participant
--   Depth: mean word_count of the user's questions (proxy for
--          engagement quality)
-- ---------------------------------------------------------------------
help_seeking AS (
    SELECT
        participant_id,
        COUNT(*) AS floating_questions,
        ROUND(
            AVG(
                array_length(
                    regexp_split_to_array(
                        trim(COALESCE(payload->>'content', '')),
                        '\s+'
                    ),
                    1
                )
            )::numeric,
            1
        ) AS mean_question_word_count
    FROM normalised_events
    WHERE payload->>'component' = 'floating_chatbot'
      AND payload->>'role' = 'user'
      AND COALESCE(payload->>'content', '') <> ''
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Tone preference: mode of solbot_coach_tone across events
-- ---------------------------------------------------------------------
tone_distribution AS (
    SELECT
        participant_id,
        COUNT(*) FILTER (WHERE coach_tone = 'warm') AS tone_warm_count,
        COUNT(*) FILTER (WHERE coach_tone = 'direct') AS tone_direct_count
    FROM normalised_events
    WHERE coach_tone IS NOT NULL
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Ch4 post-2026-04-17 additions — raw counts of new instrumentation
-- so the researcher can sanity-check that a given participant's data
-- was collected AFTER the instrumentation fix.
-- ---------------------------------------------------------------------
new_instrumentation_counts AS (
    SELECT
        participant_id,
        COUNT(*) FILTER (WHERE event_type = 'textarea_focused') AS textarea_focus_events,
        COUNT(*) FILTER (WHERE event_type = 'textarea_blurred') AS textarea_blur_events,
        COUNT(*) FILTER (WHERE event_type = 'textarea_paste')   AS textarea_paste_events,
        COUNT(*) FILTER (WHERE event_type = 'textarea_copy')    AS textarea_copy_events,
        COUNT(*) FILTER (WHERE event_type = 'video_speed_change')       AS video_speed_changes,
        COUNT(*) FILTER (WHERE event_type = 'video_fullscreen_entered'
                           OR event_type = 'video_fullscreen_exited')   AS video_fullscreen_toggles,
        COUNT(*) FILTER (WHERE event_type = 'video_volume_change')      AS video_volume_changes,
        COUNT(*) FILTER (WHERE event_type = 'video_rewind')             AS video_rewinds,
        COUNT(*) FILTER (WHERE event_type = 'video_fast_forward')       AS video_fast_forwards,
        COUNT(*) FILTER (
            WHERE event_type = 'video_rewind'
              AND payload->>'seek_type' IN ('rewind_large')
        ) AS video_large_rewinds,
        COUNT(*) FILTER (
            WHERE event_type = 'video_fast_forward'
              AND payload->>'seek_type' = 'jump_forward'
        ) AS video_forward_jumps,
        -- The paste-of-feedback signal — any paste that happens AFTER a
        -- feedback_delivered on the SAME cycle is a direct-adoption indicator.
        -- This is a first-approximation; the real Indicator 6 composite
        -- lives in Python with semantic similarity. Still useful as a
        -- sanity check.
        COUNT(*) FILTER (
            WHERE event_type = 'textarea_paste'
              AND feedback_cycle_id IS NOT NULL
        ) AS pastes_in_active_cycle,
        COUNT(*) FILTER (WHERE event_type = 'feedback_delivered'
                           AND payload ? 'feedback_text'
                           AND COALESCE(payload->>'feedback_text', '') <> ''
        ) AS feedback_deliveries_with_text
    FROM normalised_events
    GROUP BY participant_id
),

-- ---------------------------------------------------------------------
-- Phase completion flags (derived from final_submission events)
-- ---------------------------------------------------------------------
phase_completions AS (
    SELECT
        participant_id,
        BOOL_OR(phase_canon = 'phase2') AS completed_phase2,
        BOOL_OR(phase_canon = 'phase4') AS completed_phase4,
        BOOL_OR(phase_canon = 'phase5') AS completed_phase5,
        BOOL_OR(phase_canon = 'phase6') AS completed_phase6
    FROM normalised_events
    WHERE event_type = 'final_submission'
    GROUP BY participant_id
)

-- ---------------------------------------------------------------------
-- FINAL MASTER ROW — one per participant
-- ---------------------------------------------------------------------
SELECT
    pr.participant_id,
    pr.first_event_at,
    pr.last_event_at,
    -- Experimental condition + design features
    pr.condition_mode                                   AS condition,
    pr.coach_tone_mode                                  AS coach_tone_mode,
    COALESCE(td.tone_warm_count, 0)                     AS tone_warm_count,
    COALESCE(td.tone_direct_count, 0)                   AS tone_direct_count,
    -- Participant progress
    pr.distinct_phases_touched,
    pr.total_events,
    COALESCE(pc.completed_phase2, FALSE)                AS completed_phase2,
    COALESCE(pc.completed_phase4, FALSE)                AS completed_phase4,
    COALESCE(pc.completed_phase5, FALSE)                AS completed_phase5,
    COALESCE(pc.completed_phase6, FALSE)                AS completed_phase6,

    -- =========================================================
    -- Ch4 Engagement Indicators (Table 4.2 of proposal)
    -- Indicators 1–4 are direct SQL; 5–6 require Python text-analytic
    -- pipeline against the R1/R2/feedback triples available via the
    -- feedback_cycle_id join (see research_ch4_revision_triples.sql,
    -- to be written).
    -- =========================================================
    -- Ind. 1: revision frequency
    COALESCE(rs.total_revision_cycles, 0)               AS ind1_revision_cycles_total,
    COALESCE(rs.revisions_phase2, 0)                    AS ind1_revisions_phase2,
    COALESCE(rs.revisions_phase4, 0)                    AS ind1_revisions_phase4,
    COALESCE(rs.revisions_phase5, 0)                    AS ind1_revisions_phase5,
    -- Ind. 2: time on feedback (seconds, mean per participant)
    tof.mean_sec_on_feedback                            AS ind2_mean_sec_on_feedback,
    COALESCE(tof.time_on_fb_samples, 0)                 AS ind2_time_on_fb_samples,
    -- Ind. 3: KC score improvement
    kis.mean_kc_score_delta                             AS ind3_mean_kc_score_delta,
    kis.max_observed_score                              AS ind3_max_observed_score,
    kis.min_first_score                                 AS ind3_min_first_score,
    COALESCE(kis.kc_delta_phase2, 0)                    AS ind3_kc_delta_phase2,
    COALESCE(kis.kc_delta_phase4, 0)                    AS ind3_kc_delta_phase4,
    COALESCE(kis.kc_delta_phase5, 0)                    AS ind3_kc_delta_phase5,
    -- Ind. 4: help-seeking (frequency + depth)
    COALESCE(hs.floating_questions, 0)                  AS ind4_help_seeking_count,
    hs.mean_question_word_count                         AS ind4_mean_question_word_count,

    -- =========================================================
    -- New instrumentation counts (Ch4 additions, 2026-04-17)
    -- Use these to sanity-check that a participant's data was
    -- collected under the post-fix instrumentation. Zero across
    -- all columns = almost certainly pre-fix data; exclude.
    -- =========================================================
    COALESCE(nic.textarea_focus_events, 0)              AS textarea_focus_events,
    COALESCE(nic.textarea_blur_events, 0)               AS textarea_blur_events,
    COALESCE(nic.textarea_paste_events, 0)              AS textarea_paste_events,
    COALESCE(nic.textarea_copy_events, 0)               AS textarea_copy_events,
    COALESCE(nic.pastes_in_active_cycle, 0)             AS pastes_tagged_to_cycle,
    COALESCE(nic.feedback_deliveries_with_text, 0)      AS feedback_events_with_text,
    COALESCE(nic.video_speed_changes, 0)                AS video_speed_changes,
    COALESCE(nic.video_fullscreen_toggles, 0)           AS video_fullscreen_toggles,
    COALESCE(nic.video_volume_changes, 0)               AS video_volume_changes,
    COALESCE(nic.video_rewinds, 0)                      AS video_rewinds,
    COALESCE(nic.video_fast_forwards, 0)                AS video_fast_forwards,
    COALESCE(nic.video_large_rewinds, 0)                AS video_large_rewinds,
    COALESCE(nic.video_forward_jumps, 0)                AS video_forward_jumps,

    -- Data-quality flag: post-instrumentation-fix?
    (pr.first_event_at >= (SELECT instrumentation_fixed_at FROM cfg))
                                                        AS post_instrumentation_fix
FROM participant_roster pr
LEFT JOIN revisions_summary       rs  USING (participant_id)
LEFT JOIN time_on_feedback_summary tof USING (participant_id)
LEFT JOIN kc_improvement_summary   kis USING (participant_id)
LEFT JOIN help_seeking             hs  USING (participant_id)
LEFT JOIN tone_distribution        td  USING (participant_id)
LEFT JOIN new_instrumentation_counts nic USING (participant_id)
LEFT JOIN phase_completions        pc  USING (participant_id)
CROSS JOIN cfg
WHERE (cfg.session_start_after  IS NULL OR pr.first_event_at >= cfg.session_start_after)
  AND (cfg.session_start_before IS NULL OR pr.first_event_at <  cfg.session_start_before)
ORDER BY pr.first_event_at DESC;


-- =====================================================================
-- COMPANION QUERY: R1/R2/feedback triples for the Python text-analytic
-- pipeline (Indicators 5 & 6). Output: one row per (participant, phase,
-- feedback_cycle, question_id) with R1 text, feedback text, R2 text.
-- =====================================================================
-- NOTE: Only works for POST-2026-04-17 sessions (needs feedback_cycle_id
-- and feedback_text to be populated). Filter via
-- post_instrumentation_fix = TRUE on the master table.
-- =====================================================================
--
-- SELECT
--     w.participant_id,
--     w.payload->>'phase'            AS phase,
--     w.payload->>'component'        AS component,
--     w.payload->>'feedback_cycle_id' AS cycle_id,
--     w.payload->>'field_name'       AS question_id,
--     /* R1 = earliest text_input for this cycle+question */
--     (ARRAY_AGG(
--         w.payload->>'input_value'
--         ORDER BY w.client_timestamp ASC
--     ) FILTER (WHERE w.payload->>'event_type' = 'text_input')
--     )[1] AS r1_text,
--     /* feedback text for this cycle (same cycle_id) */
--     MAX(w.payload->>'feedback_text') FILTER (
--         WHERE w.payload->>'event_type' = 'feedback_delivered'
--     ) AS feedback_text,
--     /* R2 = the FOLLOWING cycle's earliest text_input for the SAME
--        question_id — needs a second CTE joining on question_id +
--        next cycle id by timestamp. Left as an exercise for the
--        Python pipeline: it's easier to pull all text_input +
--        feedback_delivered rows and reconstruct there. */
--     COUNT(*) FILTER (WHERE w.payload->>'event_type' = 'text_input')      AS r1_text_input_count,
--     COUNT(*) FILTER (WHERE w.payload->>'event_type' = 'feedback_delivered') AS feedback_count
-- FROM write_ahead_log w
-- WHERE w.payload ? 'feedback_cycle_id'
--   AND w.payload->>'feedback_cycle_id' <> ''
--   AND w.client_timestamp >= '2026-04-17'::timestamptz
-- GROUP BY
--     w.participant_id,
--     w.payload->>'phase',
--     w.payload->>'component',
--     w.payload->>'feedback_cycle_id',
--     w.payload->>'field_name'
-- ORDER BY w.participant_id, w.payload->>'feedback_cycle_id';
