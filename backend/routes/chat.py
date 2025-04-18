"""
Chat API routes
"""

import logging
import asyncio
from typing import Dict, List, Any, Optional, Union
import uuid
from datetime import datetime
import traceback
import time
import re
import json
import sys
import os
sys.path.append(os.path.abspath('..'))
from prompt_engineering.scripts.final_prompts import FINAL_PROMPTS

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

# Remove manager agent import and replace with direct LLM utility
from backend.utils.llm import call_claude_api
from backend.models.schemas import ChatRequest, ChatResponse
from backend.utils.db import save_message, get_user_profile, get_messages, _memory_db, _using_memory_db, save_scaffolding_level

logger = logging.getLogger("solbot.routes.chat")

# Create router
router = APIRouter(prefix="/api/chat", tags=["chat"])

# Simple in-memory cache for recent responses
# This is a very basic cache - for production, consider using a proper caching solution
_response_cache = {}
_cache_ttl = 60  # Cache entries expire after 60 seconds

def _get_cache_key(user_id: str, phase: str, message: str) -> str:
    """Generate a cache key based on user, phase, and message"""
    # Strip whitespace and use first 100 chars to increase cache hit rate
    message_normalized = message.strip()[:100]
    return f"{user_id}:{phase}:{hash(message_normalized)}"

def _cache_response(user_id: str, phase: str, message: str, response: dict):
    """Cache a response for future use"""
    key = _get_cache_key(user_id, phase, message)
    _response_cache[key] = {
        "response": response,
        "timestamp": time.time()
    }

def _get_cached_response(user_id: str, phase: str, message: str) -> Optional[dict]:
    """Get a cached response if available and not expired"""
    key = _get_cache_key(user_id, phase, message)
    if key in _response_cache:
        cache_entry = _response_cache[key]
        if time.time() - cache_entry["timestamp"] < _cache_ttl:
            return cache_entry["response"]
        else:
            # Remove expired cache entry
            del _response_cache[key]
    return None

