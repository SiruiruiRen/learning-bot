-- SoLBot User Data Collection
-- Migration: 004_user_data

-- Create a simple table for collecting user data
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

-- Create a function to save user data
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