-- Complete setup for SoLBot database
-- This script creates all necessary tables

-------------------
-- Base tables
-------------------

-- Create users table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create user_data table for analytics
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  phase TEXT NOT NULL,
  component TEXT,
  agent_type TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender_type TEXT NOT NULL, -- 'user' or 'system'
  content TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-------------------
-- Add indexes
-------------------

-- Add indexes to user_data
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_type ON user_data(data_type);
CREATE INDEX IF NOT EXISTS idx_user_data_created_at ON user_data(created_at);

-- Add indexes to conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phase ON conversations(phase);

-- Add indexes to messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-------------------
-- Enable RLS
-------------------

-- Enable RLS on user_data with public access for testing
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on user_data
CREATE POLICY "Allow all operations for all users on user_data" 
ON user_data FOR ALL
USING (true) 
WITH CHECK (true);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on conversations
CREATE POLICY "Allow all operations for all users on conversations" 
ON conversations FOR ALL
USING (true) 
WITH CHECK (true);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations on messages
CREATE POLICY "Allow all operations for all users on messages" 
ON messages FOR ALL
USING (true) 
WITH CHECK (true);

-------------------
-- Insert test data
-------------------

-- Insert a test user
INSERT INTO users (email)
VALUES ('test@example.com')
ON CONFLICT DO NOTHING;

-- Insert test user_data
INSERT INTO user_data (user_id, data_type, value, metadata)
VALUES 
('test-user', 'test-event', 'Test value', jsonb_build_object('source', 'setup script')),
('anonymous', 'page_view', '/landing', jsonb_build_object('timestamp', now()));

-- Verify data was inserted
SELECT 'Verification of data:' as message;
SELECT 'user_data table:' as table_name, count(*) as record_count FROM user_data; 