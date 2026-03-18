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
    Creates or retrieves a user by email, then creates a new session.

    Identification strategy:
      • email is the canonical participant identifier (merges with external surveys)
      • Same email → same user_id (no duplicates)
      • Each registration creates a new session under that user_id
      • Test/pilot data is excluded by date cutoff in research queries (not by email)

    Returns dict with user_id, session_id, condition, is_returning.
    """
    db = get_db()

    # --- Normalize email ---
    email_lower = email.lower().strip()

    # --- 1. Find existing user by email or create new one ---
    is_returning = False
    try:
        existing = db.table("users").select("id, name").eq("email", email_lower).execute()
        if existing.data and len(existing.data) > 0:
            # Returning user — reuse their user_id
            user_id = existing.data[0]["id"]
            is_returning = True
            # Update name/profile if changed
            db.table("users").update({
                "name": name,
                "profile_data": profile_data if profile_data else None,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", user_id).execute()
            logger.info(f"Returning user {user_id} (email={email_lower})")
        else:
            # New user
            user_id = str(uuid.uuid4())
            user_insert_data = {
                "id": user_id,
                "name": name,
                "email": email_lower,
                "profile_data": profile_data if profile_data else None
            }
            db.table("users").insert(user_insert_data).execute()
            logger.info(f"Created new user {user_id} (email={email_lower})")
    except Exception as e:
        logger.error(f"Error in user lookup/creation: {e}")
        raise e

    # --- 2. Determine condition ---
    # STUDY_MODE controls group assignment:
    #   "bot_only"    → all users get bot (default — for pilot / bot-only phase)
    #   "randomize"   → 2:1 ratio assignment (bot:static) based on current counts
    #   "static_only" → all users get static (for testing)
    #
    # Returning users keep their original condition.
    import random
    study_mode = os.environ.get("STUDY_MODE", "bot_only")

    if is_returning:
        # Look up their previous condition
        prev_session = db.table("sessions").select("metadata") \
            .eq("user_id", user_id).order("created_at", desc=True).limit(1).execute()
        if prev_session.data and prev_session.data[0].get("metadata"):
            meta = prev_session.data[0]["metadata"]
            # Handle both double-encoded (old) and proper (new) metadata
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except (json.JSONDecodeError, TypeError):
                    meta = {}
            if isinstance(meta, str):
                # Still a string after one parse = double-encoded
                try:
                    meta = json.loads(meta)
                except (json.JSONDecodeError, TypeError):
                    meta = {}
            condition = meta.get("condition", "bot") if isinstance(meta, dict) else "bot"
        else:
            condition = "bot"
        logger.info(f"Returning user keeps condition: {condition}")
    elif study_mode == "randomize":
        condition = _assign_condition_by_block_randomization(db)
    elif study_mode == "static_only":
        condition = "static"
    else:
        condition = "bot"

    logger.info(f"Condition: {condition} (STUDY_MODE={study_mode}, returning={is_returning})")

    # --- 3. Create session ---
    new_session_id = str(uuid.uuid4())
    session_insert_data = {
        "id": new_session_id,
        "user_id": user_id,
        "metadata": {
            "initial_profile": profile_data,
            "condition": condition,
            "is_returning": is_returning
        }
    }

    try:
        session_response = db.table("sessions").insert(session_insert_data).execute()
        if session_response.data:
             logger.info(f"Created session {new_session_id} for user {user_id}")
        else:
            raise Exception("Session creation returned no data.")

    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise e

    return {
        "user_id": user_id,
        "session_id": new_session_id,
        "condition": condition,
        "is_returning": is_returning
    }


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
        "metadata": metadata if metadata else None
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


# --- Condition Assignment ---

def _assign_condition_by_block_randomization(db_client) -> str:
    """
    Permuted Block Randomization — 2:1 ratio (RCT gold standard).

    Method:
      - Generates a fixed random sequence using blocks of size 3.
      - Each block = [bot, bot, static], shuffled randomly.
      - 34 blocks × 3 = 102 slots → exactly 68 bot + 34 static.
      - Each new non-test user gets the NEXT assignment in the sequence.
      - After all 102 slots used → overflow to bot.

    Why this is the correct approach for research:
      - Every participant is genuinely randomly assigned
      - No adaptive probabilities that change over time
      - Perfectly balanced every 3 participants
      - Standard method in clinical trials & educational RCTs
      - The sequence is reproducible (fixed seed → same sequence)

    Env vars:
      N_BLOCKS           = number of blocks (default 34 → 102 total)
      RANDOMIZATION_SEED = fixed seed for reproducibility (default 2025)
    """
    import random as _random

    n_blocks = int(os.environ.get("N_BLOCKS", "34"))
    seed = int(os.environ.get("RANDOMIZATION_SEED", "2025"))

    # Generate the full pre-determined sequence (deterministic for given seed)
    rng = _random.Random(seed)
    sequence = []
    for _ in range(n_blocks):
        block = ["bot", "bot", "static"]  # 2:1 per block
        rng.shuffle(block)
        sequence.extend(block)
    # sequence = 102 items, exactly 68 "bot" + 34 "static", in random order

    # Count how many non-test users have already been assigned
    try:
        bot_resp = db_client.rpc("count_condition", {"cond": "bot"}).execute()
        static_resp = db_client.rpc("count_condition", {"cond": "static"}).execute()
        bot_count = bot_resp.data if isinstance(bot_resp.data, int) else 0
        static_count = static_resp.data if isinstance(static_resp.data, int) else 0
    except Exception:
        try:
            all_sessions = db_client.table("sessions").select("metadata").execute()
            rows = all_sessions.data or []
            bot_count = sum(1 for s in rows
                           if (s.get("metadata") or {}).get("condition") == "bot")
            static_count = sum(1 for s in rows
                               if (s.get("metadata") or {}).get("condition") == "static")
        except Exception as e:
            logger.error(f"Failed to count conditions, defaulting to bot: {e}")
            return "bot"

    current_index = bot_count + static_count
    total_slots = len(sequence)

    logger.info(f"Block randomization: index={current_index}/{total_slots}, "
                f"bot={bot_count}, static={static_count}, seed={seed}")

    if current_index < total_slots:
        condition = sequence[current_index]
    else:
        condition = "bot"
        logger.info(f"All {total_slots} slots used, overflow → bot")

    return condition