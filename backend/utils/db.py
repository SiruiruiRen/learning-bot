import os
import logging
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional
try:
    from supabase import create_client, Client
except ImportError:
    # Create placeholder Client type for type hinting
    class Client:
        pass

from dotenv import load_dotenv

# Load environment variables if not already loaded
load_dotenv()

logger = logging.getLogger("solbot.db")

# Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

# Global client
_supabase_client: Client = None
# Set to False to use Supabase
_using_memory_db = os.getenv("USE_MEMORY_DB", "false").lower() == "true"

# In-memory database fallback
_memory_db = {
    "users": {},
    "messages": [],
    "criterion_scores": [],
    "phase_progress": {}
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
    
    # Create a deterministic UUID based on the value to ensure consistency
    # This allows us to use the same generated UUID for the same input value
    namespace = uuid.UUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')  # Standard namespace for URLs
    return str(uuid.uuid5(namespace, f"{prefix}{str(val)}"))

def init_db():
    """Initialize the database connection or fallback to memory storage"""
    global _supabase_client, _using_memory_db
    
    # Check if we should use memory DB
    if _using_memory_db:
        logger.info("Using in-memory storage for database operations")
        return
    
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials not found. Using in-memory storage.")
        _using_memory_db = True
        return
    
    try:
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Database connection initialized successfully")
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
    global _supabase_client
    
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
        # Format user_id as UUID if needed
        uuid_id = format_uuid(user_id, "user_")
        
        response = db.table("users").select("*").eq("id", uuid_id).execute()
        if not response.data:
            logger.warning(f"User profile not found for user_id: {user_id}")
            return {"id": user_id}
        return response.data[0]
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        return {"id": user_id}

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
        uuid_user_id = format_uuid(user_id, "user_")
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
        
        # Only include fields that exist in the actual table schema
        data = {
            "id": message_id,
            "conversation_id": uuid_conv_id,
            "sender_type": role,
            "content": content,
            "timestamp": "now()",
            "metadata": json.dumps(meta_data)
        }
        
        # Only include user_id if it's a column in the messages table
        try:
            response = db.table("messages").insert(data).execute()
            return response.data[0] if response.data else message
        except Exception as e:
            if "column messages.user_id does not exist" in str(e):
                # Try without user_id in the data
                logger.info("Retrying message save without user_id field")
                response = db.table("messages").insert(data).execute()
                return response.data[0] if response.data else message
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
        # Format user ID as UUID if needed
        uuid_user_id = format_uuid(user_id, "user_")
        
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
        uuid_user_id = format_uuid(user_id, "user_")
        uuid_conv_id = format_uuid(conversation_id, "conv_")
        
        # Query for messages
        query = (db.table("messages")
                .select("*")
                .eq("user_id", uuid_user_id)
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
                "user_id": user_id,
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