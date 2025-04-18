-- Fix for llm_interactions table - add missing columns

-- Add missing columns to llm_interactions table if they don't exist
DO $$
BEGIN
  -- Check if input_tokens column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'input_tokens'
  ) THEN
    -- Add input_tokens column
    ALTER TABLE llm_interactions ADD COLUMN input_tokens INTEGER;
  END IF;

  -- Check if output_tokens column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'output_tokens'
  ) THEN
    -- Add output_tokens column
    ALTER TABLE llm_interactions ADD COLUMN output_tokens INTEGER;
  END IF;

  -- Check if duration_ms column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'duration_ms'
  ) THEN
    -- Add duration_ms column
    ALTER TABLE llm_interactions ADD COLUMN duration_ms INTEGER;
  END IF;

  -- Check if prompt column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'prompt'
  ) THEN
    -- Add prompt column
    ALTER TABLE llm_interactions ADD COLUMN prompt TEXT;
  END IF;

  -- Check if response column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'response'
  ) THEN
    -- Add response column
    ALTER TABLE llm_interactions ADD COLUMN response TEXT;
  END IF;

  -- Check if conversation_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'conversation_id'
  ) THEN
    -- Add conversation_id column
    ALTER TABLE llm_interactions ADD COLUMN conversation_id UUID REFERENCES conversations(id);
  END IF;
END;
$$;

-- Explicitly refresh the schema cache to make sure PostgREST picks up the changes
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config'); 