import os
import logging
from typing import Dict, List, Any, Optional
import uuid
from datetime import datetime
import json

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("solbot.db")

# --- Supabase Initialization ---
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

_supabase_client: Optional[Client] = None

def get_db() -> Client:
    """Initializes and returns the Supabase client."""
    global _supabase_client
    if _supabase_client is None:
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not found in environment variables.")
        logger.info(f"Initializing Supabase client for URL: {supabase_url}")
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully.")
    return _supabase_client

# --- Core Functions ---

def create_user_and_session(name: str, email: str, profile_data: Dict[str, Any]) -> Dict[str, str]:
    """
    Creates a new user and a new session for that user.
    Returns a dictionary with the new user_id and session_id.
    """
    db = get_db()
    
    # 1. Create the User
    new_user_id = str(uuid.uuid4())
    user_insert_data = {
        "id": new_user_id,
        "name": name,
        "email": email,
        "profile_data": json.dumps(profile_data) if profile_data else None
    }
    
    try:
        user_response = db.table("users").insert(user_insert_data).execute()
        if user_response.data:
            logger.info(f"Successfully created new user with ID: {new_user_id}")
        else:
            logger.error(f"Failed to create user, but continuing to session creation.")

    except Exception as e:
        logger.error(f"Error creating user in database: {e}")
        raise e

    # 2. Create the Session
    new_session_id = str(uuid.uuid4())
    session_insert_data = {
        "id": new_session_id,
        "user_id": new_user_id,
        "metadata": json.dumps({"initial_profile": profile_data})
    }
    
    try:
        session_response = db.table("sessions").insert(session_insert_data).execute()
        if session_response.data:
             logger.info(f"Successfully created new session with ID: {new_session_id} for user {new_user_id}")
        else:
            raise Exception("Session creation returned no data.")
            
    except Exception as e:
        logger.error(f"Error creating session in database: {e}")
        raise e

    return {"user_id": new_user_id, "session_id": new_session_id}


def get_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a session and its associated user_id."""
    db = get_db()
    try:
        response = db.table("sessions").select("id, user_id").eq("id", session_id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error retrieving session {session_id}: {e}")
        return None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a user by their ID."""
    db = get_db()
    try:
        response = db.table("users").select("*").eq("id", user_id).single().execute()
        return response.data
    except Exception as e:
        logger.error(f"Error retrieving user {user_id}: {e}")
        return None


def log_message(session_id: str, role: str, content: str, phase: Optional[str] = None, component: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Logs a message (from user, assistant, or system) to the database.
    Returns the newly created message record.
    """
    db = get_db()
    new_message_id = str(uuid.uuid4())
    
    message_data = {
        "id": new_message_id,
        "session_id": session_id,
        "role": role,
        "content": content,
        "phase": phase,
        "component": component,
        "metadata": json.dumps(metadata) if metadata else None
    }
    
    try:
        response = db.table("messages").insert(message_data).execute()
        if not response.data:
            raise Exception("Inserting message returned no data.")
        logger.info(f"Logged message {new_message_id} for session {session_id}")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error logging message: {e}")
        raise e

def log_assessment(
    session_id: str,
    user_id: str,
    submission_message_id: str,
    feedback_message_id: str,
    phase: str,
    component: str,
    attempt_number: int,
    evaluation: Dict[str, Any],
    feedback_style: Optional[str] = None,
    evaluation_method: Optional[str] = None
) -> Dict[str, Any]:
    """
    Logs a full assessment record for research purposes.
    `evaluation` should be the full metadata blob from the LLM.
    """
    db = get_db()
    new_assessment_id = str(uuid.uuid4())
    
    assessment_data = {
        "id": new_assessment_id,
        "session_id": session_id,
        "user_id": user_id,
        "submission_message_id": submission_message_id,
        "feedback_message_id": feedback_message_id,
        "phase": phase,
        "component": component,
        "attempt_number": attempt_number,
        "overall_score": evaluation.get("overall_score") or evaluation.get("Overall_Score"),
        "lowest_category": evaluation.get("lowest_category") or evaluation.get("Lowest_Category"),
        "scaffolding_level": evaluation.get("scaffolding_level") or evaluation.get("Scaffolding"),
        "rationale": evaluation.get("rationale"),
        "full_evaluation": json.dumps(evaluation) if evaluation else None,
        "evaluation_method": evaluation_method or evaluation.get("evaluation_method", "standard"),
        "feedback_style": feedback_style,
        "evaluation_time_ms": evaluation.get("evaluation_time_ms"),
        "feedback_time_ms": evaluation.get("feedback_time_ms"),
    }

    try:
        response = db.table("assessments").insert(assessment_data).execute()
        if not response.data:
            raise Exception("Inserting assessment returned no data.")
        logger.info(f"Logged assessment {new_assessment_id} for session {session_id}")
        return response.data[0]
    except Exception as e:
        logger.error(f"Error logging assessment: {e}")
        raise e


def get_messages_for_session(session_id: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Retrieves the most recent messages for a given session.
    """
    db = get_db()
    try:
        response = db.table("messages").select("*").eq("session_id", session_id).order("created_at", desc=True).limit(limit).execute()
        # The history needs to be oldest-first for the LLM
        return list(reversed(response.data))
    except Exception as e:
        logger.error(f"Error retrieving messages for session {session_id}: {e}")
        return [] 