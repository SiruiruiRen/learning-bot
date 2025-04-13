from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

# Request models
class ChatRequest(BaseModel):
    user_id: str
    phase: str
    message: str
    conversation_id: Optional[str] = None
    component: Optional[str] = None
    raw_message: Optional[str] = None
    is_new_phase: Optional[bool] = False

# Response models
class ChatResponse(BaseModel):
    message: str
    phase: str
    component: Optional[str] = None
    agent_type: str
    scaffolding_level: int = 2
    timestamp: datetime = Field(default_factory=datetime.now)
    conversation_id: Optional[str] = None
    next_phase: Optional[str] = None
    next_intro_stage: Optional[str] = None

# Agent state models
class UserProfile(BaseModel):
    id: str
    full_name: Optional[str] = None
    education_level: Optional[str] = None
    background: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    learning_style: Optional[str] = None

class RubricResult(BaseModel):
    criteria: str
    score: int
    feedback: Optional[str] = None

class EvaluationResults(BaseModel):
    overall_score: float
    scaffolding_level: int
    criteria_scores: List[RubricResult]

# Removed AgentState TypedDict as it's no longer needed with direct LLM approach

# Rubric criteria models for each phase
class Phase2Criteria(BaseModel):
    specificity: int = 1
    cognitive_level: int = 1
    prior_knowledge: int = 1

class Phase4Criteria(BaseModel):
    alignment: int = 1
    timeframe: int = 1
    measurability: int = 1
    smart_elements: int = 1
    progressive_sequence: int = 1
    long_term_alignment: int = 1
    challenge_specificity: int = 1
    response_clarity: int = 1
    feasibility: int = 1

class Phase5Criteria(BaseModel):
    check_in_specificity: int = 1
    frequency: int = 1
    action_connection: int = 1
    trigger_clarity: int = 1
    strategy_specificity: int = 1
    resource_adjustment: int = 1
    measurability: int = 1
    alignment: int = 1
    granularity: int = 1 