def _get_system_prompt(phase: str, component: str, scaffolding_level: int) -> str:
    """Generate appropriate system prompt based on phase, component and scaffolding level"""
    
    # Define criteria sections based on phase
    phase_criteria = {
        "phase2": "• Goal Clarity: [⚠️/💡/✅] [brief feedback]\n• Background Connection: [⚠️/💡/✅] [brief feedback]\n• Study Resources: [⚠️/💡/✅] [brief feedback]",
        "phase4_long_term": "• Goal Clarity: [⚠️/💡/✅] [brief feedback]\n• Timeline: [⚠️/💡/✅] [brief feedback]\n• Measurement: [⚠️/💡/✅] [brief feedback]",
        "phase4_short_term": "• SMART Elements: [⚠️/💡/✅] [brief feedback]\n• Step-by-step Plan: [⚠️/💡/✅] [brief feedback]\n• Long-term Alignment: [⚠️/💡/✅] [brief feedback]",
        "phase4_contingency": "• Problem Description: [⚠️/💡/✅] [brief feedback]\n• Response Clarity: [⚠️/💡/✅] [brief feedback]\n• Feasibility: [⚠️/💡/✅] [brief feedback]",
        "phase5": "• Progress Checks: [⚠️/💡/✅] [brief feedback]\n• Adaptation Trigger: [⚠️/💡/✅] [brief feedback]\n• Strategy Alternatives: [⚠️/💡/✅] [brief feedback]\n• Success Criteria: [⚠️/💡/✅] [brief feedback]"
    }
    
    # Select the right criteria based on phase and component
    criteria_section = phase_criteria.get(phase)
    phase_focus = "strategy"
    
    # Handle phase4 with different components
    if phase == "phase4":
        if component in ["longtermgoal", "long_term_goals"]:
            criteria_section = phase_criteria["phase4_long_term"]
            phase_focus = "long-term goal"
        elif component in ["shorttermgoal", "short_term_goals"]:
            criteria_section = phase_criteria["phase4_short_term"]
            phase_focus = "short-term goal"
        elif component in ["ifthen", "contingency_strategies"]:
            criteria_section = phase_criteria["phase4_contingency"]
            phase_focus = "contingency strategies"
    elif phase == "phase2":
        phase_focus = "learning objective"
    elif phase == "phase5":
        phase_focus = "monitoring & adaptation system"
            
    # Use generic template if no specific criteria found
    if not criteria_section:
        criteria_section = "• Key Element 1: [⚠️/💡/✅] [brief feedback]\n• Key Element 2: [⚠️/💡/✅] [brief feedback]\n• Key Element 3: [⚠️/💡/✅] [brief feedback]"
    
    # Get the rubric for this phase and component - try importing from backend.rubrics
    try:
        # Remove the rubrics import since we don't need it
        rubric = None
    except Exception:
        rubric = None
    
    # Create base prompt with consistent structure
    prompt = f"""You are SoLBot, an AI tutor for self-regulated learning.

Your response MUST follow this exact structure:

## Greeting
Brief, personalized greeting acknowledging the student's focus.

## Assessment
```
Looking at your {phase_focus}:
{criteria_section}
```

## Guidance
Provide specific, actionable advice using templates, examples, or frameworks appropriate to their current level.

## Next Steps
Progress indicator: [▫▫▫▫▫▫] (X%)
Ask ONE reflection question to deepen their understanding.

When student achieves excellence (score ≥ 2.5), end with: "Your {phase_focus} is excellent! Please click the Continue button below to proceed to the next step in your learning journey."

Use supportive, encouraging tone with educational emojis (🔍, 📝, 🔄, 📊, 🎯).

⚠️ SCORING INSTRUCTIONS (NOT VISIBLE TO STUDENTS):
Score 1-3 on each criterion.
Calculate overall Score as the average.
Set Scaffolding level based on score:
- Score <1.5: Scaffolding 3 (HIGH support)
- Score 1.5-2.0: Scaffolding 2 (MEDIUM support)
- Score >2.0: Scaffolding 1 (LOW support)

ALWAYS end with metadata in this exact format:
<!-- INSTRUCTOR_METADATA
Score: [1.0-3.0]
Scaffolding: [1-3]
[Phase-specific criteria scores]
Rationale: [brief explanation]
-->"""

    return prompt

