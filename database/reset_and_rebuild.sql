-- ================================================================
-- SoLBot Database: COMPLETE RESET & REBUILD
-- Run this in Supabase SQL Editor to start fresh
-- WARNING: This DROPS all existing tables and data!
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: DROP EVERYTHING (clean slate)
-- ============================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS user_journey_complete CASCADE;
DROP VIEW IF EXISTS next_button_analysis CASCADE;
DROP VIEW IF EXISTS chat_with_scores CASCADE;
DROP VIEW IF EXISTS video_watching_summary CASCADE;
DROP VIEW IF EXISTS quiz_performance_summary CASCADE;
DROP VIEW IF EXISTS assessment_report CASCADE;

-- Drop all tables (in dependency order)
DROP TABLE IF EXISTS feedback_style_views CASCADE;
DROP TABLE IF EXISTS criterion_scores CASCADE;
DROP TABLE IF EXISTS scaffolding_history CASCADE;
DROP TABLE IF EXISTS rubric_criteria CASCADE;
DROP TABLE IF EXISTS phase_completion_analytics CASCADE;
DROP TABLE IF EXISTS quiz_session_summary CASCADE;
DROP TABLE IF EXISTS knowledge_check_attempts CASCADE;
DROP TABLE IF EXISTS user_chat_analytics CASCADE;
DROP TABLE IF EXISTS llm_interactions CASCADE;
DROP TABLE IF EXISTS video_interaction_events CASCADE;
DROP TABLE IF EXISTS user_video_analytics CASCADE;
DROP TABLE IF EXISTS click_events CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS user_inputs CASCADE;
DROP TABLE IF EXISTS navigation_events CASCADE;
DROP TABLE IF EXISTS content_interaction_logs CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_data CASCADE;
DROP TABLE IF EXISTS user_revision_tracking CASCADE;
DROP TABLE IF EXISTS monitoring_records CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS phase_progress CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS user_courses CASCADE;
DROP TABLE IF EXISTS rubrics CASCADE;
DROP TABLE IF EXISTS learning_phases CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_scaffolding_level(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_scaffolding_after_assessment() CASCADE;
DROP FUNCTION IF EXISTS save_user_data(UUID, TEXT, TEXT, JSONB) CASCADE;

-- ============================================
-- STEP 2: CREATE CORE TABLES
-- (Matches db.py: create_user_and_session, log_message, log_assessment, get_session_by_id, get_user_by_id)
-- ============================================

-- Users table
-- Used by: db.create_user_and_session (insert), db.get_user_by_id (select)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  name TEXT,
  profile_data JSONB,  -- stores coach_tone, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
-- Used by: db.create_user_and_session (insert), db.get_session_by_id (select)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Messages table
-- Used by: db.log_message (insert), db.get_messages_for_session (select)
-- Fields MUST match db.py log_message: id, session_id, role, content, phase, component, metadata
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  conversation_id UUID,  -- optional, for backward compatibility
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  phase TEXT,
  component TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_phase ON messages(phase);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Assessments table
-- Used by: db.log_assessment (insert)
-- Fields MUST match db.py log_assessment: id, session_id, user_id, submission_message_id,
--   feedback_message_id, phase, component, attempt_number, overall_score, lowest_category,
--   scaffolding_level, rationale, full_evaluation, evaluation_method, feedback_style,
--   evaluation_time_ms, feedback_time_ms
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submission_message_id UUID REFERENCES messages(id),
  feedback_message_id UUID REFERENCES messages(id),
  phase TEXT NOT NULL,
  component TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  overall_score REAL,
  lowest_category TEXT,        -- LOW/MEDIUM/HIGH
  scaffolding_level TEXT,      -- Template + example / Targeted suggestions + Template / Reflection questions
  rationale TEXT,
  full_evaluation TEXT,        -- Full evaluation JSON as text
  evaluation_method TEXT,      -- single_prompt / chain_prompt
  feedback_style TEXT,         -- warm / direct
  evaluation_time_ms INTEGER,
  feedback_time_ms INTEGER,
  evaluation JSONB,            -- Detailed scoring breakdown (for views)
  feedback_content TEXT,       -- Full feedback text (for views)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessments_session_id ON assessments(session_id);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_phase ON assessments(phase);

-- User data table
-- Used by: user-data API endpoint
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_type ON user_data(data_type);

-- ============================================
-- STEP 3: ANALYTICS TABLES
-- (Used by frontend event tracking)
-- ============================================

-- Content Interaction Logs
CREATE TABLE content_interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  content_type TEXT NOT NULL,
  phase TEXT,
  component TEXT,
  interaction_data JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sequence_number INTEGER
);

