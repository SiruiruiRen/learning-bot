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
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

sys.path.append(os.path.abspath('..'))
from prompt_engineering.scripts.final_prompts import get_prompt
from backend.utils import db
from backend.utils.llm import call_claude, call_claude_stream

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
# 2026-04-17: bumped + expanded to definitively confirm which commit
# Render is running. /api/version now also echoes back the full list
# of registered POST routes so we can spot missing/stale routes from
# the outside without needing shell access.
DEPLOY_VERSION = "2026-04-17-streaming-v1"

@router.on_event("startup")
async def startup_event():
    db.get_db()

@router.get("/version")
async def get_version():
    # Return registered POST routes alongside the version string so a
    # single curl tells us whether a suspected missing endpoint (like
    # /api/chat/stream) is actually registered on the running process.
    try:
        from fastapi import FastAPI as _FastAPI
        import fastapi as _fastapi_mod
        app_ref = None
        # Walk up to find the FastAPI app instance
        import sys as _sys
        main_mod = _sys.modules.get("main")
        if main_mod is not None and hasattr(main_mod, "app"):
            app_ref = main_mod.app
        post_routes = []
        if app_ref is not None:
            for r in app_ref.routes:
                methods = getattr(r, "methods", None) or set()
                path = getattr(r, "path", "")
                for m in sorted(methods):
                    if m in ("POST", "GET"):
                        post_routes.append(f"{m} {path}")
        return {"version": DEPLOY_VERSION, "routes": sorted(post_routes)}
    except Exception as e:
        return {"version": DEPLOY_VERSION, "routes_error": str(e)}

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
        # Log user message — non-blocking: don't let DB failure prevent chat
        user_message_record = None
        try:
            user_message_record = db.log_message(
                session_id=request.session_id, role="user", content=request.message,
                phase=request.phase, component=request.component,
                metadata={"is_submission": request.is_submission, "attempt_number": request.attempt_number}
            )
        except Exception as db_err:
            logger.warning(f"Failed to log user message (non-fatal): {db_err}")
            user_message_record = {"id": str(uuid.uuid4())}  # fallback ID
        
        # Get chat history — non-blocking
        formatted_history = []
        try:
            chat_history = db.get_messages_for_session(request.session_id, limit=10)
            formatted_history = [
                {"role": msg["role"], "content": msg["content"]}
                for msg in chat_history if msg["role"] in ["user", "assistant"]
            ] if chat_history else []
        except Exception as db_err:
            logger.warning(f"Failed to get chat history (non-fatal): {db_err}")
        
        # Get user's communication style preference — non-blocking
        coach_tone = "warm"  # default
        try:
            session_details = db.get_session_by_id(request.session_id)
            if session_details:
                user_id = session_details.get("user_id")
                if user_id:
                    user_data = db.get_user_by_id(user_id)
                    if user_data and user_data.get("profile_data"):
                        import json
                        profile_data = json.loads(user_data["profile_data"]) if isinstance(user_data["profile_data"], str) else user_data["profile_data"]
                        coach_tone = profile_data.get("coach_tone", "warm")
                        if coach_tone == "balanced":
                            coach_tone = "warm"
                        elif coach_tone not in ["warm", "direct"]:
                            coach_tone = "warm"
        except Exception as db_err:
            logger.warning(f"Failed to get coach_tone (non-fatal, defaulting to warm): {db_err}")
        
        # Single Prompt Approach with Style Consistency:
        # Use one prompt call with user's preferred style (warm or direct)
        # The entire system maintains consistent style based on user's onboarding choice
        
        evaluation_metadata = None
        cleaned_content = ""
        llm_response = None
        
        try:
            # Map (phase, component) to prompt key in final_prompts.py
            prompt_name = _resolve_prompt_name(request.phase, request.component)
            is_floating = (request.component == "floating_chatbot")
            
            # Single prompt call with user's preferred style
            system_prompt = get_prompt(prompt_name, style=coach_tone)
            # Floating chatbot uses Claude Haiku 4.5 for fast + smart responses
            # Main phases use Claude Sonnet 4.5 for detailed rubric evaluations
            FLOATING_MODEL = "claude-haiku-4-5-20251001"
            selected_model = FLOATING_MODEL if is_floating else None
            
            # Resolve user_id for LLM interaction tracking
            tracking_user_id = None
            try:
                session_details_for_tracking = db.get_session_by_id(request.session_id)
                if session_details_for_tracking:
                    tracking_user_id = session_details_for_tracking.get("user_id")
            except Exception:
                pass
            
            llm_response = await call_claude(
                system_prompt=system_prompt,
                user_message=request.message,
                chat_history=formatted_history,
                temperature=0.3 if is_floating else 0.1,  # Floating: more natural; Rubric: strict
                max_tokens=400 if is_floating else 500,    # Floating: up to 200 words; Rubric: detailed
                model=selected_model,                      # Haiku for speed; default Sonnet for quality
                user_id=tracking_user_id,
                conversation_id=request.session_id,
                phase=request.phase,
                component=request.component
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
                temperature=0.1,  # Low temperature for scoring consistency
                max_tokens=500  # Reduced for conciseness (<300 words target)
            )
            response_content = llm_response.get("content", "")
            evaluation_metadata = _extract_evaluation_metadata(response_content)
            cleaned_content = _clean_message_for_student(response_content)
        
        # Log assistant response — non-blocking
        assistant_message_record = None
        try:
            assistant_message_record = db.log_message(
                session_id=request.session_id, role="assistant", content=cleaned_content,
                phase=request.phase, component=request.component,
                metadata={
                    "api_usage": llm_response.get("usage", {}),
                    "model": llm_response.get("model", "unknown"),
                    "evaluation": evaluation_metadata,
                    "raw_llm_response": response_content
                }
            )
        except Exception as db_err:
            logger.warning(f"Failed to log assistant message (non-fatal): {db_err}")
            assistant_message_record = {"id": str(uuid.uuid4())}
        
        # Log assessment — non-blocking
        try:
            if request.is_submission and evaluation_metadata:
                session_details = db.get_session_by_id(request.session_id)
                if session_details:
                    db.log_assessment(
                        session_id=request.session_id, user_id=session_details["user_id"],
                        submission_message_id=user_message_record["id"], feedback_message_id=assistant_message_record["id"],
                        phase=request.phase, component=request.component,
                        attempt_number=request.attempt_number, evaluation=evaluation_metadata,
                        feedback_style=coach_tone,
                        evaluation_method="single_prompt"
                    )
        except Exception as db_err:
            logger.warning(f"Failed to log assessment (non-fatal): {db_err}")
        
        logger.info(f"Request for session {request.session_id} completed in {time.time() - start_time:.2f}s")
        return {
            "success": True,
            "data": {
                "message": cleaned_content,
                "evaluation": evaluation_metadata,
                "model": llm_response.get("model", "unknown") if llm_response else "unknown"
            }
        }

    except Exception as e:
        logger.error(f"Chat processing error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to process chat message.")