@router.post("/")
async def process_chat(request: dict):
    """Process a chat message and return a response using direct Claude API call"""
    start_time = time.time()
    
    try:
        # Extract request parameters
        user_id = request.get("user_id")
        phase = request.get("phase", "intro").lower()
        message = request.get("message", "")
        component = request.get("component", "general")
        conversation_id = request.get("conversation_id")
        
        # Validate required fields
        if not user_id or not phase or not message:
            return {"error": "userId, phase, and message are required", "status": "error"}
        
        logger.info(f"Processing request: phase={phase}, component={component}, userId={user_id[:8]}...")
        logger.info(f"Message: \"{message[:20]}...\"")
        
        # Check cache first for identical request
        cached_response = _get_cached_response(user_id, phase, message)
        if cached_response:
            logger.info(f"Using cached response for user {user_id[:8]}")
            return {"success": True, "data": cached_response}
            
        # Check if the phase is intro or summary - return a direct response without LLM call
        if phase == "intro" or phase == "summary":
            # Generate or retrieve a conversation ID if not provided
            if not conversation_id:
                conversation_id = f"conv_{uuid.uuid4()}"
                
            # For intro phase - direct to phase1
            if phase == "intro":
                response_message = "Thank you for your information. Please proceed to Phase 1 to begin your learning journey."
                next_phase = "phase1"
            # For summary phase - provide completion message
            else:  # summary
                response_message = "Congratulations on completing all phases! Your learning journey has been saved."
                next_phase = None
                
            # Create response data without LLM call
            response_data = {
                "message": response_message,
                "conversation_id": conversation_id,
                "phase": phase,
                "component": component,
                "agent_type": phase,
                "scaffolding_level": 2,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat(),
                "status": "success",
                "next_phase": next_phase
            }
            
            # Save the message to database
            # Using try-except since we're not sure if these are async functions
            try:
                save_message(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    role="user",
                    content=message,
                    phase=phase,
                    component=component
                )
                
                # Save the response to database
                save_message(
                    user_id=user_id,
                    conversation_id=conversation_id,
                    role="assistant",
                    content=response_message,
                    phase=phase,
                    component=component,
                    metadata={
                        "agent_type": phase,
                        "scaffolding_level": 2,
                        "next_phase": next_phase
                    }
                )
            except Exception as e:
                logger.error(f"Error saving messages: {e}")
            
            return {"success": True, "data": response_data}
        
        # For all other phases, process with the LLM
        
        # Set initial scaffolding level (default to 2 - medium support)
        scaffolding_level = 2
        
        # Set agent type based on phase
        agent_type = phase
        
        # Generate a new conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            
        # Get the appropriate prompt based on phase and component
        if phase == "phase2":
            system_prompt = FINAL_PROMPTS["phase2_learning_objectives"]
        elif phase == "phase4":
            if component in ["longtermgoal", "long_term_goals"]:
                system_prompt = FINAL_PROMPTS["phase4_long_term_goals"]
            elif component in ["shorttermgoal", "short_term_goals"]:
                system_prompt = FINAL_PROMPTS["phase4_short_term_goals"]
            elif component in ["ifthen", "contingency_strategies"]:
                system_prompt = FINAL_PROMPTS["phase4_contingency_strategies"]
            else:
                system_prompt = FINAL_PROMPTS["phase4_long_term_goals"]  # Default for phase 4
        elif phase == "phase5":
            system_prompt = FINAL_PROMPTS["phase5_monitoring_adaptation"]
        else:
            # For other phases that don't have specific prompts yet
            system_prompt = _get_system_prompt(phase, component, scaffolding_level)
        
        # Get recent conversation history (last 8 messages)
        # Using try-except since we're not sure if get_messages is async
        try:
            chat_history = get_messages(user_id, conversation_id, limit=8)
            
            # Format chat history for LLM
            formatted_history = []
            if chat_history:
                for msg in chat_history:
                    # Add each message to the context
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role in ["user", "assistant"] and content:
                        formatted_history.append({
                            "role": role, 
                            "content": content
                        })
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            formatted_history = []
        
        # Save the user message first to get a message_id
        message_id = None
        try:
            saved_message = save_message(
                user_id=user_id,
                conversation_id=conversation_id,
                role="user",
                content=message,
                phase=phase,
                component=component,
                metadata={
                    "raw_message": request.get("raw_message", message),
                    "is_submission": request.get("is_submission", False),
                    "submission_type": request.get("submission_type")
                }
            )
            message_id = saved_message.get("id")
        except Exception as e:
            logger.error(f"Error saving user message: {e}")
        
        # Make API call to Claude with all necessary context for logging
        response = await call_claude_api(
            system_prompt=system_prompt,
            user_message=message,
            chat_history=formatted_history,
            temperature=0.5,  
            max_tokens=1000,   # Reduced max tokens for faster responses
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            phase=phase,
            component=component
        )
        
        # Handle API error
        if "error" in response:
            logger.error(f"API error: {response['error']}")
            return {"error": "Failed to generate response", "details": response.get("error"), "status": "error"}
            
        # Extract the response content
        content = response.get("content", "")
        
        # -------------------------------------------------------------------------
        # Extract evaluation scores and metadata but retain them in the response
        # -------------------------------------------------------------------------
        score = None
        recommended_scaffolding = None
        specificity_score = None
        timeline_score = None
        measurement_score = None
        rationale = None
        extracted_metadata = {}
        
        # 1. Extract from HTML comment format (preferred new format)
        # Format: <!-- INSTRUCTOR_METADATA\nScore: 2.1\nScaffolding: 2\n... -->
        html_metadata_start = content.find("<!-- INSTRUCTOR_METADATA")
        html_metadata_end = content.find("-->", html_metadata_start) if html_metadata_start != -1 else -1
        
        if html_metadata_start != -1 and html_metadata_end != -1:
            # Extract the metadata section
            metadata_text = content[html_metadata_start:html_metadata_end + 3]
            logger.info(f"Found instructor metadata in HTML comment format")
            
            # Important: No longer remove metadata from visible content
            # Just extract the values for database storage
            
            # Parse score and scaffolding level
            for line in metadata_text.split('\n'):
                line = line.strip()
                if line.startswith("Score:"):
                    try:
                        score = float(line.replace("Score:", "").strip())
                        extracted_metadata["score"] = score
                    except ValueError:
                        logger.warning(f"Could not parse Score from metadata: {line}")
                elif line.startswith("Scaffolding:"):
                    try:
                        recommended_scaffolding = int(line.replace("Scaffolding:", "").strip())
                        extracted_metadata["scaffolding_level"] = recommended_scaffolding
                    except ValueError:
                        logger.warning(f"Could not parse Scaffolding from metadata: {line}")
                elif line.startswith("Specificity:"):
                    try:
                        specificity_score = int(line.replace("Specificity:", "").strip())
                        extracted_metadata["specificity_score"] = specificity_score
                    except ValueError:
                        logger.warning(f"Could not parse Specificity from metadata: {line}")
                elif line.startswith("Timeline:"):
                    try:
                        timeline_score = int(line.replace("Timeline:", "").strip())
                        extracted_metadata["timeline_score"] = timeline_score
                    except ValueError:
                        logger.warning(f"Could not parse Timeline from metadata: {line}")
                elif line.startswith("Measurement:"):
                    try:
                        measurement_score = int(line.replace("Measurement:", "").strip())
                        extracted_metadata["measurement_score"] = measurement_score
                    except ValueError:
                        logger.warning(f"Could not parse Measurement from metadata: {line}")
                elif line.startswith("Rationale:"):
                    rationale = line.replace("Rationale:", "").strip()
                    extracted_metadata["rationale"] = rationale
            
            logger.info(f"Extracted score: {score}, scaffolding: {recommended_scaffolding}")
        
        # 2. Extract from older HTML comment format (fallback)
        # Format: <!-- INSTRUCTOR NOTE: Goal Score: 2.1/3.0, Recommended Scaffolding: Level 2 -->
        elif "<!-- INSTRUCTOR NOTE:" in content:
            note_start = content.find("<!-- INSTRUCTOR NOTE:")
            note_end = content.find("-->", note_start)
            
            if note_start != -1 and note_end != -1:
                # Extract the instructor note
                instructor_note = content[note_start:note_end + 3]
                logger.info(f"Found instructor note in older HTML format")
                
                # Remove the instructor note from the content shown to the user
                content = content[:note_start].strip()
                
                # Parse score from note
                score_match = re.search(r"Goal Score: (\d+\.\d+)\/3\.0", instructor_note)
                if score_match:
                    try:
                        score = float(score_match.group(1))
                        extracted_metadata["score"] = score
                        logger.info(f"Extracted score: {score}")
                    except ValueError:
                        logger.warning(f"Could not convert score to float: {score_match.group(1)}")
                
                # Parse scaffolding level from note
                scaffolding_match = re.search(r"Scaffolding: Level (\d+)", instructor_note)
                if scaffolding_match:
                    try:
                        recommended_scaffolding = int(scaffolding_match.group(1))
                        extracted_metadata["scaffolding_level"] = recommended_scaffolding
                        logger.info(f"Extracted scaffolding level: {recommended_scaffolding}")
                    except ValueError:
                        logger.warning(f"Could not convert scaffolding level to int: {scaffolding_match.group(1)}")
                        
                extracted_metadata["instructor_note"] = instructor_note
        
        # 3. Extract from bracket format (fallback for existing format)
        # Format: [Evaluation Scores:\nAlignment: 2 (Partial alignment...)\nTimeframe: 2...]
        elif "[Evaluation Scores:" in content:
            bracket_start = content.find("[Evaluation Scores:")
            bracket_end = content.find("]", bracket_start) if bracket_start != -1 else -1
            
            if bracket_start != -1 and bracket_end != -1:
                # Extract the evaluation section
                evaluation_text = content[bracket_start:bracket_end + 1]
                logger.info(f"Found evaluation scores in bracket format")
                
                # Remove the evaluation section from the content shown to the user
                content = content[:bracket_start].strip()
                
                # Parse scores from evaluation text
                alignment_match = re.search(r"Alignment:\s+(\d+)", evaluation_text)
                if alignment_match:
                    try:
                        alignment_score = int(alignment_match.group(1))
                        extracted_metadata["alignment_score"] = alignment_score
                    except ValueError:
                        logger.warning(f"Could not parse alignment score: {alignment_match.group(1)}")
                        
                timeframe_match = re.search(r"Timeframe:\s+(\d+)", evaluation_text)
                if timeframe_match:
                    try:
                        timeframe_score = int(timeframe_match.group(1))
                        extracted_metadata["timeframe_score"] = timeframe_score
                    except ValueError:
                        logger.warning(f"Could not parse timeframe score: {timeframe_match.group(1)}")
                        
                measurability_match = re.search(r"Measurability:\s+(\d+)", evaluation_text)
                if measurability_match:
                    try:
                        measurability_score = int(measurability_match.group(1))
                        extracted_metadata["measurability_score"] = measurability_score
                    except ValueError:
                        logger.warning(f"Could not parse measurability score: {measurability_match.group(1)}")
                
                # Parse overall score
                overall_match = re.search(r"Overall Score:\s+([\d\.]+)", evaluation_text)
                if overall_match:
                    try:
                        score = float(overall_match.group(1))
                        extracted_metadata["score"] = score
                    except ValueError:
                        logger.warning(f"Could not parse overall score: {overall_match.group(1)}")
                
                # Extract support level or scaffolding recommendation
                support_match = re.search(r"Providing\s+(HIGH|MEDIUM|LOW)\s+support", evaluation_text, re.IGNORECASE)
                if support_match:
                    support_level = support_match.group(1).upper()
                    if support_level == "HIGH":
                        recommended_scaffolding = 1
                    elif support_level == "MEDIUM":
                        recommended_scaffolding = 2
                    elif support_level == "LOW":
                        recommended_scaffolding = 3
                    
                    extracted_metadata["scaffolding_level"] = recommended_scaffolding
                
                extracted_metadata["evaluation_text"] = evaluation_text
                logger.info(f"Extracted score: {score}, scaffolding: {recommended_scaffolding}")
        
        # Calculate overall score if not directly provided but component scores exist
        if score is None and specificity_score and timeline_score and measurement_score:
            score = (specificity_score + timeline_score + measurement_score) / 3.0
            extracted_metadata["score"] = score
            logger.info(f"Calculated overall score from components: {score}")
        
        # Determine scaffolding level if not directly provided but score exists
        if recommended_scaffolding is None and score is not None:
            if score < 1.5:
                recommended_scaffolding = 1  # High support
            elif score < 2.0:
                recommended_scaffolding = 2  # Medium support
            else:
                recommended_scaffolding = 3  # Low support
                
            extracted_metadata["scaffolding_level"] = recommended_scaffolding
            logger.info(f"Determined scaffolding level from score: {recommended_scaffolding}")
            
        # If we still don't have a scaffolding level, use default
        if recommended_scaffolding is None:
            recommended_scaffolding = scaffolding_level
            
        # Log all extracted metadata
        logger.info(f"All extracted metadata: {extracted_metadata}")
        
        # Final cleanup - just remove any trailing whitespace
        content = content.strip()
        
        # If excellence threshold is reached, add button cue
        excellence_text = "Your goal framework is excellent! Please click the Continue button below to proceed to the next step in your learning journey."
        next_phase = None
        if excellence_text in content:
            # Extract the phase progression mapping
            phase_progression = {
                "intro": "phase1",
                "phase1": "phase2", 
                "phase2": "phase3",
                "phase3": "phase4",
                "phase4": "phase5",
                "phase5": "phase6",
                "phase6": "summary"
            }
            next_phase = phase_progression.get(phase)
        
        # Try to store the feedback for this submission
        try:
            if "is_submission" in request and request["is_submission"]:
                # Save the submission
                submission_data = {
                    "user_id": user_id,
                    "conversation_id": conversation_id,
                    "submission_type": request.get("submission_type", "goal"),
                    "phase": phase,
                    "component": component,
                    "content": message,
                    "feedback": content,
                    "score": score,
                    "scaffolding_level": recommended_scaffolding,
                    "attempt_number": request.get("attempt_number", 1),
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                # Save to appropriate storage based on available DB
                if _using_memory_db:
                    # Ensure submissions list exists
                    if "submissions" not in _memory_db:
                        _memory_db["submissions"] = []
                    _memory_db["submissions"].append(submission_data)
                
                # Save assessment separately too
                assessment_data = {
                    "user_id": user_id,
                    "conversation_id": conversation_id,
                    "phase": phase,
                    "component": component,
                    "assessment_type": request.get("submission_type", "goal"),
                    "score": score,
                    "scaffolding_level": recommended_scaffolding,
                    "metadata": extracted_metadata,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                if _using_memory_db:
                    # Ensure assessments list exists
                    if "assessments" not in _memory_db:
                        _memory_db["assessments"] = []
                    _memory_db["assessments"].append(assessment_data)
                    
                # Save the scaffolding level to the database
                try:
                    save_scaffolding_level(
                        user_id=user_id, 
                        phase=phase, 
                        component=component,
                        level=recommended_scaffolding,
                        conversation_id=conversation_id,
                        reason=f"Submission evaluation for {request.get('submission_type', 'goal')}"
                    )
                except Exception as scaffolding_err:
                    logger.error(f"Error saving scaffolding level: {scaffolding_err}")
        except Exception as e:
            logger.error(f"Error saving submission: {e}")
            # Continue even if saving fails
        
        # Create response data object
        response_data = {
            "message": content,
            "conversation_id": conversation_id,
            "phase": phase,
            "component": component,
            "agent_type": agent_type,
            "scaffolding_level": recommended_scaffolding if recommended_scaffolding is not None else scaffolding_level,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "success",
            "next_phase": next_phase,
            "evaluation": extracted_metadata if extracted_metadata else None
        }
        
        # Save the assistant response to database with metadata
        response_message_id = None
        try:
            saved_response = save_message(
                user_id=user_id,
                conversation_id=conversation_id,
                role="assistant",
                content=content,
                phase=phase,
                component=component,
                metadata={
                    "agent_type": agent_type,
                    "scaffolding_level": recommended_scaffolding if recommended_scaffolding is not None else scaffolding_level,
                    "next_phase": next_phase,
                    "score": score,
                    "rationale": rationale,
                    "specificity_score": specificity_score,
                    "timeline_score": timeline_score,
                    "measurement_score": measurement_score,
                    "evaluation_metadata": extracted_metadata,
                    "api_usage": response.get("usage"),
                    "raw_llm_response": response.get("content")
                }
            )
            response_message_id = saved_response.get("id")
        except Exception as e:
            logger.error(f"Error saving assistant message: {e}")
        
        # Cache the response for future identical requests
        _cache_response(user_id, phase, message, response_data)
        
        # Log completion time
        elapsed = time.time() - start_time
        logger.info(f"Request completed in {elapsed:.2f}s")
        
        return {"success": True, "data": response_data}
            
    except Exception as e:
        logger.error(f"Error processing chat: {e}")
        logger.error(traceback.format_exc())
        return {"error": "Internal server error", "details": str(e), "status": "error"}

@router.get("/history/{user_id}")
async def get_chat_history(user_id: str, limit: int = 20):
    """Get chat history for a user"""
    try:
        # This would typically fetch from your database
        # For now we return an empty list as a placeholder
        # You would implement actual DB retrieval here
        return []
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting chat history: {str(e)}")

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for the chat API
    """
    return {"status": "healthy"}

@router.post("/submit")
async def submit_work(request: dict):
    """
    Handle student submissions for different phases and components
    
    This endpoint allows students to submit their work for evaluation,
    which will be saved separately from regular chat messages.
    """
    try:
        # Extract request parameters
        user_id = request.get("user_id")
        phase = request.get("phase", "phase1").lower()
        message = request.get("message", "")  # Changed from content to message
        submission_type = request.get("submission_type", "goal")
        conversation_id = request.get("conversation_id")
        component = request.get("component", "general")
        
        # Validate required fields
        if not user_id or not phase or not message:
            logger.error(f"Missing required fields in submission: {request}")
            return {"error": "userId, phase, and message are required", "status": "error"}
        
        logger.info(f"Processing submission: phase={phase}, type={submission_type}, userId={user_id[:8]}...")
        
        # Generate a new conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
            
        # Get the appropriate prompt based on phase and component
        if phase == "phase2":
            system_prompt = FINAL_PROMPTS["phase2_learning_objectives"]
        elif phase == "phase4":
            if component in ["longtermgoal", "long_term_goals"]:
                system_prompt = FINAL_PROMPTS["phase4_long_term_goals"]
            elif component in ["shorttermgoal", "short_term_goals"]:
                system_prompt = FINAL_PROMPTS["phase4_short_term_goals"]
            elif component in ["ifthen", "contingency_strategies"]:
                system_prompt = FINAL_PROMPTS["phase4_contingency_strategies"]
            else:
                system_prompt = FINAL_PROMPTS["phase4_long_term_goals"]  # Default for phase 4
        elif phase == "phase5":
            system_prompt = FINAL_PROMPTS["phase5_monitoring_adaptation"]
        else:
            # For other phases that don't have specific prompts yet
            system_prompt = _get_system_prompt(phase, component, 2)  # Use medium scaffolding for evaluation
        
        # Add specific evaluation instructions
        system_prompt += f"\n\nThis is a student submission for {phase}, {submission_type}. Please evaluate it carefully against the rubric criteria."
        
        # Process this as a submission through the chat endpoint
        chat_request = {
            "user_id": user_id,
            "phase": phase,
            "message": message,
            "component": component,
            "conversation_id": conversation_id,
            "is_submission": True,
            "submission_type": submission_type,
            "raw_message": message,
            "attempt_number": request.get("attempt_number", 1)
        }
        
        # Call the chat endpoint to process this submission
        logger.info(f"Sending submission to process_chat: {chat_request}")
        response = await process_chat(chat_request)
        
        # Handle error responses
        if "error" in response:
            logger.error(f"Error processing submission: {response['error']}")
            return response
        
        # Log successful responses    
        logger.info(f"Submission processed successfully: {response.get('data', {}).get('message', '')[:100]}...")
            
        # Add submission-specific data to the response
        if "data" in response:
            response["data"]["submission_type"] = submission_type
            response["data"]["is_submission"] = True
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing submission: {e}")
        logger.error(traceback.format_exc())
        return {"error": "Internal server error", "details": str(e), "status": "error"} 