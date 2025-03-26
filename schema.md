# SoLBot Learning Platform - Data Schema

## Entity Relationship Diagram

```
[users] 1---* [user_courses] *---1 [courses]
  |               |                  |
  |               |                  |
  *               |                  *
[user_activity]   |             [resources]
                  |
                  *
          [phase_progress] 1---* [assessments] 1---* [criterion_scores]
                  |                  |                     |
                  |                  |                     |
                  *                  *                     *
           [conversations]       [rubrics] 1---* [rubric_criteria]
                  |                |
                  |                |
                  *                *
              [messages]    [scaffolding_history]

[user_courses] 1---* [user_goals]
       |
       *
[monitoring_records]

[phase_progress] *---1 [learning_phases]
```

## Database Tables

### Core Tables

#### users
Stores user authentication and profile information:
- `id`: UUID primary key
- `email`: User's email (unique)
- `created_at`: Account creation timestamp
- `last_login`: Last login timestamp
- `full_name`: User's full name
- `education_level`: Educational background
- `background`: General background information
- `gender`: User's gender
- `age`: User's age
- `race`: User's race/ethnicity
- `is_first_generation`: Whether user is a first-generation university student
- `preferred_language`: User's preferred language
- `learning_style`: User's learning style preference
- `preferences`: JSON field for additional user preferences
- `is_active`: Account status

#### courses
Available courses for users to select:
- `id`: UUID primary key
- `title`: Course title
- `description`: Course description
- `difficulty_level`: Course difficulty
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### learning_phases
The six SRL phases defined in the platform:
- `id`: UUID primary key
- `name`: Phase name
- `description`: Phase description
- `sequence_order`: Order in the learning sequence
- `estimated_duration`: Estimated minutes to complete

#### user_courses
Tracks user enrollment in courses:
- `id`: UUID primary key
- `user_id`: Reference to users table
- `course_id`: Reference to courses table
- `current_phase_id`: Current learning phase
- `started_at`: Enrollment timestamp
- `completed_at`: Completion timestamp

### Progress Tracking

#### phase_progress
Tracks user progress through learning phases:
- `id`: UUID primary key
- `user_course_id`: Reference to user_courses
- `phase_id`: Reference to learning_phases
- `started_at`: Phase start timestamp
- `completed_at`: Phase completion timestamp
- `current_scaffolding_level`: Current support level (1-3)
- `status`: Progress status (in_progress, completed, paused)
- `interaction_state`: JSON field tracking component completion state
- `incomplete_criteria`: JSON array of incomplete criteria

#### assessments
Stores rubric-based assessment scores:
- `id`: UUID primary key
- `phase_progress_id`: Reference to phase_progress
- `rubric_id`: Reference to rubrics
- `score`: Overall assessment score
- `feedback`: Textual feedback
- `assessed_at`: Assessment timestamp
- `assessed_by`: Agent that performed assessment

#### criterion_scores
Stores individual criterion scores for assessments:
- `id`: UUID primary key
- `assessment_id`: Reference to assessments
- `criterion_id`: Reference to rubric_criteria
- `score`: Score for this specific criterion (typically 1-3)
- `feedback`: Criterion-specific feedback
- `missing`: Whether this criterion was missing from response
- `assessed_at`: Assessment timestamp

#### rubrics
Assessment criteria for each phase:
- `id`: UUID primary key
- `phase_id`: Reference to learning_phases
- `name`: Rubric name
- `description`: Rubric description
- `max_score`: Maximum possible score
- `scoring_scale`: Scale used for scoring (e.g., "1-3")
- `scaffolding_mapping`: JSON field mapping scores to scaffolding levels
- `criteria`: JSON field with additional scoring criteria

#### rubric_criteria
Individual criteria within rubrics:
- `id`: UUID primary key
- `rubric_id`: Reference to rubrics
- `name`: Criterion name
- `description`: Criterion description
- `max_score`: Maximum possible score (typically 3)
- `weight`: Weight for weighted average calculations
- `required`: Whether this criterion is required

#### scaffolding_history
Tracks changes in scaffolding levels:
- `id`: UUID primary key
- `phase_progress_id`: Reference to phase_progress
- `previous_level`: Previous scaffolding level
- `new_level`: New scaffolding level
- `reason`: Reason for level change
- `changed_at`: Timestamp of change
- `triggered_by`: What triggered the change (assessment, manual, system)
- `assessment_id`: Reference to triggering assessment (if applicable)

### AI Agent Interactions

#### conversations
Stores conversation sessions with AI agents:
- `id`: UUID primary key
- `user_id`: Reference to users table
- `phase_progress_id`: Reference to phase_progress
- `agent_type`: Type of AI agent
- `started_at`: Conversation start timestamp
- `ended_at`: Conversation end timestamp
- `summary`: Conversation summary
- `context`: JSON field with conversation context

#### messages
Individual messages within conversations:
- `id`: UUID primary key
- `conversation_id`: Reference to conversations
- `sender_type`: Message sender (user/agent)
- `agent_type`: Type of agent (for agent messages)
- `content`: Message content
- `timestamp`: Message timestamp
- `metadata`: JSON field with message metadata

### Learning Content

#### resources
Learning materials for courses:
- `id`: UUID primary key
- `course_id`: Reference to courses
- `phase_id`: Reference to learning_phases
- `title`: Resource title
- `resource_type`: Type (video, text, quiz)
- `content`: Text content (if applicable)
- `url`: Resource URL (if applicable)
- `metadata`: JSON field with additional information

### Goal Management

#### user_goals
Goals set during the goal-setting phase:
- `id`: UUID primary key
- `user_course_id`: Reference to user_courses
- `title`: Goal title
- `description`: Goal description
- `goal_type`: Type (long-term, SMART, IF-THEN)
- `target_date`: Goal target date
- `status`: Goal status (active, completed, abandoned)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Monitoring

#### monitoring_records
Records for the monitoring phase:
- `id`: UUID primary key
- `user_id`: Reference to users
- `user_course_id`: Reference to user_courses
- `record_date`: Record timestamp
- `progress_metrics`: JSON field with progress metrics
- `self_reflection`: User's self-reflection
- `adaptation_strategy`: Strategy for adaptation

#### user_activity
General activity tracking:
- `id`: UUID primary key
- `user_id`: Reference to users
- `activity_type`: Type of activity
- `timestamp`: Activity timestamp
- `metadata`: JSON field with activity details

## Key Relationships

1. A user can enroll in multiple courses
2. Each course consists of multiple learning phases
3. User progress is tracked at the phase level
4. AI agent interactions are linked to specific phases
5. Assessments are tied to phase progress and use rubrics
6. Individual criterion scores make up an assessment
7. Rubric criteria define what's being assessed
8. Scaffolding history tracks changes in support levels
9. Goals and monitoring records are associated with user's course progress

## Rubric Scoring and Scaffolding

The platform uses a 1-3 scoring scale for most criteria:
- **1 (Needs Improvement)**: Triggers high support scaffolding (Level 1)
- **2 (Satisfactory)**: Triggers medium support scaffolding (Level 2)
- **3 (Excellent)**: Triggers low support scaffolding (Level 3)

Scaffolding levels can be determined through different methods:
- **Average Method**: Takes the average of all criterion scores
- **Minimum Method**: Uses the lowest criterion score to determine the level
- **Weighted Method**: Applies weights to different criteria

The platform supports tracking partially completed assessments, with the ability to mark certain criteria as "missing" until they are addressed by the student. 