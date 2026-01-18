-- Add columns to track feedback style views and chain prompting
-- This ensures we can analyze user preferences and performance

-- Add columns to assessments table for chain prompting tracking
ALTER TABLE assessments 
  ADD COLUMN IF NOT EXISTS evaluation_method TEXT DEFAULT 'standard', -- 'standard' or 'chain'
  ADD COLUMN IF NOT EXISTS evaluation_prompt_used TEXT, -- Store which prompt was used for evaluation
  ADD COLUMN IF NOT EXISTS feedback_style TEXT, -- 'warm' or 'direct'
  ADD COLUMN IF NOT EXISTS alternative_feedback_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS evaluation_time_ms INTEGER, -- Time taken for evaluation step
  ADD COLUMN IF NOT EXISTS feedback_time_ms INTEGER; -- Time taken for feedback generation step

-- Create index for performance analysis
CREATE INDEX IF NOT EXISTS idx_assessments_evaluation_method ON assessments(evaluation_method);
CREATE INDEX IF NOT EXISTS idx_assessments_feedback_style ON assessments(feedback_style);

-- Add table to track feedback style views (if not exists)
CREATE TABLE IF NOT EXISTS feedback_style_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  component TEXT NOT NULL,
  view_type TEXT NOT NULL CHECK (view_type IN ('original', 'alternative')),
  style_viewed TEXT NOT NULL CHECK (style_viewed IN ('warm', 'direct')),
  evaluation_score REAL,
  evaluation_category TEXT,
  view_start_time TIMESTAMP WITH TIME ZONE,
  view_end_time TIMESTAMP WITH TIME ZONE,
  view_duration_seconds INTEGER,
  previous_view_duration_seconds INTEGER, -- Duration of previous view before switching
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_style_views_session_id ON feedback_style_views(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_style_views_assessment_id ON feedback_style_views(assessment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_style_views_style ON feedback_style_views(style_viewed);

-- View for analyzing feedback style preferences
CREATE OR REPLACE VIEW feedback_style_analysis AS
SELECT 
  fsv.session_id,
  fsv.user_id,
  fsv.assessment_id,
  fsv.phase,
  fsv.component,
  a.overall_score as original_score,  -- Fixed: use overall_score instead of evaluation_score
  a.feedback_style as primary_style,
  COUNT(DISTINCT CASE WHEN fsv.view_type = 'original' THEN fsv.id END) as original_views,
  COUNT(DISTINCT CASE WHEN fsv.view_type = 'alternative' THEN fsv.id END) as alternative_views,
  AVG(CASE WHEN fsv.view_type = 'original' THEN fsv.view_duration_seconds END) as avg_original_view_duration,
  AVG(CASE WHEN fsv.view_type = 'alternative' THEN fsv.view_duration_seconds END) as avg_alternative_view_duration,
  SUM(CASE WHEN fsv.view_type = 'original' THEN fsv.view_duration_seconds ELSE 0 END) as total_original_view_time,
  SUM(CASE WHEN fsv.view_type = 'alternative' THEN fsv.view_duration_seconds ELSE 0 END) as total_alternative_view_time
FROM feedback_style_views fsv
LEFT JOIN assessments a ON fsv.assessment_id = a.id
GROUP BY fsv.session_id, fsv.user_id, fsv.assessment_id, fsv.phase, fsv.component, a.overall_score, a.feedback_style;
