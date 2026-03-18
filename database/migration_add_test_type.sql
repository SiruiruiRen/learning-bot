-- ================================================================
-- MIGRATION: Run this ONCE in Supabase SQL Editor
-- Adds: quiz test_type column, is_test flag, email unique index,
--        condition counter function
-- ================================================================

-- ============ 1. quiz_session_summary: add test_type ============
ALTER TABLE quiz_session_summary
  ADD COLUMN IF NOT EXISTS test_type TEXT NOT NULL DEFAULT 'post';

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

-- ============ 2. users: add is_test flag ============
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- ============ 3. users: unique email index ============
-- Prevents duplicate user records for the same email.
-- Partial index: only applies where email is not null.
-- If you have existing duplicates, clean them up first (see below).
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email) WHERE email IS NOT NULL;

-- ============ 4. Mark existing test data ============
-- Adjust these patterns to match your team's test emails.
UPDATE users SET is_test = TRUE
WHERE email ILIKE '%test%'
   OR email ILIKE '%demo%'
   OR email ILIKE '%example.com%';

-- ============ 5. Fix duplicate emails (if any) ============
-- This keeps the LATEST user record per email and reassigns
-- all sessions/data from older duplicates to it.
-- Only run if step 3 fails due to duplicates.
--
-- DO $$
-- DECLARE
--   dup RECORD;
--   keep_id UUID;
-- BEGIN
--   FOR dup IN
--     SELECT email FROM users
--     WHERE email IS NOT NULL
--     GROUP BY email HAVING COUNT(*) > 1
--   LOOP
--     SELECT id INTO keep_id FROM users
--       WHERE email = dup.email ORDER BY created_at DESC LIMIT 1;
--     UPDATE sessions SET user_id = keep_id
--       WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
--     UPDATE content_interaction_logs SET user_id = keep_id
--       WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
--     UPDATE assessments SET user_id = keep_id
--       WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
--     UPDATE user_data SET user_id = keep_id
--       WHERE user_id IN (SELECT id FROM users WHERE email = dup.email AND id != keep_id);
--     DELETE FROM users WHERE email = dup.email AND id != keep_id;
--   END LOOP;
-- END $$;

-- ============ 6. Condition counting function ============
-- Used by backend for 2:1 quota-based allocation.
-- Only counts non-test users.
CREATE OR REPLACE FUNCTION count_condition(cond TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::integer
  FROM sessions s
  JOIN users u ON s.user_id = u.id
  WHERE s.metadata->>'condition' = cond
    AND COALESCE(u.is_test, FALSE) = FALSE;
$$ LANGUAGE sql STABLE;

-- ============ 7. Verify ============
SELECT 'users' AS tbl, column_name, data_type
FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_test'
UNION ALL
SELECT 'quiz_session_summary', column_name, data_type
FROM information_schema.columns WHERE table_name = 'quiz_session_summary' AND column_name = 'test_type';
