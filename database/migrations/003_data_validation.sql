-- SoLBot Learning Platform Data Validation
-- Migration: 003_data_validation

-- Add default values for nullable fields
ALTER TABLE users 
  ALTER COLUMN education_level SET DEFAULT 'Not specified',
  ALTER COLUMN background SET DEFAULT 'Not specified',
  ALTER COLUMN preferences SET DEFAULT '{}';

-- Create a function to ensure all enum-like fields use consistent values
CREATE OR REPLACE FUNCTION validate_enum_field() RETURNS TRIGGER AS $$
BEGIN
  -- Course difficulty level validation
  IF TG_TABLE_NAME = 'courses' AND TG_COLUMN_NAME = 'difficulty_level' THEN
    NEW.difficulty_level = COALESCE(NEW.difficulty_level, 'Beginner');
    IF NEW.difficulty_level NOT IN ('Beginner', 'Intermediate', 'Advanced') THEN
      NEW.difficulty_level := 'Beginner';
    END IF;
  END IF;
  
  -- Phase progress status validation
  IF TG_TABLE_NAME = 'phase_progress' AND TG_COLUMN_NAME = 'status' THEN
    NEW.status = COALESCE(NEW.status, 'in_progress');
    IF NEW.status NOT IN ('in_progress', 'completed', 'paused') THEN
      NEW.status := 'in_progress';
    END IF;
  END IF;
  
  -- User goal status validation
  IF TG_TABLE_NAME = 'user_goals' AND TG_COLUMN_NAME = 'status' THEN
    NEW.status = COALESCE(NEW.status, 'active');
    IF NEW.status NOT IN ('active', 'completed', 'abandoned') THEN
      NEW.status := 'active';
    END IF;
  END IF;
  
  -- Goal type validation
  IF TG_TABLE_NAME = 'user_goals' AND TG_COLUMN_NAME = 'goal_type' THEN
    IF NEW.goal_type NOT IN ('long-term', 'SMART', 'IF-THEN') THEN
      NEW.goal_type := 'SMART';
    END IF;
  END IF;
  
  -- Resource type validation
  IF TG_TABLE_NAME = 'resources' AND TG_COLUMN_NAME = 'resource_type' THEN
    IF NEW.resource_type NOT IN ('video', 'text', 'quiz', 'interactive', 'external') THEN
      NEW.resource_type := 'text';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for enum field validation
CREATE TRIGGER validate_course_difficulty
  BEFORE INSERT OR UPDATE OF difficulty_level ON courses
  FOR EACH ROW EXECUTE FUNCTION validate_enum_field();
  
CREATE TRIGGER validate_phase_status
  BEFORE INSERT OR UPDATE OF status ON phase_progress
  FOR EACH ROW EXECUTE FUNCTION validate_enum_field();
  
CREATE TRIGGER validate_goal_status
  BEFORE INSERT OR UPDATE OF status ON user_goals
  FOR EACH ROW EXECUTE FUNCTION validate_enum_field();
  
CREATE TRIGGER validate_goal_type
  BEFORE INSERT OR UPDATE OF goal_type ON user_goals
  FOR EACH ROW EXECUTE FUNCTION validate_enum_field();
  
CREATE TRIGGER validate_resource_type
  BEFORE INSERT OR UPDATE OF resource_type ON resources
  FOR EACH ROW EXECUTE FUNCTION validate_enum_field();

-- Add a function to ensure scaffolding levels are valid
CREATE OR REPLACE FUNCTION validate_scaffolding_level() RETURNS TRIGGER AS $$
BEGIN
  NEW.current_scaffolding_level = COALESCE(NEW.current_scaffolding_level, 1);
  IF NEW.current_scaffolding_level < 1 THEN
    NEW.current_scaffolding_level := 1;
  ELSIF NEW.current_scaffolding_level > 3 THEN
    NEW.current_scaffolding_level := 3;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_scaffolding_level
  BEFORE INSERT OR UPDATE OF current_scaffolding_level ON phase_progress
  FOR EACH ROW EXECUTE FUNCTION validate_scaffolding_level();

