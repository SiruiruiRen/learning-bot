-- ================================================================
-- MIGRATION: Add test_type column to quiz_session_summary
-- Run this ONCE in Supabase SQL Editor to fix the missing column.
-- ================================================================

-- 1. Add test_type column (if not already present)
ALTER TABLE quiz_session_summary
  ADD COLUMN IF NOT EXISTS test_type TEXT NOT NULL DEFAULT 'post';

-- 2. Drop old index if it conflicts (safe to ignore errors)
-- The upsert uses onConflict: 'session_id,phase,test_type'
-- so we need a unique constraint on those three columns.
DO $$
BEGIN
  -- Create unique constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quiz_session_summary_session_id_phase_test_type_key'
  ) THEN
    ALTER TABLE quiz_session_summary
      ADD CONSTRAINT quiz_session_summary_session_id_phase_test_type_key
      UNIQUE (session_id, phase, test_type);
  END IF;
END $$;

-- 3. Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'quiz_session_summary'
ORDER BY ordinal_position;
