-- SoLBot Schema Fixes
-- Migration: 005_schema_fixes

-- Create the user_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_type ON user_data(data_type);

-- Fix llm_interactions table if it exists
DO $$
BEGIN
  -- Check if cache_hit column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'llm_interactions' AND column_name = 'cache_hit'
  ) THEN
    -- Add the missing cache_hit column
    ALTER TABLE llm_interactions ADD COLUMN cache_hit BOOLEAN DEFAULT FALSE;
  END IF;

  -- Check if column requirements have changed
  BEGIN
    -- Make non-required columns nullable
    ALTER TABLE llm_interactions 
      ALTER COLUMN message_id DROP NOT NULL,
      ALTER COLUMN conversation_id DROP NOT NULL,
      ALTER COLUMN phase DROP NOT NULL,
      ALTER COLUMN system_prompt DROP NOT NULL,
      ALTER COLUMN user_message DROP NOT NULL,
      ALTER COLUMN raw_llm_response DROP NOT NULL,
      ALTER COLUMN model_name DROP NOT NULL;
  EXCEPTION
    WHEN undefined_column THEN
      -- Some columns don't exist, which is fine
      NULL;
  END;
END;
$$;

-- Create simplified llm_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS llm_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cache_hit BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_llm_interactions_user_id ON llm_interactions(user_id);

-- Create function to save user data
CREATE OR REPLACE FUNCTION save_user_data(
  p_user_id UUID,
  p_data_type TEXT,
  p_value TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO user_data (user_id, data_type, value, metadata)
  VALUES (p_user_id, p_data_type, p_value, p_metadata)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql; 