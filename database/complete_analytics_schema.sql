-- Complete Analytics Schema for SoLBot Research
-- This ensures ALL user data is tracked: clicks, inputs, navigation, chat, scores, feedback

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES (if not exist)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT,
  name TEXT,
  profile_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User data table
CREATE TABLE IF NOT EXISTS user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (for chat conversations)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  conversation_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  phase TEXT,
  component TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table (for scores and feedback)
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submission_message_id UUID REFERENCES messages(id),
  feedback_message_id UUID REFERENCES messages(id),
  phase TEXT NOT NULL,
  component TEXT NOT NULL,
  attempt_number INTEGER DEFAULT 1,
  overall_score REAL,
  evaluation JSONB, -- Contains detailed scoring breakdown
  feedback_content TEXT, -- Full feedback text
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANALYTICS TABLES
-- ============================================

-- 1. Content Interaction Logs - Records ALL interactions
CREATE TABLE IF NOT EXISTS content_interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'user_click', 'chat_message', 'form_input', 'navigation', 'button_click', etc.
  content_type TEXT NOT NULL,
  phase TEXT,
  component TEXT,
  interaction_data JSONB NOT NULL, -- All details about the interaction
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sequence_number INTEGER -- For ordering interactions chronologically
);

CREATE INDEX IF NOT EXISTS idx_content_logs_session_id ON content_interaction_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_content_logs_user_id ON content_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_content_logs_timestamp ON content_interaction_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_content_logs_type ON content_interaction_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_content_logs_phase ON content_interaction_logs(phase);

-- 2. Navigation Tracking - Specifically tracks Next button clicks and page transitions
CREATE TABLE IF NOT EXISTS navigation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('next_button', 'previous_button', 'phase_transition', 'page_view', 'page_exit')),
  from_path TEXT,
  to_path TEXT,
  from_phase TEXT,
  to_phase TEXT,
  button_text TEXT, -- e.g., "Next", "Continue to Chat", "Next to Phase 3"
  button_id TEXT,
  time_on_page_seconds INTEGER,
  metadata JSONB, -- Additional context
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nav_session_id ON navigation_events(session_id);
CREATE INDEX IF NOT EXISTS idx_nav_user_id ON navigation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_nav_timestamp ON navigation_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_nav_event_type ON navigation_events(event_type);

-- 3. User Input Tracking - Records ALL user text inputs
CREATE TABLE IF NOT EXISTS user_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL, -- 'form_field', 'chat_message', 'text_area', 'input_field'
  field_name TEXT, -- e.g., 'learning_objective', 'goal', 'reflection'
  input_value TEXT NOT NULL, -- The actual text content
  phase TEXT,
  component TEXT,
  is_submission BOOLEAN DEFAULT FALSE, -- Whether this was submitted
  attempt_number INTEGER DEFAULT 1,
  metadata JSONB, -- Field metadata, validation status, etc.
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inputs_session_id ON user_inputs(session_id);
CREATE INDEX IF NOT EXISTS idx_inputs_user_id ON user_inputs(user_id);
CREATE INDEX IF NOT EXISTS idx_inputs_timestamp ON user_inputs(timestamp);
CREATE INDEX IF NOT EXISTS idx_inputs_type ON user_inputs(input_type);
CREATE INDEX IF NOT EXISTS idx_inputs_phase ON user_inputs(phase);

-- 4. Chat Conversations - Complete chat history with scores and feedback
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  component TEXT NOT NULL, -- 'chatbot', 'learning_objectives', 'mcii', etc.
  conversation_start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversation_end_time TIMESTAMP WITH TIME ZONE,
  total_messages INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  bot_messages INTEGER DEFAULT 0,
  has_assessment BOOLEAN DEFAULT FALSE,
  assessment_score REAL,
  assessment_feedback TEXT,
  evaluation_metadata JSONB, -- Detailed scoring breakdown
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_conv_session_id ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_user_id ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conv_phase ON chat_conversations(phase);

-- 5. Click Events - Detailed click tracking
CREATE TABLE IF NOT EXISTS click_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  click_type TEXT NOT NULL, -- 'button', 'link', 'element', 'navigation'
  element_tag TEXT, -- 'button', 'a', 'div', etc.
  element_id TEXT,
  element_class TEXT,
  element_text TEXT, -- Text content of clicked element
  button_text TEXT, -- For buttons: "Next", "Submit", etc.
  x_position INTEGER,
  y_position INTEGER,
  pathname TEXT,
  phase TEXT,
  component TEXT,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_session_id ON click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_id ON click_events(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_timestamp ON click_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_clicks_type ON click_events(click_type);

-- 6. Video Analytics (if not exists)
CREATE TABLE IF NOT EXISTS user_video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  video_name TEXT NOT NULL,
  total_duration_seconds INTEGER,
  watched_duration_seconds INTEGER DEFAULT 0,
  completion_percentage REAL DEFAULT 0,
  play_count INTEGER DEFAULT 1,
  pause_count INTEGER DEFAULT 0,
  rewind_count INTEGER DEFAULT 0,
  fast_forward_count INTEGER DEFAULT 0,
  watch_patterns JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  first_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, video_name)
);

CREATE INDEX IF NOT EXISTS idx_video_analytics_session_id ON user_video_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_user_id ON user_video_analytics(user_id);

-- 7. Phase Completion Analytics
CREATE TABLE IF NOT EXISTS phase_completion_analytics (
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
  revision_count INTEGER DEFAULT 0,
  final_assessment_score REAL,
  learning_efficiency_score REAL,
  engagement_quality TEXT CHECK (engagement_quality IN ('low', 'medium', 'high', 'excellent')),
  completed_successfully BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phase_completion_session_id ON phase_completion_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_phase_completion_user_id ON phase_completion_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_phase_completion_phase ON phase_completion_analytics(phase);

-- ============================================
-- VIEWS FOR RESEARCH ANALYSIS
-- ============================================

-- View: Complete User Journey
CREATE OR REPLACE VIEW user_journey_complete AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  s.id as session_id,
  s.created_at as session_start,
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
GROUP BY u.id, u.name, u.email, s.id, s.created_at;

-- View: Next Button Click Analysis
CREATE OR REPLACE VIEW next_button_analysis AS
SELECT 
  ne.session_id,
  ne.user_id,
  ne.from_phase,
  ne.to_phase,
  ne.button_text,
  ne.time_on_page_seconds,
  COUNT(*) as click_count,
  AVG(ne.time_on_page_seconds) as avg_time_before_next
FROM navigation_events ne
WHERE ne.event_type = 'next_button' OR ne.event_type = 'phase_transition'
GROUP BY ne.session_id, ne.user_id, ne.from_phase, ne.to_phase, ne.button_text, ne.time_on_page_seconds;

-- View: Chat Conversation with Scores
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
  cc.assessment_feedback,
  cc.evaluation_metadata,
  a.overall_score,
  a.evaluation as detailed_evaluation,
  cc.conversation_start_time,
  cc.conversation_end_time
FROM chat_conversations cc
LEFT JOIN assessments a ON cc.session_id = a.session_id AND cc.phase = a.phase AND cc.component = a.component;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'sessions', 'user_data', 'messages', 'assessments',
  'content_interaction_logs', 'navigation_events', 'user_inputs',
  'chat_conversations', 'click_events', 'user_video_analytics',
  'phase_completion_analytics'
)
ORDER BY table_name;
