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
  full_evaluation TEXT, -- Full evaluation JSON as text (for backend compatibility)
  lowest_category TEXT, -- LOW/MEDIUM/HIGH
  scaffolding_level TEXT, -- Template + example/Targeted suggestions + Template/Reflection questions
  rationale TEXT, -- Assessment rationale
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE assessments 
  ADD COLUMN IF NOT EXISTS full_evaluation TEXT,
  ADD COLUMN IF NOT EXISTS lowest_category TEXT,
  ADD COLUMN IF NOT EXISTS scaffolding_level TEXT,
  ADD COLUMN IF NOT EXISTS rationale TEXT;

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

-- 6. Video Analytics - Comprehensive video watching data
CREATE TABLE IF NOT EXISTS user_video_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  video_name TEXT NOT NULL,
  video_src TEXT, -- Video source URL
  total_duration_seconds INTEGER, -- Total video length
  watched_duration_seconds INTEGER DEFAULT 0, -- Total time watched
  completion_percentage REAL DEFAULT 0, -- Percentage of video watched
  play_count INTEGER DEFAULT 1, -- Number of times video was played
  pause_count INTEGER DEFAULT 0, -- Number of times video was paused
  rewind_count INTEGER DEFAULT 0, -- Number of times user rewound
  fast_forward_count INTEGER DEFAULT 0, -- Number of times user fast-forwarded
  seek_count INTEGER DEFAULT 0, -- Total seek operations
  watch_patterns JSONB DEFAULT '[]'::jsonb, -- Array of {timestamp, action, position}
  watch_segments JSONB DEFAULT '[]'::jsonb, -- Array of watched time segments
  skipped_segments JSONB DEFAULT '[]'::jsonb, -- Array of skipped segments
  completed_at TIMESTAMP WITH TIME ZONE, -- When video was completed
  first_play_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- First time video was played
  last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last interaction time
  last_position REAL DEFAULT 0, -- Last watched position in seconds
  engagement_score REAL, -- Calculated engagement score
  UNIQUE(session_id, video_name)
);

-- Add missing columns if table already exists (for existing databases)
ALTER TABLE user_video_analytics 
  ADD COLUMN IF NOT EXISTS video_src TEXT,
  ADD COLUMN IF NOT EXISTS seek_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS watch_segments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS skipped_segments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_position REAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS engagement_score REAL;

CREATE INDEX IF NOT EXISTS idx_video_analytics_session_id ON user_video_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_user_id ON user_video_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_phase ON user_video_analytics(phase);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_name ON user_video_analytics(video_name);

-- 6b. Video Interaction Events - Detailed video event log
CREATE TABLE IF NOT EXISTS video_interaction_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  video_name TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('play', 'pause', 'seek', 'rewind', 'fast_forward', 'progress_milestone', 'loaded', 'ended', 'error')),
  playback_position REAL, -- Current playback position in seconds (renamed from current_time to avoid PostgreSQL reserved keyword)
  total_watched_seconds REAL, -- Cumulative watched time
  event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB, -- Additional event details
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE video_interaction_events 
  ADD COLUMN IF NOT EXISTS playback_position REAL;

CREATE INDEX IF NOT EXISTS idx_video_events_session_id ON video_interaction_events(session_id);
CREATE INDEX IF NOT EXISTS idx_video_events_user_id ON video_interaction_events(user_id);
CREATE INDEX IF NOT EXISTS idx_video_events_phase ON video_interaction_events(phase);
CREATE INDEX IF NOT EXISTS idx_video_events_type ON video_interaction_events(event_type);
CREATE INDEX IF NOT EXISTS idx_video_events_timestamp ON video_interaction_events(event_timestamp);

