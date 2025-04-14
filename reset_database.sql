-- Reset and rebuild database schema for SoLBot Learning Platform
-- This script will DROP ALL EXISTING TABLES and rebuild them
-- CAUTION: All data will be lost when running this script

-- Disable triggers temporarily during drop operations
SET session_replication_role = 'replica';

-- Drop views first to avoid dependency issues
DROP VIEW IF EXISTS assessment_report CASCADE;

-- Check for existence of criterion_scores table before dropping related triggers/functions
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'criterion_scores') THEN
    -- Drop triggers that depend on criterion_scores
    DROP TRIGGER IF EXISTS scaffold_level_update_trigger ON criterion_scores CASCADE;
  END IF;
END
$$;

-- Drop functions regardless of table existence
DROP FUNCTION IF EXISTS update_scaffolding_after_assessment() CASCADE;
DROP FUNCTION IF EXISTS calculate_scaffolding_level(UUID) CASCADE;
DROP FUNCTION IF EXISTS save_user_data(UUID, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS save_user_data(TEXT, TEXT, TEXT, JSONB) CASCADE;

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS user_activity CASCADE;
DROP TABLE IF EXISTS monitoring_records CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS scaffolding_history CASCADE;
DROP TABLE IF EXISTS scaffolding_levels CASCADE;
DROP TABLE IF EXISTS criterion_scores CASCADE;
DROP TABLE IF EXISTS rubric_criteria CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS llm_interactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS phase_progress CASCADE;
DROP TABLE IF EXISTS rubrics CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS user_courses CASCADE;
DROP TABLE IF EXISTS learning_phases CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_data CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable triggers again
SET session_replication_role = 'origin';

-- Make sure the UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RECREATE TABLES
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
  is_active BOOLEAN DEFAULT TRUE,
  gender TEXT,
  age INTEGER,
  race TEXT,
  is_first_generation BOOLEAN DEFAULT FALSE,
  preferred_language TEXT,
  learning_style TEXT
);

-- User data table for analytics and tracking
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  value TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  criteria JSONB NOT NULL,
  scoring_scale TEXT DEFAULT '1-3',
  scaffolding_mapping JSONB DEFAULT jsonb_build_object(
    '1', jsonb_build_object('level', 1, 'description', 'High Support'),
    '2', jsonb_build_object('level', 2, 'description', 'Medium Support'),
    '3', jsonb_build_object('level', 3, 'description', 'Low Support')
  )
);

-- Detailed rubric criteria table
CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 3,
  weight FLOAT NOT NULL DEFAULT 1.0,
  required BOOLEAN DEFAULT TRUE
);

-- Student progress through phases
CREATE TABLE phase_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_course_id UUID REFERENCES user_courses(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES learning_phases(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  current_scaffolding_level INTEGER DEFAULT 2, -- 1: High, 2: Medium, 3: Low
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, paused
  interaction_state JSONB DEFAULT '{}'::jsonb,
  incomplete_criteria JSONB DEFAULT '[]'::jsonb,
  UNIQUE(user_course_id, phase_id)
);

-- Conversation sessions with AI agents
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase_progress_id UUID REFERENCES phase_progress(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL, -- manager, specialist, etc.
  phase TEXT NOT NULL,
  component TEXT,
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

-- Enhanced LLM interactions table to store all raw inputs/outputs
CREATE TABLE llm_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  component TEXT,
  system_prompt TEXT NOT NULL,
  user_message TEXT NOT NULL,
  raw_llm_response TEXT NOT NULL,
  processed_response TEXT,
  model_name TEXT NOT NULL,
  temperature FLOAT,
  max_tokens INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_timestamp TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  metadata JSONB -- For storing additional data like tool outputs, evaluation scores, etc.
);

-- Student submission attempts
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES learning_phases(id) ON DELETE CASCADE, 
  conversation_id UUID REFERENCES conversations(id),
  submission_type TEXT NOT NULL, -- goal, monitoring_plan, reflection, etc.
  content TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'submitted', -- submitted, evaluated, accepted, rejected
  attempt_number INTEGER DEFAULT 1,
  metadata JSONB -- Store structured content as JSON
);

-- Assessment scores from rubrics
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_progress_id UUID REFERENCES phase_progress(id) ON DELETE CASCADE,
  rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id),
  score INTEGER NOT NULL,
  feedback TEXT,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessed_by TEXT, -- agent ID or type that performed assessment
  criteria_scores JSONB -- Individual criterion scores as JSON
);

-- Individual criterion scores table
CREATE TABLE criterion_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  criterion_id UUID REFERENCES rubric_criteria(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  feedback TEXT,
  missing BOOLEAN DEFAULT FALSE,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, criterion_id)
);

-- Scaffolding level tracking
CREATE TABLE scaffolding_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  component TEXT,
  level INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversation_id UUID REFERENCES conversations(id),
  previous_level INTEGER,
  reason TEXT -- Reason for changing the scaffolding level
);

-- Scaffolding history table to track changes over time
CREATE TABLE scaffolding_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase_progress_id UUID REFERENCES phase_progress(id) ON DELETE CASCADE,
  previous_level INTEGER NOT NULL,
  new_level INTEGER NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_by TEXT, -- 'assessment', 'manual', 'system'
  assessment_id UUID REFERENCES assessments(id)
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

