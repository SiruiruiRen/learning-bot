-- ================================================================
-- SAFE MIGRATION: Run this in Supabase SQL Editor
-- Execute the ENTIRE script at once (copy-paste all).
-- ================================================================

-- ============ STEP 1: Add new columns ============
ALTER TABLE quiz_session_summary
  ADD COLUMN IF NOT EXISTS test_type TEXT NOT NULL DEFAULT 'post';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- ============ STEP 2: Quiz unique constraint ============
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_session_summary_session_id_phase_test_type_key'
  ) THEN
    ALTER TABLE quiz_session_summary
      ADD CONSTRAINT quiz_session_summary_session_id_phase_test_type_key
      UNIQUE (session_id, phase, test_type);
  END IF;
END $$;

-- ============ STEP 3: Fix duplicate emails FIRST ============
-- Keeps the LATEST user record per email, moves all data to it.
DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
BEGIN
  FOR dup IN
    SELECT email FROM users
    WHERE email IS NOT NULL
    GROUP BY email HAVING COUNT(*) > 1
  LOOP
    SELECT id INTO keep_id FROM users
      WHERE email = dup.email ORDER BY created_at DESC LIMIT 1;

    -- Reassign all foreign key references to the kept user
    UPDATE sessions SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE content_interaction_logs SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE assessments SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE user_data SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE user_chat_analytics SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE user_video_analytics SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE phase_completion_analytics SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE user_revision_tracking SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE quiz_session_summary SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
    UPDATE knowledge_check_attempts SET user_id = keep_id
      WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);

    -- Delete the duplicate user records
    DELETE FROM users WHERE email = dup.email AND id != keep_id;

    RAISE NOTICE 'Merged duplicates for email: %, kept user_id: %', dup.email, keep_id;
  END LOOP;
END $$;

-- ============ STEP 4: Now safe to create unique index ============
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE email IS NOT NULL;

-- ============ STEP 5: Mark test accounts ============
UPDATE users SET is_test = TRUE
WHERE email ILIKE '%test%'
   OR email ILIKE '%demo%'
   OR email ILIKE '%example.com%';

-- ============ STEP 6: Set condition for existing sessions ============
-- All existing users were bot group (pre-randomization era).
UPDATE sessions
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"condition": "bot"}'::jsonb
WHERE metadata->>'condition' IS NULL;

-- ============ STEP 7: Condition counting function ============
CREATE OR REPLACE FUNCTION count_condition(cond TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::integer
  FROM sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.metadata->>'condition' = cond
    AND COALESCE(u.is_test, FALSE) = FALSE;
$$ LANGUAGE sql STABLE;

-- ============ STEP 8: Verify everything ============
SELECT '--- COLUMNS ADDED ---' AS status;

SELECT 'users.is_test' AS what, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'is_test'
UNION ALL
SELECT 'quiz.test_type', column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quiz_session_summary' AND column_name = 'test_type';

SELECT '--- USER SUMMARY ---' AS status;

SELECT
  COUNT(*) AS total_users,
  COUNT(*) FILTER (WHERE is_test) AS test_users,
  COUNT(*) FILTER (WHERE NOT COALESCE(is_test, FALSE)) AS real_users
FROM users;

SELECT '--- CONDITION COUNTS ---' AS status;

SELECT
  COALESCE(metadata->>'condition', 'none') AS condition,
  COUNT(*) AS session_count
FROM sessions
GROUP BY 1;

SELECT '--- DUPLICATE CHECK ---' AS status;

SELECT email, COUNT(*) AS cnt
FROM users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;