-- 6c. LLM Interactions - Track all LLM API calls
CREATE TABLE IF NOT EXISTS llm_interactions (
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
  model_name TEXT NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_llm_interactions_user_id ON llm_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_interactions_session_id ON llm_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_llm_interactions_model ON llm_interactions(model_name);
CREATE INDEX IF NOT EXISTS idx_llm_interactions_created_at ON llm_interactions(created_at);

-- 6d. User Chat Analytics - Chat interaction analysis
CREATE TABLE IF NOT EXISTS user_chat_analytics (
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

CREATE INDEX IF NOT EXISTS idx_chat_analytics_session_id ON user_chat_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_user_id ON user_chat_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_phase ON user_chat_analytics(phase);

-- 7. Knowledge Check / Quiz Data - Comprehensive quiz tracking
CREATE TABLE IF NOT EXISTS knowledge_check_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  question_id TEXT, -- Unique identifier for the question
  question_text TEXT NOT NULL, -- The actual question text
  question_type TEXT, -- 'multiple_choice', 'true_false', 'short_answer', etc.
  attempt_number INTEGER DEFAULT 1, -- Which attempt (1st, 2nd, etc.)
  selected_answer TEXT, -- User's selected answer
  correct_answer TEXT, -- The correct answer
  is_correct BOOLEAN, -- Whether the answer was correct
  time_to_answer_seconds INTEGER, -- Time taken to answer
  time_to_first_interaction_seconds INTEGER, -- Time before first interaction
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5), -- User confidence (1-5)
  help_used BOOLEAN DEFAULT FALSE, -- Whether user used hints/help
  answer_changed BOOLEAN DEFAULT FALSE, -- Whether user changed their answer
  answer_changes JSONB DEFAULT '[]'::jsonb, -- Array of answer changes with timestamps
  thinking_time_seconds INTEGER, -- Time spent thinking before answering
  options_shown JSONB, -- Available options for multiple choice
  explanation_viewed BOOLEAN DEFAULT FALSE, -- Whether user viewed explanation
  retry_count INTEGER DEFAULT 0, -- Number of retries
  metadata JSONB, -- Additional quiz metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_check_session_id ON knowledge_check_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_check_user_id ON knowledge_check_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_check_phase ON knowledge_check_attempts(phase);
CREATE INDEX IF NOT EXISTS idx_knowledge_check_question_id ON knowledge_check_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_check_is_correct ON knowledge_check_attempts(is_correct);

-- 7b. Quiz Session Summary - Overall quiz performance per phase
CREATE TABLE IF NOT EXISTS quiz_session_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  incorrect_answers INTEGER DEFAULT 0,
  accuracy_percentage REAL, -- (correct_answers / total_questions) * 100
  average_time_per_question_seconds REAL,
  total_time_seconds INTEGER, -- Total time spent on quiz
  first_attempt_accuracy REAL, -- Accuracy on first attempts only
  retry_accuracy REAL, -- Accuracy after retries
  questions_answered JSONB DEFAULT '[]'::jsonb, -- Array of question IDs answered
  quiz_start_time TIMESTAMP WITH TIME ZONE,
  quiz_end_time TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_summary_session_id ON quiz_session_summary(session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_summary_user_id ON quiz_session_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_summary_phase ON quiz_session_summary(phase);

-- 8. Phase Completion Analytics
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
  quiz_time_seconds INTEGER DEFAULT 0, -- Time spent on quizzes
  revision_count INTEGER DEFAULT 0,
  final_assessment_score REAL,
  quiz_score REAL, -- Average quiz score for this phase
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

-- View: Video Watching Summary
CREATE OR REPLACE VIEW video_watching_summary AS
SELECT 
  uva.session_id,
  uva.user_id,
  uva.phase,
  uva.video_name,
  uva.total_duration_seconds,
  uva.watched_duration_seconds,
  uva.completion_percentage,
  uva.play_count,
  uva.pause_count,
  uva.rewind_count,
  uva.fast_forward_count,
  uva.seek_count,
  COUNT(vie.id) as total_interaction_events,
  AVG(vie.playback_position) as avg_playback_position,
  uva.first_play_at,
  uva.last_interaction_at,
  uva.completed_at,
  CASE 
    WHEN uva.completion_percentage >= 90 THEN 'Complete'
    WHEN uva.completion_percentage >= 50 THEN 'Partial'
    ELSE 'Minimal'
  END as engagement_level
FROM user_video_analytics uva
LEFT JOIN video_interaction_events vie ON uva.session_id = vie.session_id AND uva.video_name = vie.video_name
GROUP BY uva.id, uva.session_id, uva.user_id, uva.phase, uva.video_name, uva.total_duration_seconds,
  uva.watched_duration_seconds, uva.completion_percentage, uva.play_count, uva.pause_count,
  uva.rewind_count, uva.fast_forward_count, uva.seek_count, uva.first_play_at, uva.last_interaction_at, uva.completed_at;

-- View: Quiz Performance Summary
CREATE OR REPLACE VIEW quiz_performance_summary AS
SELECT 
  qss.session_id,
  qss.user_id,
  qss.phase,
  qss.total_questions,
  qss.correct_answers,
  qss.incorrect_answers,
  qss.accuracy_percentage,
  qss.average_time_per_question_seconds,
  qss.total_time_seconds,
  qss.first_attempt_accuracy,
  qss.retry_accuracy,
  qss.quiz_start_time,
  qss.quiz_end_time,
  qss.completed,
  COUNT(kca.id) as total_attempts,
  AVG(kca.time_to_answer_seconds) as avg_time_per_question,
  AVG(kca.confidence_level) as avg_confidence,
  SUM(CASE WHEN kca.help_used THEN 1 ELSE 0 END) as questions_with_help,
  SUM(CASE WHEN kca.answer_changed THEN 1 ELSE 0 END) as questions_with_answer_changes
FROM quiz_session_summary qss
LEFT JOIN knowledge_check_attempts kca ON qss.session_id = kca.session_id AND qss.phase = kca.phase
GROUP BY qss.id, qss.session_id, qss.user_id, qss.phase, qss.total_questions, qss.correct_answers,
  qss.incorrect_answers, qss.accuracy_percentage, qss.average_time_per_question_seconds,
  qss.total_time_seconds, qss.first_attempt_accuracy, qss.retry_accuracy,
  qss.quiz_start_time, qss.quiz_end_time, qss.completed;

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
  'video_interaction_events', 'knowledge_check_attempts', 'quiz_session_summary',
  'phase_completion_analytics'
)
ORDER BY table_name;
