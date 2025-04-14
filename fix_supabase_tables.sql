-- Drop existing table if it exists
DROP TABLE IF EXISTS user_data;

-- Create user_data table with TEXT user_id to be more flexible
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_type ON user_data(data_type);

-- Enable RLS but make it public by default for testing
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations for all users" 
ON user_data 
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Insert a test record
INSERT INTO user_data (user_id, data_type, value, metadata)
VALUES ('test-user', 'test-event', 'Test value', 
        jsonb_build_object('source', 'manual SQL', 'timestamp', now()));

-- Verify the record was inserted
SELECT * FROM user_data; 