# SoLBot - Self-Regulated Learning Bot

SoLBot is a multi-agent system designed to help students develop effective learning strategies through a phase-based approach to self-regulated learning.

## Architecture Overview

SoLBot uses a simplified multi-agent architecture where agents are responsible for different phases of the self-regulated learning process:

1. **Intro Agent** - Handles onboarding and establishing learning goals
2. **Phase 2 Agent (Task Understanding)** - Helps with task analysis and organization
3. **Phase 4 Agent (Learning Strategy Selection)** - Provides learning strategies and techniques
4. **Phase 5 Agent (Reflection & Monitoring)** - Supports progress monitoring and adaptation
5. **Summary Agent** - Provides comprehensive learning journey overviews

The system uses a FastAPI backend that routes user messages to the appropriate phase agent, which then generates contextually relevant responses.

## Implementation Details

### Key Components

- **SimpleAgent**: A lightweight multi-agent implementation that handles conversation context and agent routing
- **Claude 3.5 Integration**: Uses Anthropic's Claude 3.5 model with the Messages API for high-quality responses
- **In-Memory Database**: Maintains conversation history and user profiles in memory with Supabase integration for persistence
- **System Prompts**: Phase-specific prompts guide Claude to respond appropriately based on the learning phase
- **Scaffolding Levels**: Support for different levels of guidance (high/medium/low) based on student needs

### Environment Variables

The system requires the following environment variables:
- `ANTHROPIC_API_KEY`: API key for Claude
- `CLAUDE_MODEL`: The Claude model to use (e.g., "claude-3-5-sonnet-20240620")
- `PORT`: Port for the API server
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase URL (optional)
- `SUPABASE_SERVICE_KEY`: Supabase service key (optional)

## Running the System

1. Install dependencies:
```
pip install -r requirements.txt
```

2. Set up environment variables in `.env` file

3. Run the backend:
```
python run_backend.py
```

4. The API will be available at `http://localhost:8082`

## API Endpoints

- **POST /api/chat/**: Main chat endpoint
  - Request body:
    ```json
    {
      "user_id": "user123",
      "phase": "intro",
      "component": "welcome",
      "message": "Hello, I want to learn better"
    }
    ```
  - Response:
    ```json
    {
      "message": "Hi! I'm your learning assistant...",
      "phase": "intro",
      "component": "welcome",
      "agent_type": "intro",
      "scaffolding_level": 2,
      "timestamp": "2025-03-23T20:55:13.005Z"
    }
    ```

- **GET /health**: Health check endpoint
  - Response: `{"status": "healthy"}` 