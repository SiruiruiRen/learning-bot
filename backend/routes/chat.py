import logging
import asyncio
import uuid
from datetime import datetime
import traceback
import time
import re
import json
import sys
import os
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

sys.path.append(os.path.abspath('..'))
from prompt_engineering.scripts.final_prompts import get_prompt, get_evaluation_prompt, get_feedback_prompt
from backend.utils import db
from backend.utils.llm import call_claude

logger = logging.getLogger("solbot.routes.chat")
router = APIRouter(prefix="/api", tags=["main"])

# --- Pydantic Models ---
class OnboardingRequest(BaseModel):
    name: str
    email: str
    profile_data: Dict[str, Any]

class EventRequest(BaseModel):
    session_id: str
    event_type: str
    phase: str
    component: str
    metadata: Dict[str, Any]

class ChatRequest(BaseModel):
    session_id: str
    message: str
    phase: str
    component: str
    is_submission: bool = False
    attempt_number: int = 1

class SubmitRequest(BaseModel):
    user_id: str
    message: str
    phase: str
    component: str
    conversation_id: str
    submission_type: str

class UserDataRequest(BaseModel):
    data_type: str
    value: Any
    metadata: Dict[str, Any] = None

# --- API Endpoints ---
@router.on_event("startup")
async def startup_event():
    db.get_db()

@router.post("/onboarding")
async def handle_onboarding(request: OnboardingRequest):
    try:
        session_info = db.create_user_and_session(
            name=request.name, email=request.email, profile_data=request.profile_data
        )
        return {"success": True, "data": session_info}
    except Exception as e:
        logger.error(f"Onboarding error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to create user session.")

@router.post("/events")
async def log_event(request: EventRequest):
    try:
        db.log_message(
            session_id=request.session_id, role="system", content=request.event_type,
            phase=request.phase, component=request.component, metadata=request.metadata
        )
        return {"success": True}
    except Exception as e:
        logger.error(f"Event logging error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to log event.")

@router.post("/submit")
async def handle_submission(request: SubmitRequest):
    # Compatibility layer for older components
    chat_req = ChatRequest(
        session_id=request.conversation_id, message=request.message,
        phase=request.phase, component=request.component, is_submission=True
    )
    return await process_chat(chat_req)

@router.post("/user-data/{user_id}")
async def store_user_data(user_id: str, request: UserDataRequest):
    try:
        # For now, just return success - this is a compatibility endpoint
        # In a full implementation, you would store this in your database
        logger.info(f"User data received for {user_id}: {request.data_type}")
        return {
            "success": True,
            "id": f"data-{uuid.uuid4()}",
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"User data storage error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to store user data.")

@router.get("/user-data/{user_id}")
async def get_user_data(user_id: str, data_type: str = None):
    try:
        # For now, return empty array - this is a compatibility endpoint
        # In a full implementation, you would retrieve from your database
        logger.info(f"User data requested for {user_id}, type: {data_type}")
        return []
    except Exception as e:
        logger.error(f"User data retrieval error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user data.")

