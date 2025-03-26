-- SoLBot Learning Platform Seed Data
-- Migration: 002_seed_data

-- Seed learning phases
INSERT INTO learning_phases (name, description, sequence_order, estimated_duration) VALUES
('Introduction & Pre-Assessment', 'Introduction to the course and assessment of baseline SRL capabilities', 1, 30),
('Learning Objectives Definition', 'Defining clear learning objectives for the course', 2, 40),
('Learning Strategies', 'Developing effective learning strategies', 3, 45),
('Goal Setting', 'Setting SMART goals and IF-THEN contingency plans', 4, 40),
('Monitoring & Adaptation', 'Monitoring progress and adapting strategies as needed', 5, 50),
('Summary & Visualization', 'Summarizing and visualizing learning progress', 6, 35);

-- Seed sample courses
INSERT INTO courses (title, description, difficulty_level) VALUES
('Introduction to Computer Science', 'Foundational concepts in computer science including algorithms, data structures, and programming basics', 'Beginner'),
('Data Science Fundamentals', 'Introduction to data analysis, visualization, and basic machine learning concepts', 'Intermediate'),
('Web Development Essentials', 'Core skills for web development including HTML, CSS, JavaScript, and responsive design', 'Beginner');

-- Seed rubrics for each phase
-- Phase 1: Introduction & Pre-Assessment
INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
SELECT id, 'SRL Pre-Assessment', 'Assessment of baseline self-regulated learning capabilities', 10,
jsonb_build_object(
  'prior_knowledge', jsonb_build_object('description', 'Understanding of subject matter', 'weight', 2),
  'metacognitive_awareness', jsonb_build_object('description', 'Awareness of own learning processes', 'weight', 3),
  'learning_strategy_familiarity', jsonb_build_object('description', 'Familiarity with effective learning strategies', 'weight', 3),
  'goal_setting_experience', jsonb_build_object('description', 'Experience with goal setting and planning', 'weight', 2)
)
FROM learning_phases WHERE name = 'Introduction & Pre-Assessment';

-- Phase 2: Learning Objectives Definition
INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
SELECT id, 'Learning Objectives Quality', 'Assessment of student-defined learning objectives', 10,
jsonb_build_object(
  'clarity', jsonb_build_object('description', 'Clarity and specificity of objectives', 'weight', 3),
  'relevance', jsonb_build_object('description', 'Relevance to course content', 'weight', 2),
  'measurability', jsonb_build_object('description', 'Ability to measure progress toward objectives', 'weight', 3),
  'alignment', jsonb_build_object('description', 'Alignment with personal learning goals', 'weight', 2)
)
FROM learning_phases WHERE name = 'Learning Objectives Definition';

-- Phase 3: Learning Strategies
INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
SELECT id, 'Strategy Selection', 'Assessment of learning strategy selection and planning', 10,
jsonb_build_object(
  'strategy_diversity', jsonb_build_object('description', 'Use of multiple complementary strategies', 'weight', 2),
  'strategy_appropriateness', jsonb_build_object('description', 'Appropriateness for content type', 'weight', 3),
  'strategy_specificity', jsonb_build_object('description', 'Specific implementation details', 'weight', 3),
  'resource_utilization', jsonb_build_object('description', 'Planned utilization of available resources', 'weight', 2)
)
FROM learning_phases WHERE name = 'Learning Strategies';

-- Phase 4: Goal Setting
INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
SELECT id, 'Goal Quality', 'Assessment of SMART goals and contingency plans', 10,
jsonb_build_object(
  'specificity', jsonb_build_object('description', 'Specific and clearly defined goals', 'weight', 2),
  'measurability', jsonb_build_object('description', 'Measurable success criteria', 'weight', 2),
  'achievability', jsonb_build_object('description', 'Realistic and achievable goals', 'weight', 2),
  'relevance', jsonb_build_object('description', 'Relevance to learning objectives', 'weight', 2),
  'time_bound', jsonb_build_object('description', 'Clear timeframes and deadlines', 'weight', 1),
  'contingency_plans', jsonb_build_object('description', 'Quality of IF-THEN contingency plans', 'weight', 1)
)
FROM learning_phases WHERE name = 'Goal Setting';

-- Phase 5: Monitoring & Adaptation
INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
SELECT id, 'Monitoring Process', 'Assessment of monitoring and adaptation strategies', 10,
jsonb_build_object(
  'tracking_method', jsonb_build_object('description', 'Effectiveness of progress tracking method', 'weight', 3),
  'self_reflection', jsonb_build_object('description', 'Quality of self-reflection', 'weight', 2),
  'obstacle_identification', jsonb_build_object('description', 'Identification of obstacles and challenges', 'weight', 2),
  'strategy_adaptation', jsonb_build_object('description', 'Appropriate adaptation of strategies', 'weight', 3)
)
FROM learning_phases WHERE name = 'Monitoring & Adaptation';

-- Phase 6: Summary & Visualization
INSERT INTO rubrics (phase_id, name, description, max_score, criteria)
SELECT id, 'Learning Journey Summary', 'Assessment of learning journey reflection and visualization', 10,
jsonb_build_object(
  'completeness', jsonb_build_object('description', 'Completeness of journey documentation', 'weight', 3),
  'insight_quality', jsonb_build_object('description', 'Quality of insights and reflections', 'weight', 3),
  'visualization_effectiveness', jsonb_build_object('description', 'Effectiveness of progress visualization', 'weight', 2),
  'future_application', jsonb_build_object('description', 'Plans for future application of SRL strategies', 'weight', 2)
)
FROM learning_phases WHERE name = 'Summary & Visualization';

-- Sample resources for Computer Science course
INSERT INTO resources (course_id, phase_id, title, resource_type, url, metadata)
SELECT 
  c.id,
  p.id,
  'Introduction to Algorithms',
  'video',
  'https://example.com/intro-algorithms',
  jsonb_build_object('duration', '15:30', 'creator', 'Prof. Smith', 'difficulty', 'beginner')
FROM 
  courses c,
  learning_phases p
WHERE 
  c.title = 'Introduction to Computer Science' AND
  p.name = 'Learning Objectives Definition';

INSERT INTO resources (course_id, phase_id, title, resource_type, content, metadata)
SELECT 
  c.id,
  p.id,
  'Setting SMART Goals in CS Learning',
  'text',
  'This guide will help you set Specific, Measurable, Achievable, Relevant, and Time-bound goals for your computer science studies...',
  jsonb_build_object('reading_time', '5 min', 'source', 'Learning Center', 'related_topics', ARRAY['goal setting', 'student success'])
FROM 
  courses c,
  learning_phases p
WHERE 
  c.title = 'Introduction to Computer Science' AND
  p.name = 'Goal Setting'; 