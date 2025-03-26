# SoLBot Project Summary

## Project Overview
SoLBot is a self-regulated learning platform that helps students develop effective learning strategies through a phase-based agent system. The platform uses specialist agents for different aspects of the learning process, with frontend pages corresponding to specific learning phases.

## Agent Architecture

### Manager Agent
- Routes user messages to appropriate specialist agents
- Prioritizes frontend-specified phase for agent selection
- Falls back to content-based routing only when no phase is specified

### Phase Agents

1. **Intro Agent**
   - Purpose: Onboarding and user profile collection
   - Components: welcome, name, major, challenges, goals
   - Role: Learning Journey Guide
   - Key features: Personalized interaction, profile building

2. **Phase 2 Agent - Task Understanding**
   - Purpose: Help analyze learning tasks and identify resources
   - Role: Learning Strategy Architect
   - Key features: Task breakdown, resource matching, timeline planning
   - Output: Structured learning plans with JSON formatting

3. **Phase 4 Agent - Learning Strategy Selection**
   - Purpose: Develop effective learning approaches
   - Components: strategies, assessment, planning
   - Features: Strategy recommendation, technique explanation

4. **Phase 5 Agent - Reflection and Monitoring**
   - Purpose: Track learning progress and adapt strategies
   - Components: monitoring, reflection, adaptation
   - Features: Progress evaluation, strategy refinement

5. **Specialist Agent**
   - Base class for all phase agents
   - Provides common agent functionality
   - Manages conversation flow and context

6. **Summary Agent**
   - Purpose: Provide overviews of learning journey
   - Components: overview, next_steps
   - Features: Progress summarization, recommendation synthesis

## Implementation Notes

- Agents use a task-based approach for processing user messages
- JSON-formatted responses support frontend rendering
- Phase continuity is maintained through user context
- User profile information persists across sessions
- Agents adapt to different scaffolding levels based on user progress

## Backend Rewrite Considerations

For rewriting the backend with a new approach:
1. Maintain the phase-based architecture concept
2. Keep the frontend-specified phase routing logic
3. Preserve the specialized agent roles and functionalities
4. Ensure consistent JSON response formats for frontend rendering
5. Consider expanding the agent capabilities with improved reasoning 