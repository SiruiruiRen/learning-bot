-- SoLBot Learning Platform Schema Alignment
-- Migration: 004_schema_alignment

-- Enhance users table with demographic information
ALTER TABLE users 
  ADD COLUMN gender TEXT,
  ADD COLUMN age INTEGER,
  ADD COLUMN race TEXT,
  ADD COLUMN is_first_generation BOOLEAN DEFAULT FALSE,
  ADD COLUMN preferred_language TEXT,
  ADD COLUMN learning_style TEXT;

-- Create a more structured table for detailed rubric criteria
CREATE TABLE rubric_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rubric_id UUID REFERENCES rubrics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_score INTEGER NOT NULL DEFAULT 3,
  weight FLOAT NOT NULL DEFAULT 1.0,
  required BOOLEAN DEFAULT TRUE
);

-- Create a table for criterion-specific assessment scores
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

-- Create a scaffolding history table to track changes over time
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

-- Add an interaction_state field to phase_progress to track component status
ALTER TABLE phase_progress
  ADD COLUMN interaction_state JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN incomplete_criteria JSONB DEFAULT '[]'::jsonb;

-- Modify existing rubrics table to support 1-3 scoring scale as standard
ALTER TABLE rubrics
  ADD COLUMN scoring_scale TEXT DEFAULT '1-3',
  ADD COLUMN scaffolding_mapping JSONB DEFAULT jsonb_build_object(
    '1', jsonb_build_object('level', 1, 'description', 'High Support'),
    '2', jsonb_build_object('level', 2, 'description', 'Medium Support'),
    '3', jsonb_build_object('level', 3, 'description', 'Low Support')
  );

-- Create a function to calculate scaffolding level from criterion scores
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

-- Create a trigger to automatically update scaffolding level after assessment
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

CREATE TRIGGER scaffold_level_update_trigger
AFTER INSERT ON criterion_scores
FOR EACH ROW EXECUTE FUNCTION update_scaffolding_after_assessment();

-- Insert detailed criteria for each rubric based on scaffolding_rubrics.md

-- Phase 2: Learning Objective Definition criteria
DO $$
DECLARE
  v_rubric_id UUID;
BEGIN
  -- Get the rubric ID for Learning Objectives Quality
  SELECT id INTO v_rubric_id
  FROM rubrics
  WHERE name = 'Learning Objectives Quality';
  
  IF FOUND THEN
    -- Insert criteria
    INSERT INTO rubric_criteria (rubric_id, name, description, max_score, weight)
    VALUES
      (v_rubric_id, 'Specificity', 'Clarity and specificity of learning objectives', 3, 1.0),
      (v_rubric_id, 'Cognitive Level', 'Use of appropriate cognitive level for objective', 3, 1.0),
      (v_rubric_id, 'Prior Knowledge', 'Connection to existing knowledge', 3, 1.0);
  END IF;
END
$$;

-- Phase 2: Resource Identification criteria
DO $$
DECLARE
  v_rubric_id UUID;
BEGIN
  -- Find or create a rubric for Resource Identification
  SELECT id INTO v_rubric_id
  FROM rubrics
  WHERE name = 'Resource Identification';
  
  IF NOT FOUND THEN
    INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
    SELECT id, 'Resource Identification', 'Assessment of resource selection for learning', 3,
    jsonb_build_object(
      'scoring_method', 'average'
    )
    FROM learning_phases
    WHERE name = 'Learning Objectives Definition'
    RETURNING id INTO v_rubric_id;
  END IF;
  
  -- Insert criteria
  INSERT INTO rubric_criteria (rubric_id, name, description, max_score, weight)
  VALUES
    (v_rubric_id, 'Resource Diversity', 'Use of multiple complementary resource types', 3, 1.0),
    (v_rubric_id, 'Specificity', 'Specific details about resources', 3, 1.0),
    (v_rubric_id, 'Accessibility Plan', 'Plan for accessing resources', 3, 1.0);
END
$$;

-- Phase 4: Goal Setting criteria (Long-term Goals)
DO $$
DECLARE
  v_rubric_id UUID;
BEGIN
  -- Find or create a rubric for Long-term Goal
  SELECT id INTO v_rubric_id
  FROM rubrics
  WHERE name = 'Goal Quality';
  
  IF NOT FOUND THEN
    INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
    SELECT id, 'Goal Quality', 'Assessment of SMART goals and contingency plans', 3,
    jsonb_build_object(
      'scoring_method', 'average'
    )
    FROM learning_phases
    WHERE name = 'Goal Setting'
    RETURNING id INTO v_rubric_id;
  END IF;
  
  -- Insert criteria
  INSERT INTO rubric_criteria (rubric_id, name, description, max_score, weight)
  VALUES
    (v_rubric_id, 'Alignment', 'Connection to learning objectives', 3, 1.0),
    (v_rubric_id, 'Timeframe', 'Specific timeframe with milestones', 3, 1.0),
    (v_rubric_id, 'Measurability', 'Specific, quantifiable success metrics', 3, 1.0),
    (v_rubric_id, 'SMART Elements', 'Includes all SMART goal elements', 3, 1.0),
    (v_rubric_id, 'Progressive Sequence', 'Clear building sequence toward larger goal', 3, 1.0),
    (v_rubric_id, 'Long-term Alignment', 'Direct contribution to long-term goal', 3, 1.0);
END
$$;

-- Phase 4: IF-THEN Contingency Strategies
DO $$
DECLARE
  v_rubric_id UUID;
BEGIN
  -- Find or create a rubric for IF-THEN Contingency Strategies
  SELECT id INTO v_rubric_id
  FROM rubrics
  WHERE name = 'IF-THEN Contingency Strategies';
  
  IF NOT FOUND THEN
    INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
    SELECT id, 'IF-THEN Contingency Strategies', 'Assessment of contingency planning', 3,
    jsonb_build_object(
      'scoring_method', 'average'
    )
    FROM learning_phases
    WHERE name = 'Goal Setting'
    RETURNING id INTO v_rubric_id;
  END IF;
  
  -- Insert criteria
  INSERT INTO rubric_criteria (rubric_id, name, description, max_score, weight)
  VALUES
    (v_rubric_id, 'Challenge Specificity', 'Precise challenges with clear triggers', 3, 1.0),
    (v_rubric_id, 'Response Clarity', 'Specific actions with implementation steps', 3, 1.0),
    (v_rubric_id, 'Feasibility', 'Realistic responses with resource consideration', 3, 1.0);
END
$$;

-- Phase 5: Monitoring & Adaptation criteria
DO $$
DECLARE
  v_rubric_id UUID;
BEGIN
  -- Find or create a rubric for Progress Monitoring
  SELECT id INTO v_rubric_id
  FROM rubrics
  WHERE name = 'Monitoring Process';
  
  IF NOT FOUND THEN
    INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
    SELECT id, 'Monitoring Process', 'Assessment of monitoring and adaptation strategies', 3,
    jsonb_build_object(
      'scoring_method', 'average'
    )
    FROM learning_phases
    WHERE name = 'Monitoring & Adaptation'
    RETURNING id INTO v_rubric_id;
  END IF;
  
  -- Insert criteria
  INSERT INTO rubric_criteria (rubric_id, name, description, max_score, weight)
  VALUES
    (v_rubric_id, 'Check-in Specificity', 'Precise check-ins with clear metrics', 3, 1.0),
    (v_rubric_id, 'Frequency', 'Regular check-ins aligned with milestones', 3, 1.0),
    (v_rubric_id, 'Action Connection', 'Explicit actions for each check-in result', 3, 1.0);
END
$$;

-- Create a view for easy assessment reporting
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