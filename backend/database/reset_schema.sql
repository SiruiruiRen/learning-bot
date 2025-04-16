-- Drop all existing tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS scaffolding_levels CASCADE;
DROP TABLE IF EXISTS llm_interactions CASCADE;
DROP TABLE IF EXISTS user_data CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  phase TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_type TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Create assessments table
CREATE TABLE assessments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  criteria TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Create scaffolding_levels table
CREATE TABLE scaffolding_levels (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  phase TEXT NOT NULL,
  component TEXT,
  level INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create llm_interactions table
CREATE TABLE llm_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  model TEXT NOT NULL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Create user_data table
CREATE TABLE user_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  data_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_scaffolding_levels_user_id ON scaffolding_levels(user_id);
CREATE INDEX idx_llm_interactions_user_id ON llm_interactions(user_id);
CREATE INDEX idx_user_data_user_id ON user_data(user_id); 