# ----------------------------------------------------------------------------
# Streaming endpoint (2026-04-17)
# ----------------------------------------------------------------------------
# Wire-compatible with /api/chat in request shape; the difference is the
# response format — instead of returning one JSON object after the full
# Claude response arrives, this endpoint returns Server-Sent Events:
#
#     data: {"type":"text","delta":"..."}\n\n        (many of these)
#     data: {"type":"complete","content":"<cleaned>",
#            "evaluation":{...},"model":"..."}\n\n   (one, at the end)
#     data: {"type":"error","error":"..."}\n\n       (only on failure)
#
# The browser renders each text delta immediately, so students see the
# feedback appearing as Claude generates it (time-to-first-token ~1-2s
# instead of waiting 4-8s for the full response).
#
# IMPORTANT: /api/chat is left unchanged. Non-streaming callers (tests,
# legacy clients) continue to work. This is purely additive.
# ----------------------------------------------------------------------------
@router.post("/chat/stream")
async def process_chat_stream(request: ChatRequest):
    start_time = time.time()

    async def event_generator():
        try:
            # ---- Setup block: mirrors process_chat(). ------------------
            # Log user message — non-blocking, doesn't stop the stream.
            user_message_record = None
            try:
                user_message_record = db.log_message(
                    session_id=request.session_id, role="user", content=request.message,
                    phase=request.phase, component=request.component,
                    metadata={"is_submission": request.is_submission, "attempt_number": request.attempt_number}
                )
            except Exception as db_err:
                logger.warning(f"[stream] Failed to log user message (non-fatal): {db_err}")
                user_message_record = {"id": str(uuid.uuid4())}

            # Fetch chat history
            formatted_history = []
            try:
                chat_history = db.get_messages_for_session(request.session_id, limit=10)
                formatted_history = [
                    {"role": msg["role"], "content": msg["content"]}
                    for msg in chat_history if msg["role"] in ["user", "assistant"]
                ] if chat_history else []
            except Exception as db_err:
                logger.warning(f"[stream] Failed to get chat history (non-fatal): {db_err}")

            # Resolve coach_tone
            coach_tone = "warm"
            tracking_user_id = None
            try:
                session_details = db.get_session_by_id(request.session_id)
                if session_details:
                    tracking_user_id = session_details.get("user_id")
                    if tracking_user_id:
                        user_data = db.get_user_by_id(tracking_user_id)
                        if user_data and user_data.get("profile_data"):
                            profile_data = json.loads(user_data["profile_data"]) if isinstance(user_data["profile_data"], str) else user_data["profile_data"]
                            tone_raw = profile_data.get("coach_tone", "warm")
                            coach_tone = "warm" if tone_raw in ("balanced", "warm") else ("direct" if tone_raw == "direct" else "warm")
            except Exception as db_err:
                logger.warning(f"[stream] Failed to resolve coach_tone (defaulting to warm): {db_err}")

            # Resolve system prompt + model
            try:
                prompt_name = _resolve_prompt_name(request.phase, request.component)
                system_prompt = get_prompt(prompt_name, style=coach_tone)
            except ValueError:
                system_prompt = "You are SoL2LBot, an AI tutor for self-regulated learning."

            is_floating = (request.component == "floating_chatbot")
            FLOATING_MODEL = "claude-haiku-4-5-20251001"
            selected_model = FLOATING_MODEL if is_floating else None

            # ---- Streaming block -------------------------------------
            full_content = ""
            final_usage: Dict[str, Any] = {}
            final_model = "unknown"
            stream_errored = False

            async for chunk in call_claude_stream(
                system_prompt=system_prompt,
                user_message=request.message,
                chat_history=formatted_history,
                temperature=0.3 if is_floating else 0.1,
                max_tokens=400 if is_floating else 500,
                model=selected_model,
                user_id=tracking_user_id,
                conversation_id=request.session_id,
                phase=request.phase,
                component=request.component,
            ):
                ctype = chunk.get("type")
                if ctype == "text":
                    full_content += chunk.get("delta", "")
                    # Forward the raw delta to the client immediately.
                    yield f"data: {json.dumps({'type': 'text', 'delta': chunk['delta']})}\n\n"
                elif ctype == "complete":
                    final_usage = chunk.get("usage", {})
                    final_model = chunk.get("model", "unknown")
                    # full_content from chunks should match chunk['content']
                    # but prefer chunk['content'] as the source of truth
                    full_content = chunk.get("content", full_content)
                elif ctype == "error":
                    stream_errored = True
                    yield f"data: {json.dumps({'type': 'error', 'error': chunk.get('error', 'unknown')})}\n\n"
                    # Don't return yet — fall through to log partial content
                    full_content = chunk.get("partial_content", full_content)
                    break

            # ---- Post-stream: extract metadata + log -----------------
            evaluation_metadata = _extract_evaluation_metadata(full_content)
            cleaned_content = _clean_message_for_student(full_content)

            # Log assistant message — non-blocking
            assistant_message_record = None
            try:
                assistant_message_record = db.log_message(
                    session_id=request.session_id, role="assistant", content=cleaned_content,
                    phase=request.phase, component=request.component,
                    metadata={
                        "api_usage": final_usage,
                        "model": final_model,
                        "evaluation": evaluation_metadata,
                        "raw_llm_response": full_content,
                        "streaming": True,
                    }
                )
            except Exception as db_err:
                logger.warning(f"[stream] Failed to log assistant message (non-fatal): {db_err}")
                assistant_message_record = {"id": str(uuid.uuid4())}

            # Log assessment — non-blocking
            try:
                if request.is_submission and evaluation_metadata:
                    session_details = db.get_session_by_id(request.session_id)
                    if session_details:
                        db.log_assessment(
                            session_id=request.session_id, user_id=session_details["user_id"],
                            submission_message_id=user_message_record["id"],
                            feedback_message_id=assistant_message_record["id"],
                            phase=request.phase, component=request.component,
                            attempt_number=request.attempt_number, evaluation=evaluation_metadata,
                            feedback_style=coach_tone,
                            evaluation_method="single_prompt_streamed",
                        )
            except Exception as db_err:
                logger.warning(f"[stream] Failed to log assessment (non-fatal): {db_err}")

            # Emit the final "complete" SSE event so the client can attach
            # the parsed evaluation to the feedback_delivered WAL row.
            if not stream_errored:
                yield (
                    "data: "
                    + json.dumps({
                        "type": "complete",
                        "content": cleaned_content,
                        "evaluation": evaluation_metadata,
                        "model": final_model,
                    })
                    + "\n\n"
                )

            logger.info(
                f"[stream] Session {request.session_id} completed in "
                f"{time.time() - start_time:.2f}s (streaming)"
            )

        except Exception as e:
            logger.error(f"Chat streaming error: {e}\n{traceback.format_exc()}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            # Disable intermediary buffering so each delta reaches the
            # browser as soon as it's yielded (Render's default nginx
            # otherwise batches small responses).
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# --- Helper Functions ---
def _resolve_prompt_name(phase: str, component: str) -> str:
    """Map (phase, component) from frontend to prompt key in final_prompts.py.
    Special cases: floating_chatbot uses knowledge-base prompt; Phase 5 monitoring uses rubric prompt."""
    if component == "floating_chatbot":
        return "floating_chatbot"
    if phase == "phase5" and component == "progress_monitoring":
        return "phase5_monitoring_adaptation"
    if (phase or "").startswith("phase"):
        return f"{phase}_{component}"
    return f"phase{phase}_{component}"

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

@router.get("/db-check")
async def db_check():
    """Diagnostic endpoint to check database connectivity and table structure."""
    results = {}
    try:
        supabase = db.get_db()
        results["connection"] = "OK"
    except Exception as e:
        results["connection"] = f"FAILED: {e}"
        return results
    
    # Check messages table
    try:
        test_id = str(uuid.uuid4())
        resp = supabase.table("messages").insert({
            "id": test_id, "session_id": test_id, "role": "system",
            "content": "db-check probe", "phase": "test", "component": "test"
        }).execute()
        results["messages_insert"] = "OK" if resp.data else "NO DATA"
        # Clean up
        supabase.table("messages").delete().eq("id", test_id).execute()
        results["messages_cleanup"] = "OK"
    except Exception as e:
        results["messages_insert"] = f"FAILED: {e}"
    
    # Check assessments table
    try:
        resp = supabase.table("assessments").select("id").limit(1).execute()
        results["assessments_select"] = "OK"
    except Exception as e:
        results["assessments_select"] = f"FAILED: {e}"
    
    return results