@router.post("/chat")
async def process_chat(request: ChatRequest):
    start_time = time.time()
    try:
        user_message_record = db.log_message(
            session_id=request.session_id, role="user", content=request.message,
            phase=request.phase, component=request.component,
            metadata={"is_submission": request.is_submission, "attempt_number": request.attempt_number}
        )
        chat_history = db.get_messages_for_session(request.session_id, limit=10)
        formatted_history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in chat_history if msg["role"] in ["user", "assistant"]
        ] if chat_history else []
        
        # Get user's communication style preference
        session_details = db.get_session_by_id(request.session_id)
        coach_tone = "warm"  # default
        if session_details:
            user_id = session_details.get("user_id")
            if user_id:
                user_data = db.get_user_by_id(user_id)
                if user_data and user_data.get("profile_data"):
                    import json
                    profile_data = json.loads(user_data["profile_data"]) if isinstance(user_data["profile_data"], str) else user_data["profile_data"]
                    coach_tone = profile_data.get("coach_tone", "warm")
                    # Map "balanced" to "warm" for now, or keep as is
                    if coach_tone == "balanced":
                        coach_tone = "warm"
                    elif coach_tone not in ["warm", "direct"]:
                        coach_tone = "warm"
        
        # Chain Prompting Approach:
        # Step 1: Evaluation (get scores/categories) - only for submissions
        # Step 2: Generate feedback with user's preferred style based on evaluation
        
        evaluation_metadata = None
        cleaned_content = ""
        
        try:
            prompt_name = f"phase{request.phase}_{request.component}"
            
            if request.is_submission:
                # Chain Prompting: Step 1 (Evaluation) -> Step 2 (Feedback)
                # This ensures evaluation consistency across styles
                eval_start_time = time.time()
                try:
                    evaluation_prompt = get_evaluation_prompt(prompt_name)
                    
                    # Step 1: Evaluation only (rubric-based, no style)
                    eval_response = await call_claude(
                        system_prompt=evaluation_prompt,
                        user_message=request.message,
                        chat_history=formatted_history,
                        temperature=0.2,  # Very low temperature for consistent rubric-based evaluation
                        max_tokens=400  # Shorter for evaluation only
                    )
                    
                    eval_time_ms = int((time.time() - eval_start_time) * 1000)
                    eval_content = eval_response.get("content", "")
                    evaluation_metadata = _extract_evaluation_metadata(eval_content)
                    
                    # Step 2: Generate feedback with preferred style based on evaluation
                    feedback_start_time = time.time()
                    if evaluation_metadata:
                        feedback_prompt = get_feedback_prompt(
                            prompt_name, 
                            style=coach_tone, 
                            evaluation_metadata=evaluation_metadata
                        )
                        
                        # Second call: Generate styled feedback (parallel with evaluation if possible)
                        feedback_response = await call_claude(
                            system_prompt=feedback_prompt,
                            user_message=f"Student submission: {request.message}\n\nGenerate feedback in {coach_tone} style using the evaluation results provided above.",
                            chat_history=[],  # Fresh context for feedback
                            temperature=0.5,  # Higher for natural language
                            max_tokens=800
                        )
                        
                        feedback_time_ms = int((time.time() - feedback_start_time) * 1000)
                        feedback_content = feedback_response.get("content", "")
                        # Verify evaluation is preserved
                        feedback_eval = _extract_evaluation_metadata(feedback_content)
                        original_score = evaluation_metadata.get('overall_score') or evaluation_metadata.get('Overall_Score')
                        feedback_score = feedback_eval.get('overall_score') or feedback_eval.get('Overall_Score')
                        
                        if feedback_eval and original_score and feedback_score and abs(float(original_score) - float(feedback_score)) < 0.1:
                            cleaned_content = _clean_message_for_student(feedback_content)
                            # Store timing info in metadata for analytics
                            evaluation_metadata['evaluation_time_ms'] = eval_time_ms
                            evaluation_metadata['feedback_time_ms'] = feedback_time_ms
                            evaluation_metadata['evaluation_method'] = 'chain'
                        else:
                            # Fallback: use original evaluation response
                            logger.warning(f"Evaluation mismatch: original={original_score}, feedback={feedback_score}")
                            cleaned_content = _clean_message_for_student(eval_content)
                            evaluation_metadata = _extract_evaluation_metadata(eval_content)
                            evaluation_metadata['evaluation_method'] = 'chain_fallback'
                    else:
                        # If evaluation extraction failed, use standard prompt
                        logger.warning("Failed to extract evaluation, using standard prompt")
                        system_prompt = get_prompt(prompt_name, style=coach_tone)
                        llm_response = await call_claude(
                            system_prompt=system_prompt,
                            user_message=request.message,
                            chat_history=formatted_history,
                            temperature=0.5,
                            max_tokens=800
                        )
                        response_content = llm_response.get("content", "")
                        evaluation_metadata = _extract_evaluation_metadata(response_content)
                        cleaned_content = _clean_message_for_student(response_content)
                except Exception as chain_error:
                    # Fallback to single-step if chain prompting fails
                    logger.warning(f"Chain prompting failed, using standard approach: {chain_error}")
                    system_prompt = get_prompt(prompt_name, style=coach_tone)
                    llm_response = await call_claude(
                        system_prompt=system_prompt,
                        user_message=request.message,
                        chat_history=formatted_history,
                        temperature=0.5,
                        max_tokens=800
                    )
                    response_content = llm_response.get("content", "")
                    evaluation_metadata = _extract_evaluation_metadata(response_content)
                    cleaned_content = _clean_message_for_student(response_content)
            else:
                # For non-submissions, use standard prompt
                system_prompt = get_prompt(prompt_name, style=coach_tone)
                llm_response = await call_claude(
                    system_prompt=system_prompt,
                    user_message=request.message,
                    chat_history=formatted_history,
                    temperature=0.5,
                    max_tokens=800
                )
                response_content = llm_response.get("content", "")
                evaluation_metadata = _extract_evaluation_metadata(response_content)
                cleaned_content = _clean_message_for_student(response_content)
                
        except ValueError:
            # Fallback if prompt not found
            system_prompt = "You are SoL2LBot, an AI tutor for self-regulated learning."
            llm_response = await call_claude(
                system_prompt=system_prompt,
                user_message=request.message,
                chat_history=formatted_history,
                temperature=0.5,
                max_tokens=800
            )
            response_content = llm_response.get("content", "")
            evaluation_metadata = _extract_evaluation_metadata(response_content)
            cleaned_content = _clean_message_for_student(response_content)
        
        assistant_message_record = db.log_message(
            session_id=request.session_id, role="assistant", content=cleaned_content,
            phase=request.phase, component=request.component,
            metadata={"api_usage": llm_response.get("usage", {}), "evaluation": evaluation_metadata, "raw_llm_response": response_content}
        )
        
        if request.is_submission and evaluation_metadata:
            session_details = db.get_session_by_id(request.session_id)
            if session_details:
                db.log_assessment(
                    session_id=request.session_id, user_id=session_details["user_id"],
                    submission_message_id=user_message_record["id"], feedback_message_id=assistant_message_record["id"],
                    phase=request.phase, component=request.component,
                    attempt_number=request.attempt_number, evaluation=evaluation_metadata,
                    feedback_style=coach_tone,
                    evaluation_method=evaluation_metadata.get("evaluation_method", "standard")
                )
        
        logger.info(f"Request for session {request.session_id} completed in {time.time() - start_time:.2f}s")
        return {"success": True, "data": {"message": cleaned_content, "evaluation": evaluation_metadata}}

    except Exception as e:
        logger.error(f"Chat processing error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to process chat message.")

# --- Helper Functions ---
def _extract_evaluation_metadata(raw_content: str) -> Dict[str, Any]:
    metadata = {}
    match = re.search(r"<!-- INSTRUCTOR_METADATA\n(.*?)\n-->", raw_content, re.DOTALL)
    if not match: return metadata
    
    for line in match.group(1).split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip().lower().replace(" ", "_")
            value = value.strip()
            try:
                if '.' in value:
                    value = float(value)
                else:
                    value = int(value)
            except (ValueError, TypeError):
                pass
            metadata[key] = value
    return metadata

def _clean_message_for_student(raw_content: str) -> str:
    return re.sub(r"<!-- INSTRUCTOR_METADATA.*?-->", "", raw_content, flags=re.DOTALL).strip()