-- Create functions for database operations
-- Function to calculate scaffolding level from criterion scores
CREATE OR REPLACE FUNCTION calculate_scaffolding_level(p_assessment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_avg_score FLOAT;
  v_min_score INTEGER;
  v_rubric_id UUID;
  v_scoring_method TEXT;
BEGIN
  -- Get the rubric ID for this assessment
  SELECT r.id INTO v_rubric_id
  FROM assessments a
  JOIN rubrics r ON a.rubric_id = r.id
  WHERE a.id = p_assessment_id;
  
  -- Get the scoring method from the rubric (default to 'average')
  SELECT COALESCE(criteria->>'scoring_method', 'average') INTO v_scoring_method
  FROM rubrics
  WHERE id = v_rubric_id;
  
  IF v_scoring_method = 'minimum' THEN
    -- Use the minimum score approach
    SELECT MIN(score) INTO v_min_score
    FROM criterion_scores
    WHERE assessment_id = p_assessment_id;
    
    RETURN v_min_score;
  ELSE
    -- Use average score approach (default)
    SELECT COALESCE(AVG(score), 1) INTO v_avg_score
    FROM criterion_scores cs
    JOIN rubric_criteria rc ON cs.criterion_id = rc.id
    WHERE cs.assessment_id = p_assessment_id;
    
    -- Round to nearest integer
    RETURN ROUND(v_avg_score);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to save user data
CREATE OR REPLACE FUNCTION save_user_data(
  p_user_id TEXT,
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

-- Trigger function to automatically update scaffolding level after assessment
CREATE OR REPLACE FUNCTION update_scaffolding_after_assessment() RETURNS TRIGGER AS $$
DECLARE
  v_phase_progress_id UUID;
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get phase progress ID
  SELECT phase_progress_id INTO v_phase_progress_id
  FROM assessments
  WHERE id = NEW.assessment_id;
  
  -- Get current scaffolding level
  SELECT current_scaffolding_level INTO v_current_level
  FROM phase_progress
  WHERE id = v_phase_progress_id;
  
  -- Calculate new scaffolding level
  SELECT calculate_scaffolding_level(NEW.assessment_id) INTO v_new_level;
  
  -- Only change if levels are different
  IF v_current_level != v_new_level THEN
    -- Record change in history
    INSERT INTO scaffolding_history (
      phase_progress_id,
      previous_level,
      new_level,
      reason,
      triggered_by,
      assessment_id
    ) VALUES (
      v_phase_progress_id,
      v_current_level,
      v_new_level,
      CASE 
        WHEN v_new_level < v_current_level THEN 'Decreased due to assessment scores'
        ELSE 'Increased due to good assessment performance'
      END,
      'assessment',
      NEW.assessment_id
    );
    
    -- Update phase progress
    UPDATE phase_progress
    SET current_scaffolding_level = v_new_level
    WHERE id = v_phase_progress_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automated scaffolding level updates
CREATE TRIGGER scaffold_level_update_trigger
AFTER INSERT ON criterion_scores
FOR EACH ROW EXECUTE FUNCTION update_scaffolding_after_assessment();

-- Create assessment report view for easy reporting
CREATE VIEW assessment_report AS
SELECT 
  a.id as assessment_id,
  pp.id as phase_progress_id,
  u.id as user_id,
  u.full_name,
  c.title as course_title,
  lp.name as phase_name,
  r.name as rubric_name,
  a.score as overall_score,
  pp.current_scaffolding_level,
  a.assessed_at,
  a.assessed_by,
  (
    SELECT jsonb_object_agg(rc.name, cs.score)
    FROM criterion_scores cs
    JOIN rubric_criteria rc ON cs.criterion_id = rc.id
    WHERE cs.assessment_id = a.id
  ) as criterion_scores,
  a.feedback
FROM 
  assessments a
JOIN phase_progress pp ON a.phase_progress_id = pp.id
JOIN user_courses uc ON pp.user_course_id = uc.id
JOIN users u ON uc.user_id = u.id
JOIN courses c ON uc.course_id = c.id
JOIN learning_phases lp ON pp.phase_id = lp.id
JOIN rubrics r ON a.rubric_id = r.id;

-- Create indexes for performance optimization
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_phase_progress_user_course_id ON phase_progress(user_course_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_phase ON conversations(phase);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_assessments_phase_progress_id ON assessments(phase_progress_id);
CREATE INDEX idx_llm_interactions_message_id ON llm_interactions(message_id);
CREATE INDEX idx_llm_interactions_conversation_id ON llm_interactions(conversation_id);
CREATE INDEX idx_llm_interactions_user_id ON llm_interactions(user_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_conversation_id ON submissions(conversation_id);
CREATE INDEX idx_scaffolding_levels_user_id_phase ON scaffolding_levels(user_id, phase);
CREATE INDEX idx_user_data_user_id ON user_data(user_id);
CREATE INDEX idx_user_data_type ON user_data(data_type);
CREATE INDEX idx_user_data_created_at ON user_data(created_at);

-- Enable RLS (Row Level Security) on tables
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for row level security
CREATE POLICY "Allow all operations for all users on user_data" 
ON user_data FOR ALL
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for all users on conversations" 
ON conversations FOR ALL
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow all operations for all users on messages" 
ON messages FOR ALL
USING (true) 
WITH CHECK (true); 