CREATE INDEX idx_content_logs_session_id ON content_interaction_logs(session_id);
CREATE INDEX idx_content_logs_timestamp ON content_interaction_logs(timestamp);
CREATE INDEX idx_content_logs_type ON content_interaction_logs(interaction_type);

-- Navigation Events
CREATE TABLE navigation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('next_button', 'previous_button', 'phase_transition', 'page_view', 'page_exit')),
  from_path TEXT,
  to_path TEXT,
  from_phase TEXT,
  to_phase TEXT,
  button_text TEXT,
  button_id TEXT,
  time_on_page_seconds INTEGER,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_nav_session_id ON navigation_events(session_id);
CREATE INDEX idx_nav_event_type ON navigation_events(event_type);

-- User Inputs
CREATE TABLE user_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL,
  field_name TEXT,
  input_value TEXT NOT NULL,
  phase TEXT,
  component TEXT,
  is_submission BOOLEAN DEFAULT FALSE,
  attempt_number INTEGER DEFAULT 1,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inputs_session_id ON user_inputs(session_id);
CREATE INDEX idx_inputs_phase ON user_inputs(phase);

-- Chat Conversations
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  component TEXT NOT NULL,
  conversation_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversation_end_time TIMESTAMP WITH TIME ZONE,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  bot_messages INTEGER DEFAULT 0,
  has_assessment BOOLEAN DEFAULT FALSE,
  assessment_score REAL,
  assessment_feedback TEXT,
  evaluation_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_conv_session_id ON chat_conversations(session_id);
CREATE INDEX idx_chat_conv_phase ON chat_conversations(phase);

-- Click Events
CREATE TABLE click_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  click_type TEXT NOT NULL,
  element_tag TEXT,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  button_text TEXT,
  x_position INTEGER,
  y_position INTEGER,
  pathname TEXT,
  phase TEXT,
  component TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clicks_session_id ON click_events(session_id);
CREATE INDEX idx_clicks_type ON click_events(click_type);

-- Video Analytics
CREATE TABLE user_video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  video_name TEXT NOT NULL,
  video_src TEXT,
  total_duration_seconds INTEGER,
  watched_duration_seconds INTEGER DEFAULT 0,
  completion_percentage REAL DEFAULT 0,
  play_count INTEGER DEFAULT 1,
  pause_count INTEGER DEFAULT 0,
  rewind_count INTEGER DEFAULT 0,
  fast_forward_count INTEGER DEFAULT 0,
  seek_count INTEGER DEFAULT 0,
  watch_patterns JSONB DEFAULT '[]'::jsonb,
  watch_segments JSONB DEFAULT '[]'::jsonb,
  skipped_segments JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  first_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_position REAL DEFAULT 0,
  engagement_score REAL,
  UNIQUE(session_id, video_name)
);

CREATE INDEX idx_video_analytics_session_id ON user_video_analytics(session_id);
CREATE INDEX idx_video_analytics_phase ON user_video_analytics(phase);

-- Video Interaction Events
CREATE TABLE video_interaction_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  video_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'pause', 'seek', 'rewind', 'fast_forward', 'progress_milestone', 'loaded', 'ended', 'error')),
  playback_position REAL,
  total_watched_seconds REAL,
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_video_events_session_id ON video_interaction_events(session_id);
CREATE INDEX idx_video_events_type ON video_interaction_events(event_type);

-- LLM Interactions
CREATE TABLE llm_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  conversation_id UUID,
  message_id UUID REFERENCES messages(id),
  phase TEXT,
  component TEXT,
  system_prompt TEXT,
  user_message TEXT,
  raw_llm_response TEXT,
  processed_response TEXT,
  model_name TEXT,
  temperature REAL,
  max_tokens INTEGER,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  request_timestamp TIMESTAMP WITH TIME ZONE,
  response_timestamp TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_llm_interactions_session_id ON llm_interactions(session_id);

