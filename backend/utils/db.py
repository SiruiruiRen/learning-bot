import os
import logging
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

# Define global variables at module level
supabase_available = False
create_client = None
Client = None

try:
    # Try to import supabase - use proper technique to get global references
    from supabase import create_client as _create_client, Client as _Client
    # Explicitly assign to module level variables
    create_client = _create_client
    Client = _Client
    supabase_available = True
    logging.getLogger("solbot.db").info("Supabase package successfully imported")
except ImportError as e:
    # Create placeholder for type hints
    class Client:
        pass
    logging.getLogger("solbot.db").warning(f"Supabase package import failed: {e}. Using in-memory storage.")

from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

logger = logging.getLogger("solbot.db")

# Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Global client
_supabase_client: Optional[Client] = None
# Set to False to use Supabase
_using_memory_db = os.getenv("USE_MEMORY_DB", "false").lower() == "true"

# In-memory database fallback
_memory_db = {
    "users": {},
    "messages": [],
    "criterion_scores": [],
    "phase_progress": {},
    "user_data": []  # Add a user_data array for in-memory storage
}

# Add a scaffolding level cache at the top of the file
_scaffolding_cache = {}

def is_valid_uuid(val):
    """Check if a string is a valid UUID"""
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError):
        return False

def format_uuid(val, prefix="id_"):
    """Format a value as a valid UUID or create a new one with a prefix if it's not"""
    if is_valid_uuid(val):
        return val
    
    # Normalize user_id by removing any prefix and special characters
    val_str = str(val).strip()
    
    # Special case for user IDs - preserve the original name without prefix
    if prefix == "user_":
        # If it already has user- prefix, preserve the actual name part
        if val_str.startswith("user-"):
            username = val_str[5:]  # Skip the "user-" prefix
        else:
            # Use the name as is
            username = val_str
            
        # Create a deterministic UUID based on the username
        namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
        derived_uuid = str(uuid.uuid5(namespace, f"user_{username}"))
        logger.debug(f"Converted user '{val}' to UUID: {derived_uuid}")
        return derived_uuid
    
    # For other values, just use a simple cleaner
    clean_val = val_str.replace("-", "_").replace(" ", "_")
    
    # Create a deterministic UUID based on the cleaned value to ensure consistency
    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    derived_uuid = str(uuid.uuid5(namespace, f"{prefix}{clean_val}"))
    logger.debug(f"Converted '{val}' to UUID: {derived_uuid}")
    
    return derived_uuid

def init_db():
    """Initialize the database connection or fallback to memory storage"""
    global _supabase_client, _using_memory_db
    
    # First check if Supabase package is available and create_client is defined
    if not supabase_available or create_client is None:
        logger.warning("Supabase package not properly installed or create_client not defined. Using in-memory storage.")
        _using_memory_db = True
        return
    
    # Check if we should use memory DB
    if _using_memory_db:
        logger.info("Using in-memory storage for database operations")
        return
    
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials not found. Using in-memory storage.")
        _using_memory_db = True
        return
    
    try:
        # Create Supabase client
        logger.info(f"Initializing database connection to {supabase_url}")
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Database connection initialized successfully")
        
        # Test connection with a simple query
        try:
            test_response = _supabase_client.table("user_data").select("count", count="exact").limit(1).execute()
            logger.info(f"Database connection test successful. Count: {test_response.count}")
            
            # Check table schema compatibility
            try:
                # Get users table columns to debug schema issues
                columns_resp = _supabase_client.table("users").select("*").limit(1).execute()
                if columns_resp.data:
                    user_columns = list(columns_resp.data[0].keys())
                    logger.info(f"Users table has columns: {user_columns}")
                else:
                    # Try getting users table columns via RPC if available
                    logger.info("No users found. Unable to determine schema.")
            except Exception as schema_err:
                logger.warning(f"Could not check schema compatibility: {schema_err}")
                
        except Exception as test_err:
            logger.warning(f"Database connection test failed: {test_err}")
    except Exception as e:
        logger.warning(f"Failed to initialize database connection: {e}. Using in-memory storage.")
        _using_memory_db = True

