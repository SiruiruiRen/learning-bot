"""
Add this function to backend/utils/db.py to fix the scaffolding level tracking.
"""

def save_scaffolding_level(user_id: str, phase: str, level: int, component: str = None, 
                           conversation_id: str = None, previous_level: int = None, 
                           reason: str = None) -> Dict[str, Any]:
    """Save a scaffolding level to the database or memory
    
    This function stores the scaffolding level in the database or memory store
    and also updates the cache for future lookups.
    
    Args:
        user_id: The user ID
        phase: The learning phase
        level: The scaffolding level (1=high, 2=medium, 3=low)
        component: Optional component within the phase
        conversation_id: Optional conversation ID associated with this change
        previous_level: Optional previous scaffolding level
        reason: Optional reason for changing the scaffolding level
        
    Returns:
        Dictionary with the saved data
    """
    # Generate an ID for this record
    record_id = str(uuid.uuid4())
    
    # Validate the level (ensure it's between 1-3)
    if level < 1:
        level = 1
    elif level > 3:
        level = 3
        
    # Create the scaffolding level record
    record = {
        "id": record_id,
        "user_id": user_id,
        "phase": phase,
        "component": component,
        "level": level,
        "conversation_id": conversation_id,
        "previous_level": previous_level,
        "reason": reason,
        "created_at": datetime.now().isoformat()
    }
    
    # Update the cache first
    cache_scaffolding_level(user_id, phase, component, level)
    
    # Use in-memory storage if required
    if _using_memory_db:
        # Initialize the scaffolding_levels dict if it doesn't exist
        if "scaffolding_levels" not in _memory_db:
            _memory_db["scaffolding_levels"] = {}
            
        # Save to memory storage
        key = f"{user_id}:{phase}:{component or 'general'}"
        _memory_db["scaffolding_levels"][key] = level
        
        # Also save the full record to a history list
        if "scaffolding_history" not in _memory_db:
            _memory_db["scaffolding_history"] = []
            
        _memory_db["scaffolding_history"].append(record)
        return record
    
    # Using database
    db = get_db()
    try:
        # Format user ID as UUID
        uuid_user_id = ensure_user_exists(user_id)
        
        # Format conversation ID as UUID if provided
        uuid_conv_id = None
        if conversation_id:
            uuid_conv_id = format_uuid(conversation_id, "conv_")
        
        # Create database record with only the fields that exist in the schema
        db_record = {
            "id": record_id,
            "user_id": uuid_user_id,
            "phase": phase,
            "level": level,
            "created_at": datetime.now().isoformat()
        }
        
        # Add optional fields if provided
        if component:
            db_record["component"] = component
            
        if uuid_conv_id:
            db_record["conversation_id"] = uuid_conv_id
            
        if previous_level:
            db_record["previous_level"] = previous_level
            
        if reason:
            db_record["reason"] = reason
            
        # Save to database
        response = db.table("scaffolding_levels").insert(db_record).execute()
        
        # Also save to scaffolding_history if that table exists
        try:
            db.table("scaffolding_history").insert({
                "id": str(uuid.uuid4()),
                "user_id": uuid_user_id,
                "phase": phase,
                "component": component,
                "level": level,
                "created_at": datetime.now().isoformat()
            }).execute()
        except Exception as history_err:
            logger.warning(f"Failed to save to scaffolding_history: {history_err}")
            
        return response.data[0] if response.data else record
    except Exception as e:
        logger.error(f"Error saving scaffolding level: {e}")
        
        # Fall back to memory storage
        if "scaffolding_levels" not in _memory_db:
            _memory_db["scaffolding_levels"] = {}
            
        key = f"{user_id}:{phase}:{component or 'general'}"
        _memory_db["scaffolding_levels"][key] = level
        
        if "scaffolding_history" not in _memory_db:
            _memory_db["scaffolding_history"] = []
            
        _memory_db["scaffolding_history"].append(record)
        return record

# --------------------------------------------------
# To use this function, modify the following code in backend/routes/chat.py:
# Find this code block (around line 520-580):
"""
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
"""

# And add this code right after it:
"""
                # Save the scaffolding level to the database
                try:
                    from backend.utils.db import save_scaffolding_level
                    
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
""" 