-- User Chat Analytics
CREATE TABLE user_chat_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT,
  component TEXT,
  chat_start_time TIMESTAMP WITH TIME ZONE,
  chat_end_time TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  user_message_count INTEGER DEFAULT 0,
  bot_message_count INTEGER DEFAULT 0,
  average_response_time_seconds REAL,
  longest_pause_seconds INTEGER,
  typing_patterns JSONB DEFAULT '[]'::jsonb,
  engagement_score REAL,
  completion_quality TEXT CHECK (completion_quality IN ('incomplete', 'basic', 'thorough', 'excellent')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_analytics_session_id ON user_chat_analytics(session_id);

-- Knowledge Check Attempts
CREATE TABLE knowledge_check_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  question_id TEXT,
  question_text TEXT NOT NULL,
  question_type TEXT,
  attempt_number INTEGER DEFAULT 1,
  selected_answer TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  time_to_answer_seconds INTEGER,
  time_to_first_interaction_seconds INTEGER,
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  help_used BOOLEAN DEFAULT FALSE,
  answer_changed BOOLEAN DEFAULT FALSE,
  answer_changes JSONB DEFAULT '[]'::jsonb,
  thinking_time_seconds INTEGER,
  options_shown JSONB,
  explanation_viewed BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_check_session_id ON knowledge_check_attempts(session_id);
CREATE INDEX idx_knowledge_check_phase ON knowledge_check_attempts(phase);

-- Quiz Session Summary
CREATE TABLE quiz_session_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  accuracy_percentage REAL,
  average_time_per_question_seconds REAL,
  total_time_seconds INTEGER,
  first_attempt_accuracy REAL,
  retry_accuracy REAL,
  questions_answered JSONB DEFAULT '[]'::jsonb,
  quiz_start_time TIMESTAMP WITH TIME ZONE,
  quiz_end_time TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quiz_summary_session_id ON quiz_session_summary(session_id);

-- Phase Completion Analytics
CREATE TABLE phase_completion_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  phase_start_time TIMESTAMP WITH TIME ZONE,
  phase_end_time TIMESTAMP WITH TIME ZONE,
  total_time_seconds INTEGER,
  video_time_seconds INTEGER DEFAULT 0,
  chat_time_seconds INTEGER DEFAULT 0,
  knowledge_check_time_seconds INTEGER DEFAULT 0,
  quiz_time_seconds INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  final_assessment_score REAL,
  quiz_score REAL,
  learning_efficiency_score REAL,
  engagement_quality TEXT CHECK (engagement_quality IN ('low', 'medium', 'high', 'excellent')),
  completed_successfully BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_phase_completion_session_id ON phase_completion_analytics(session_id);

-- User Revision Tracking (used by frontend event tracking)
CREATE TABLE user_revision_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT,
  component TEXT,
  revision_number INTEGER DEFAULT 1,
  content_changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_revision_session_id ON user_revision_tracking(session_id);

-- Feedback Style Views (for alternative feedback tracking)
CREATE TABLE feedback_style_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  component TEXT NOT NULL,
  original_style TEXT NOT NULL,
  alternative_style TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_style_views_session_id ON feedback_style_views(session_id);

-- ============================================
-- STEP 4: RESEARCH VIEWS
-- ============================================

-- Complete User Journey
CREATE OR REPLACE VIEW user_journey_complete AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  s.id as session_id,
  s.created_at as session_start,
  u.profile_data->>'coach_tone' as feedback_style,
  COUNT(DISTINCT pca.phase) as phases_completed,
  COUNT(DISTINCT ce.id) FILTER (WHERE ce.button_text LIKE '%Next%' OR ce.button_text LIKE '%Continue%') as next_button_clicks,
  COUNT(DISTINCT ui.id) as total_inputs,
  COUNT(DISTINCT m.id) FILTER (WHERE m.role = 'user') as user_chat_messages,
  COUNT(DISTINCT m.id) FILTER (WHERE m.role = 'assistant') as bot_responses,
  COUNT(DISTINCT a.id) as total_assessments,
  AVG(a.overall_score) as average_score,
  SUM(pca.total_time_seconds) as total_learning_time
FROM users u
JOIN sessions s ON u.id = s.user_id
LEFT JOIN phase_completion_analytics pca ON s.id = pca.session_id
LEFT JOIN click_events ce ON s.id = ce.session_id
LEFT JOIN user_inputs ui ON s.id = ui.session_id
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN assessments a ON s.id = a.session_id
GROUP BY u.id, u.name, u.email, s.id, s.created_at, u.profile_data->>'coach_tone';

-- Chat with Scores view
CREATE OR REPLACE VIEW chat_with_scores AS
SELECT 
  cc.id as conversation_id,
  cc.session_id,
  cc.user_id,
  cc.phase,
  cc.component,
  cc.total_messages,
  cc.user_messages,
  cc.bot_messages,
  cc.assessment_score,
  cc.evaluation_metadata,
  a.overall_score,
  a.lowest_category,
  a.scaffolding_level,
  a.feedback_style,
  a.evaluation as detailed_evaluation,
  cc.conversation_start_time,
  cc.conversation_end_time
FROM chat_conversations cc
LEFT JOIN assessments a ON cc.session_id = a.session_id AND cc.phase = a.phase AND cc.component = a.component;

-- Refresh PostgREST schema cache (important!)
NOTIFY pgrst, 'reload schema';

-- ============================================
-- STEP 5: VERIFY
-- ============================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
