-- SoLBot Learning Platform Initial Schema Migration
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table to store authentication and profile information
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  education_level TEXT,
  background TEXT,
  preferences JSONB,
  is_active BOOLEAN DEFAULT TRUE
);

-- Courses that users can select for learning
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Learning phases define the SRL structure
CREATE TABLE learning_phases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  sequence_order INTEGER NOT NULL,
  estimated_duration INTEGER -- in minutes
);

-- User course enrollments
CREATE TABLE user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  current_phase_id UUID REFERENCES learning_phases(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Learning resources (videos, texts, etc.)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES learning_phases(id),
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- video, text, quiz, etc.
  content TEXT,
  url TEXT,
  metadata JSONB
);

-- Rubrics for assessment
CREATE TABLE rubrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_id UUID REFERENCES learning_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL,
  criteria JSONB NOT NULL
);

-- Student progress through phases
CREATE TABLE phase_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_course_id UUID REFERENCES user_courses(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES learning_phases(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_scaffolding_level INTEGER DEFAULT 1, -- 1: High, 2: Medium, 3: Low
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, paused
  UNIQUE(user_course_id, phase_id)
);

-- Conversation sessions with AI agents
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase_progress_id UUID REFERENCES phase_progress(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- manager, specialist, etc.
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  summary TEXT,
  context JSONB
);

-- Individual messages within conversations
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- user, agent
  agent_type TEXT, -- Only for agent messages
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Assessment scores from rubrics
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_progress_id UUID REFERENCES phase_progress(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  feedback TEXT,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessed_by TEXT -- agent ID or type that performed assessment
);

-- User goals set during the goal setting phase
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_course_id UUID REFERENCES user_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL, -- long-term, SMART, IF-THEN
  target_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active', -- active, completed, abandoned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress monitoring records
CREATE TABLE monitoring_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_course_id UUID REFERENCES user_courses(id) ON DELETE CASCADE,
  record_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_metrics JSONB,
  self_reflection TEXT,
  adaptation_strategy TEXT
);

-- User activity tracking
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- login, message, phase_completion, etc.
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_phase_progress_user_course_id ON phase_progress(user_course_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_assessments_phase_progress_id ON assessments(phase_progress_id); 