def close_db():
    """Close the database connection"""
    global _supabase_client
    # Supabase client doesn't require explicit closing,
    # but we'll set it to None for clarity
    _supabase_client = None
    logger.info("Database connection closed")

def get_db() -> Optional[Client]:
    """Get the database client if available"""
    global _supabase_client, supabase_available
    
    if not supabase_available:
        logger.debug("Supabase package not available")
        return None
    
    if not _using_memory_db and _supabase_client is None:
        init_db()
    
    return _supabase_client

# User profile operations
def get_user_profile(user_id: str) -> Dict[str, Any]:
    """Get user profile data from Supabase or memory"""
    if _using_memory_db:
        # Return from memory or create default
        if user_id not in _memory_db["users"]:
            _memory_db["users"][user_id] = {
                "id": user_id,
                "created_at": datetime.now().isoformat()
            }
        return _memory_db["users"][user_id]
    
    db = get_db()
    try:
        # Clean the user ID first by removing any prefix
        clean_user_id = user_id
        if isinstance(user_id, str) and user_id.startswith("user-"):
            clean_user_id = user_id[5:]  # Remove "user-" prefix
            
        # Format user_id as UUID
        uuid_id = format_uuid(clean_user_id, "user_")
        
        response = db.table("users").select("*").eq("id", uuid_id).execute()
        if not response.data:
            logger.warning(f"User profile not found for user_id: {clean_user_id}, creating new user")
            # Create the user on the fly
            user_data = {
                "id": uuid_id,
                "created_at": datetime.now().isoformat()
                # Removed updated_at as it doesn't exist in schema
            }
            db.table("users").insert(user_data).execute()
            return {"id": clean_user_id, "uuid": uuid_id}
        return response.data[0]
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        return {"id": user_id}

def ensure_user_exists(user_id: str) -> str:
    """Ensure a user exists in the database, creating if needed, and return the UUID"""
    if _using_memory_db:
        if user_id not in _memory_db["users"]:
            _memory_db["users"][user_id] = {
                "id": user_id,
                "created_at": datetime.now().isoformat()
            }
        return user_id
    
    db = get_db()
    if db is None:
        logger.warning("Database not available in ensure_user_exists, using derived UUID")
        return format_uuid(user_id, "user_")
        
    # Format user_id as UUID
    # Strip any "user-" prefix to use just the name
    clean_user_id = user_id
    if isinstance(user_id, str) and user_id.startswith("user-"):
        clean_user_id = user_id[5:]  # Remove "user-" prefix
        
    uuid_user_id = format_uuid(clean_user_id, "user_")
    
    try:
        # Check if user exists
        try:
            response = db.table("users").select("id").eq("id", uuid_user_id).limit(1).execute()
            
            if not response.data:
                # Create the user if not exists
                logger.info(f"Creating new user with ID: {uuid_user_id} (original: {clean_user_id})")
                
                # Only include fields that exist in the schema
                user_data = {
                    "id": uuid_user_id
                }
                
                try:
                    # Try to add email only if it's in the schema
                    user_data["created_at"] = datetime.now().isoformat()
                except:
                    pass
                
                try:
                    db.table("users").insert(user_data).execute()
                except Exception as insert_err:
                    logger.warning(f"Failed to insert user but continuing: {insert_err}")
        except Exception as check_err:
            logger.warning(f"Failed to check if user exists, continuing: {check_err}")
        
        return uuid_user_id
    except Exception as e:
        logger.error(f"Error ensuring user exists: {e}")
        return uuid_user_id  # Return the UUID anyway to continue the process