-- Add a function to set defaults for JSONB fields if they're null
CREATE OR REPLACE FUNCTION set_default_jsonb() RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'conversations' AND TG_COLUMN_NAME = 'context' THEN
    NEW.context = COALESCE(NEW.context, '{}');
  END IF;
  
  IF TG_TABLE_NAME = 'messages' AND TG_COLUMN_NAME = 'metadata' THEN
    NEW.metadata = COALESCE(NEW.metadata, '{}');
  END IF;
  
  IF TG_TABLE_NAME = 'monitoring_records' AND TG_COLUMN_NAME = 'progress_metrics' THEN
    NEW.progress_metrics = COALESCE(NEW.progress_metrics, '{}');
  END IF;
  
  IF TG_TABLE_NAME = 'resources' AND TG_COLUMN_NAME = 'metadata' THEN
    NEW.metadata = COALESCE(NEW.metadata, '{}');
  END IF;
  
  IF TG_TABLE_NAME = 'user_activity' AND TG_COLUMN_NAME = 'metadata' THEN
    NEW.metadata = COALESCE(NEW.metadata, '{}');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for JSONB default values
CREATE TRIGGER set_default_conversation_context
  BEFORE INSERT ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_default_jsonb();
  
CREATE TRIGGER set_default_message_metadata
  BEFORE INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION set_default_jsonb();
  
CREATE TRIGGER set_default_monitoring_metrics
  BEFORE INSERT ON monitoring_records
  FOR EACH ROW EXECUTE FUNCTION set_default_jsonb();
  
CREATE TRIGGER set_default_resource_metadata
  BEFORE INSERT ON resources
  FOR EACH ROW EXECUTE FUNCTION set_default_jsonb();
  
CREATE TRIGGER set_default_activity_metadata
  BEFORE INSERT ON user_activity
  FOR EACH ROW EXECUTE FUNCTION set_default_jsonb();

-- Add a function to ensure rubric criteria has a valid structure
CREATE OR REPLACE FUNCTION validate_rubric_criteria() RETURNS TRIGGER AS $$
BEGIN
  -- Check if criteria is empty and set a default
  IF NEW.criteria IS NULL OR NEW.criteria = '{}'::jsonb THEN
    NEW.criteria := jsonb_build_object(
      'default_criterion', jsonb_build_object('description', 'Default criterion', 'weight', 10)
    );
  END IF;
  
  -- Ensure max_score is positive
  IF NEW.max_score <= 0 THEN
    NEW.max_score := 10;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_valid_rubric_criteria
  BEFORE INSERT OR UPDATE ON rubrics
  FOR EACH ROW EXECUTE FUNCTION validate_rubric_criteria();

-- Create a utility function to safely get a user's current phase
CREATE OR REPLACE FUNCTION get_current_user_phase(user_id UUID, course_id UUID) 
RETURNS TABLE (phase_id UUID, phase_name TEXT, scaffolding_level INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lp.id, 
    lp.name, 
    COALESCE(pp.current_scaffolding_level, 1) as scaffolding_level
  FROM 
    user_courses uc
  LEFT JOIN
    learning_phases lp ON uc.current_phase_id = lp.id
  LEFT JOIN
    phase_progress pp ON pp.user_course_id = uc.id AND pp.phase_id = lp.id
  WHERE 
    uc.user_id = get_current_user_phase.user_id 
    AND uc.course_id = get_current_user_phase.course_id
  LIMIT 1;
  
  -- If no row returned, return the first phase as default
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      lp.id, 
      lp.name, 
      1::INTEGER as scaffolding_level
    FROM 
      learning_phases lp
    WHERE 
      lp.sequence_order = 1
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to safely insert a conversation with proper defaults
CREATE OR REPLACE FUNCTION create_conversation(
  p_user_id UUID,
  p_phase_progress_id UUID,
  p_agent_type TEXT
) RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Insert with reasonable defaults
  INSERT INTO conversations (
    user_id, 
    phase_progress_id, 
    agent_type, 
    context
  ) VALUES (
    p_user_id,
    p_phase_progress_id,
    COALESCE(p_agent_type, 'manager'),
    '{}'::jsonb
  ) RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql; 