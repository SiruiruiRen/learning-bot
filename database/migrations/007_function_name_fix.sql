-- SoLBot Function Name Fix
-- Migration: 007_function_name_fix

-- Drop the save_user_data_v2 function if it exists
DROP FUNCTION IF EXISTS save_user_data_v2(uuid, text, text, jsonb);

-- Create save_user_data function (matches what the application is calling)
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

-- Explicitly refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- Verify that the user_data table has all needed columns
DO $$
BEGIN
  -- Check if user_data table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_data'
  ) THEN
    -- Create user_data table if it doesn't exist
    CREATE TABLE user_data (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      data_type TEXT NOT NULL,
      value TEXT,
      metadata JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Add indexes
    CREATE INDEX idx_user_data_user_id ON user_data(user_id);
    CREATE INDEX idx_user_data_type ON user_data(data_type);
  ELSE
    -- Make sure all required columns exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_data' AND column_name = 'value'
    ) THEN
      -- Add value column if missing
      ALTER TABLE user_data ADD COLUMN value TEXT;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_data' AND column_name = 'metadata'
    ) THEN
      -- Add metadata column if missing
      ALTER TABLE user_data ADD COLUMN metadata JSONB;
    END IF;
  END IF;
END;
$$;

-- Verify users table has required columns
DO $$
BEGIN
  -- Check if email column exists in users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email'
  ) THEN
    -- Add email column if missing
    ALTER TABLE users ADD COLUMN email TEXT;
  END IF;
END;
$$; 