def save_message(user_id: str, conversation_id: str, role: str, content: str, phase: str = None, component: str = None, metadata: dict = None) -> Dict[str, Any]:
    """Save message to database or memory"""
    # Generate a message ID
    message_id = str(uuid.uuid4())
    
    # Create base message object
    message = {
        "id": message_id,
        "user_id": user_id,
        "conversation_id": conversation_id,
        "role": role,
        "content": content,
        "phase": phase,
        "component": component,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add metadata if provided
    if metadata:
        message["metadata"] = metadata
    
    if _using_memory_db:
        _memory_db["messages"].append(message)
        return message
    
    db = get_db()
    try:
        # Format IDs as UUIDs if needed
        uuid_user_id = ensure_user_exists(user_id)  # Ensure user exists first
        uuid_conv_id = format_uuid(conversation_id, "conv_")
        
        # Create metadata JSON for fields not in the schema
        meta_data = {
            "phase": phase,
            "component": component,
            "original_user_id": user_id,
            "original_conversation_id": conversation_id
        }
        
        # Add any additional metadata if provided
        if metadata:
            meta_data.update(metadata)
        
        # Check if we need to create the conversation first
        try:
            # Check if the conversation exists
            conversation_exists = False
            try:
                conv_check = db.table("conversations").select("id").eq("id", uuid_conv_id).limit(1).execute()
                conversation_exists = len(conv_check.data) > 0
            except Exception as conv_err:
                logger.warning(f"Error checking for conversation: {conv_err}")
            
            # Create conversation if it doesn't exist
            if not conversation_exists:
                logger.info(f"Creating conversation with ID: {uuid_conv_id}")
                try:
                    # Using required fields based on DB schema
                    conv_data = {
                        "id": uuid_conv_id,
                        "user_id": uuid_user_id,
                        "agent_type": "general",  # This is required
                        "phase": phase or "unknown",  # This is required
                        "started_at": datetime.now().isoformat()
                    }
                    db.table("conversations").insert(conv_data).execute()
                except Exception as create_err:
                    logger.error(f"Failed to create conversation: {create_err}")
        except Exception as check_err:
            logger.warning(f"Error in conversation check/create: {check_err}")
        
        # Only include fields that exist in the actual table schema - note: no user_id in messages table
        data = {
            "id": message_id,
            "conversation_id": uuid_conv_id,
            "sender_type": role,
            "content": content,
            "metadata": json.dumps(meta_data)
        }
        
        try:
            response = db.table("messages").insert(data).execute()
            return response.data[0] if response.data else message
        except Exception as e:
            err_msg = str(e)
            if "violates foreign key constraint" in err_msg:
                logger.error(f"Foreign key violation - conversation may not exist: {uuid_conv_id}")
                # Try to create the conversation one more time with all required fields
                try:
                    # Make sure all required fields are present
                    conv_data = {
                        "id": uuid_conv_id,
                        "user_id": uuid_user_id,
                        "agent_type": "general",
                        "phase": phase or "unknown"
                    }
                    logger.info(f"Creating conversation with complete data: {conv_data}")
                    db.table("conversations").insert(conv_data).execute()
                    
                    # Try saving the message again
                    logger.info("Retrying message save after conversation creation")
                    response = db.table("messages").insert(data).execute()
                    return response.data[0] if response.data else message
                except Exception as retry_err:
                    logger.error(f"Final attempt failed: {retry_err}")
                    # Fall back to memory storage
                    _memory_db["messages"].append(message)
                    return message
            else:
                raise
    except Exception as e:
        logger.error(f"Error saving message: {e}")
        # Fall back to memory storage on failure
        _memory_db["messages"].append(message)
        return message

def save_scores(user_id: str, phase: str, component: str, criteria: str, score: int, feedback: str = None) -> Dict[str, Any]:
    """Save rubric scores to database or memory"""
    # Generate a score ID
    score_id = str(uuid.uuid4())
    
    score_data = {
        "id": score_id,
        "user_id": user_id,
        "phase": phase,
        "component": component,
        "criteria": criteria,
        "score": score,
        "feedback": feedback,
        "timestamp": datetime.now().isoformat()
    }
    
    if _using_memory_db:
        _memory_db["criterion_scores"].append(score_data)
        return score_data
    
    db = get_db()
    try:
        # Ensure user exists and get UUID
        uuid_user_id = ensure_user_exists(user_id)
        
        # Create database record with proper field names
        db_data = {
            "id": score_id,
            "user_id": uuid_user_id,
            "criteria": criteria,
            "score": score,
            "feedback": feedback or "",
            "assessed_at": "now()",
            "metadata": json.dumps({
                "phase": phase, 
                "component": component,
                "original_user_id": user_id
            })
        }
        
        # Try to save to database if possible
        response = db.table("assessments").insert(db_data).execute()
        return response.data[0] if response.data else score_data
    except Exception as e:
        logger.error(f"Error saving scores: {e}")
        # Fall back to memory storage
        _memory_db["criterion_scores"].append(score_data)
        return score_data

def get_user_scores(user_id: str, phase: str = None, component: str = None) -> List[Dict[str, Any]]:
    """Get user scores from database or memory with optional filtering"""
    if _using_memory_db:
        # Filter scores from memory
        scores = _memory_db["criterion_scores"]
        filtered_scores = [s for s in scores if s["user_id"] == user_id]
        
        if phase:
            filtered_scores = [s for s in filtered_scores if s["phase"] == phase]
        if component:
            filtered_scores = [s for s in filtered_scores if s["component"] == component]
            
        return filtered_scores
    
    db = get_db()
    try:
        # Format user ID as UUID if needed
        uuid_user_id = format_uuid(user_id, "user_")
        
        # Query assessments table with metadata filtering
        query = db.table("assessments").select("*").eq("user_id", uuid_user_id)
        
        response = query.order("assessed_at", desc=True).execute()
        if not response.data:
            return []
            
        # Post-process results to extract phase/component from metadata
        results = []
        for item in response.data:
            metadata = {}
            try:
                if "metadata" in item and item["metadata"]:
                    metadata = json.loads(item["metadata"])
            except:
                pass
                
            item_phase = metadata.get("phase", "")
            item_component = metadata.get("component", "")
            
            # Filter by phase/component if specified
            if (not phase or item_phase == phase) and (not component or item_component == component):
                results.append({
                    "id": item.get("id", ""),
                    "user_id": user_id,
                    "phase": item_phase,
                    "component": item_component,
                    "criteria": item.get("criteria", ""),
                    "score": item.get("score", 0),
                    "feedback": item.get("feedback", ""),
                    "timestamp": item.get("assessed_at", "")
                })
                
        return results
    except Exception as e:
        logger.error(f"Error fetching user scores: {e}")
        return []

def get_cached_scaffolding_level(user_id: str, phase: str, component: str = None) -> Optional[int]:
    """Get a cached scaffolding level for the user, phase, and component"""
    cache_key = f"{user_id}:{phase}:{component or 'general'}"
    return _scaffolding_cache.get(cache_key)

def cache_scaffolding_level(user_id: str, phase: str, component: str = None, level: int = 2):
    """Cache a scaffolding level for the user, phase, and component"""
    cache_key = f"{user_id}:{phase}:{component or 'general'}"
    _scaffolding_cache[cache_key] = level
    logger.debug(f"Cached scaffolding level {level} for {cache_key}")

# Update the existing get_scaffolding_level function to use cache
def get_scaffolding_level(user_id: str, phase: str, component: str = None) -> int:
    """Get the scaffolding level for a user in a specific phase and component"""
    # First check the cache
    cached_level = get_cached_scaffolding_level(user_id, phase, component)
    if cached_level is not None:
        return cached_level
        
    # If not in cache, check the database
    try:
        if _using_memory_db:
            # Default to medium scaffolding (level 2)
            level = 2
            key = f"{user_id}:{phase}:{component or 'general'}"
            if key in _memory_db.get("scaffolding_levels", {}):
                level = _memory_db["scaffolding_levels"][key]
                
            # Cache the result before returning
            cache_scaffolding_level(user_id, phase, component, level)
            return level
            
        db = get_db()
        
        # Format user_id as UUID if needed
        uuid_user_id = format_uuid(user_id, "user_")
        
        # Query to get latest scaffolding level
        query = db.table("scaffolding_levels").select("level").eq("user_id", uuid_user_id).eq("phase", phase)
        
        # Add component filter if provided
        if component:
            query = query.eq("component", component)
            
        # Order by most recent first
        query = query.order("created_at", desc=True).limit(1)
        
        response = query.execute()
        
        # Get level from response or default to medium (2)
        level = 2
        if response.data and len(response.data) > 0:
            level = response.data[0]["level"]
            
        # Cache the result before returning
        cache_scaffolding_level(user_id, phase, component, level)
        return level
    except Exception as e:
        logger.error(f"Error fetching scaffolding level: {e}")
        return 2  # Default to medium scaffolding on error

def get_message_count(user_id: str, phase: str, component: str = None) -> int:
    """Get count of messages for this user/phase/component"""
    if _using_memory_db:
        # Count messages from memory DB
        count = 0
        for message in _memory_db["messages"]:
            if (message["user_id"] == user_id and 
                message["phase"] == phase and
                (component is None or message["component"] == component) and
                message["role"] == "user"):  # Only count user messages
                count += 1
        return count
    
    db = get_db()
    try:
        # Format user_id as UUID if needed
        uuid_user_id = format_uuid(user_id, "user_")
        
        # Query to count messages
        query = db.table("messages").select("count", count="exact").eq("user_id", uuid_user_id).eq("phase", phase).eq("role", "user")
        
        # Add component filter if provided
        if component:
            query = query.eq("component", component)
        
        response = query.execute()
        return response.count or 0
    except Exception as e:
        logger.error(f"Error counting messages: {e}")
        return 0

def get_messages(user_id: str, conversation_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Get conversation messages from database or memory
    
    Args:
        user_id: The user ID
        conversation_id: The conversation ID
        limit: Maximum number of messages to return (default: 5)
        
    Returns:
        List of message objects sorted by timestamp (oldest first)
    """
    if _using_memory_db:
        # Filter messages from memory DB
        filtered_messages = [
            m for m in _memory_db["messages"] 
            if m["user_id"] == user_id and m["conversation_id"] == conversation_id
        ]
        
        # Sort by timestamp (oldest first)
        sorted_messages = sorted(filtered_messages, key=lambda m: m["timestamp"])
        
        # Return limited number of most recent messages
        return sorted_messages[-limit:] if limit > 0 else sorted_messages
    
    # Using database
    db = get_db()
    try:
        # Format IDs as UUIDs if needed
        uuid_conv_id = format_uuid(conversation_id, "conv_")
        
        # Query for messages - note we only filter by conversation_id as user_id column doesn't exist
        query = (db.table("messages")
                .select("*")
                .eq("conversation_id", uuid_conv_id)
                .order("timestamp", desc=False))
        
        # Apply limit if specified
        if limit > 0:
            query = query.limit(limit)
            
        response = query.execute()
        
        if not response.data:
            return []
            
        # Format messages for consistency
        result = []
        for msg in response.data:
            # Extract metadata
            metadata = {}
            if "metadata" in msg and msg["metadata"]:
                try:
                    metadata = json.loads(msg["metadata"])
                except:
                    pass
                    
            # Format message
            result.append({
                "id": msg.get("id", ""),
                "user_id": user_id,  # Use the provided user_id since it's not in the DB
                "conversation_id": conversation_id,
                "role": msg.get("sender_type", "user"),
                "content": msg.get("content", ""),
                "phase": metadata.get("phase", ""),
                "component": metadata.get("component", ""),
                "timestamp": msg.get("timestamp", "")
            })
            
        return result
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        return []

def save_llm_interaction(user_id: str, model: str, tokens_in: int, tokens_out: int, 
                        phase: str = None, component: str = None, metadata: dict = None) -> Dict[str, Any]:
    """Save LLM interaction details to database or memory"""
    # Generate a interaction ID
    interaction_id = str(uuid.uuid4())
    
    # Create base interaction object
    interaction = {
        "id": interaction_id,
        "user_id": user_id,
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "phase": phase,
        "component": component,
        "timestamp": datetime.now().isoformat()
    }
    
    # Add metadata if provided
    if metadata:
        interaction["metadata"] = metadata
    
    if _using_memory_db:
        if "llm_interactions" not in _memory_db:
            _memory_db["llm_interactions"] = []
        _memory_db["llm_interactions"].append(interaction)
        return interaction
    
    db = get_db()
    try:
        # Clean the user ID first if it has a prefix
        clean_user_id = user_id
        if isinstance(user_id, str) and user_id.startswith("user-"):
            clean_user_id = user_id[5:]  # Remove "user-" prefix
            logger.debug(f"Cleaned user ID from '{user_id}' to '{clean_user_id}'")
            
        # Ensure user exists and get UUID
        uuid_user_id = ensure_user_exists(clean_user_id)
        
        # Create database record
        db_data = {
            "id": interaction_id,
            "user_id": uuid_user_id,
            "model": model,
            "tokens_in": tokens_in,
            "tokens_out": tokens_out
        }
        
        # Add metadata as separate field if it exists in the schema
        try:
            # Set metadata field if it exists in schema
            if metadata or phase or component:
                meta_obj = {
                    "phase": phase,
                    "component": component,
                    "original_user_id": user_id,
                    **(metadata or {})
                }
                db_data["metadata"] = json.dumps(meta_obj)
        except Exception as meta_err:
            logger.warning(f"Couldn't add metadata: {meta_err}")
        
        # Try to save to database
        try:
            response = db.table("llm_interactions").insert(db_data).execute()
            return response.data[0] if response.data else interaction
        except Exception as e:
            logger.error(f"Error saving LLM interaction: {e}")
            
            # Try progressively simpler fallbacks
            try:
                logger.warning("Trying simplified llm_interactions insert")
                # Try a minimal insert with only the most basic fields
                minimal_data = {
                    "id": interaction_id,
                    "user_id": uuid_user_id,
                    "model": model
                }
                
                # Add numeric fields if they don't cause issues
                try:
                    minimal_data["tokens_in"] = tokens_in
                except:
                    pass
                    
                try:
                    minimal_data["tokens_out"] = tokens_out
                except:
                    pass
                
                simple_response = db.table("llm_interactions").insert(minimal_data).execute()
                if simple_response.data:
                    logger.info("Simplified llm_interactions insert succeeded")
                    return simple_response.data[0]
            except Exception as fallback_err:
                logger.error(f"Simplified llm_interactions insert failed: {fallback_err}")
                
                # Try one more time with an empty insert
                try:
                    logger.warning("Trying minimal llm_interactions insert")
                    bare_data = {
                        "id": interaction_id,
                        "user_id": uuid_user_id
                    }
                    
                    minimal_response = db.table("llm_interactions").insert(bare_data).execute()
                    if minimal_response.data:
                        logger.info("Minimal llm_interactions insert succeeded")
                        return minimal_response.data[0]
                except Exception as minimal_err:
                    logger.error(f"Minimal llm_interactions insert failed: {minimal_err}")
            
            # Fall back to memory storage if all database attempts fail
            if "llm_interactions" not in _memory_db:
                _memory_db["llm_interactions"] = []
            _memory_db["llm_interactions"].append(interaction)
            return interaction
            
    except Exception as e:
        logger.error(f"Error saving LLM interaction: {e}")
        # Fall back to memory storage
        if "llm_interactions" not in _memory_db:
            _memory_db["llm_interactions"] = []
        _memory_db["llm_interactions"].append(interaction)
        return interaction 