# SoLBot Backend

This is the backend implementation for SoLBot, a self-regulated learning platform that helps students develop effective learning strategies through a phase-based approach with direct LLM integration.

## Architecture

The backend uses FastAPI with direct Claude API integration for handling different learning phases:

- **Single LLM Architecture**: Each request is processed through a direct call to Claude with phase-specific prompts
- **Phase Processing**: Different phases have customized prompts and evaluation criteria
  - Intro: Onboarding and user profile collection
  - Phase 2: Task understanding
  - Phase 4: Learning strategy selection
  - Phase 5: Reflection and monitoring
  - Summary: Learning journey overview

The system uses Claude 3.5 with rubric-based evaluation for adaptive scaffolding.

## Setup Instructions

### Prerequisites

- Python 3.9+
- Supabase account (for database)
- Anthropic API key (for Claude 3.5)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

### Installation

1. Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

### Database Setup

1. Create required tables in Supabase (see `schema.sql` or `supabase_tables.sql`)
2. Ensure you have the correct permissions set for service key access

### Running the Backend

Start the FastAPI server:

```bash
python -m backend.main
```

The server will run on http://localhost:8081 by default.

### API Endpoints

- **POST /api/chat**: Process chat messages
  - Request: `{ "user_id": "123", "phase": "phase2", "message": "Hello", "component": "general" }`
  - Response: `{ "message": "...", "phase": "phase2", "agent_type": "phase2", "scaffolding_level": 2 }`

- **GET /api/user/{user_id}**: Get user profile
- **POST /api/user**: Create new user
- **PUT /api/user/{user_id}**: Update user profile
- **GET /api/scores/{user_id}**: Get user scores

## Rubrics & Adaptive Scaffolding

The backend implements dynamic scaffolding levels (1-3) based on rubric evaluations:

- **Level 1 (High Support)**: Detailed templates and step-by-step guidance
- **Level 2 (Medium Support)**: Partial examples and guided questions
- **Level 3 (Low Support)**: Minimal guidance, focused on refinement

See `backend/rubrics/` for detailed rubric criteria for each phase.

## Testing

Run tests with pytest:

```bash
pytest backend/tests/
``` 