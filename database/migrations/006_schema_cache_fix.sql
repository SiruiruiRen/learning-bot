-- SoLBot Schema Cache Fix
-- Migration: 006_schema_cache_fix

-- Drop any existing save_user_data functions to resolve overloading issue
DROP FUNCTION IF EXISTS save_user_data(text, text, text, jsonb);
DROP FUNCTION IF EXISTS save_user_data(uuid, text, text, jsonb);

-- Create a single save_user_data function with clearer parameter types
CREATE OR REPLACE FUNCTION save_user_data_v2(
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

-- Refresh the PostgREST schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- This command performs a metadata refresh in Supabase's PostgREST instance
SELECT pg_notify('pgrst', 'reload config');

-- Verify that the user_data table exists with correct columns
DO $$
BEGIN
  -- Check if user_data table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_data'
  ) THEN
    -- Create user_data table
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
    -- Check if metadata column exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_data' AND column_name = 'metadata'
    ) THEN
      -- Add metadata column
      ALTER TABLE user_data ADD COLUMN metadata JSONB;
    END IF;
  END IF;
END;
$$; 