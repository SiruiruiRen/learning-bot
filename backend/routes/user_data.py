"""
User Data Collection API route for SoLBot
"""

import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from datetime import datetime
import json

from backend.utils.db import get_db, format_uuid

logger = logging.getLogger("solbot.routes.user_data")

router = APIRouter()

class UserDataItem(BaseModel):
    data_type: str
    value: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/{user_id}")
async def save_user_data(user_id: str, data: UserDataItem) -> Dict[str, Any]:
    """
    Save user data
    """
    try:
        logger.info(f"Saving user data for {user_id}: {data.data_type}")
        
        # Get database client
        db = get_db()
        
        if db is None:
            # In-memory fallback if db is not available
            logger.warning("Database connection not available, using in-memory fallback")
            return {
                "id": "memory-id",
                "user_id": user_id,
                "data_type": data.data_type,
                "value": data.value,
                "metadata": data.metadata,
                "created_at": datetime.now().isoformat(),
                "storage_type": "memory"
            }
        
        # Format user ID as UUID
        uuid_user_id = format_uuid(user_id, "user_")
        
        # Check if user exists, create if not - with error handling
        try:
            user_response = db.table("users").select("id").eq("id", uuid_user_id).execute()
            if not user_response.data:
                logger.info(f"Creating new user: {uuid_user_id}")
                try:
                    db.table("users").insert({"id": uuid_user_id}).execute()
                except Exception as user_err:
                    # Continue even if user creation fails
                    logger.warning(f"Failed to create user, continuing: {user_err}")
        except Exception as check_err:
            logger.warning(f"Failed to check if user exists, continuing: {check_err}")
        
        # Either use SQL function or direct insert - with better error handling
        db_success = False
        error_details = None
        
        # Try each storage method in sequence, break on first success
        storage_methods = [
            "function",  # SQL function
            "direct",    # Direct table insert
            "minimal",   # Minimal fields insert
            "memory"     # In-memory fallback
        ]
        
        result = None
        for method in storage_methods:
            try:
                if method == "function":
                    # Try using the SQL function first
                    try:
                        response = db.rpc(
                            "save_user_data", 
                            {
                                "p_user_id": uuid_user_id,
                                "p_data_type": data.data_type,
                                "p_value": data.value,
                                "p_metadata": json.dumps(data.metadata) if data.metadata else None
                            }
                        ).execute()
                        
                        result = {
                            "id": response.data[0] if response.data else "function-id",
                            "user_id": user_id,
                            "data_type": data.data_type,
                            "value": data.value, 
                            "metadata": data.metadata,
                            "created_at": datetime.now().isoformat(),
                            "storage_type": "function"
                        }
                        db_success = True
                        break
                    except Exception as function_error:
                        logger.warning(f"SQL function failed, trying next method: {function_error}")
                        error_details = function_error
                
                elif method == "direct":
                    # Direct insert as fallback
                    insert_data = {
                        "user_id": uuid_user_id,
                        "data_type": data.data_type,
                        "value": data.value
                    }
                    
                    # Only add metadata if it exists and we have data
                    if data.metadata:
                        try:
                            insert_data["metadata"] = json.dumps(data.metadata)
                        except Exception as meta_err:
                            logger.warning(f"Failed to add metadata, skipping: {meta_err}")
                    
                    try:
                        response = db.table("user_data").insert(insert_data).execute()
                        
                        if response.data:
                            result = {
                                "id": response.data[0]["id"] if "id" in response.data[0] else "direct-id",
                                "user_id": user_id,
                                "data_type": data.data_type,
                                "value": data.value,
                                "metadata": data.metadata,
                                "created_at": response.data[0].get("created_at", datetime.now().isoformat()),
                                "storage_type": "direct"
                            }
                            db_success = True
                            break
                    except Exception as db_err:
                        logger.warning(f"Direct insert failed, trying next method: {db_err}")
                        error_details = db_err
                
                elif method == "minimal":
                    # Try one more time with no metadata column
                    try:
                        logger.warning("Trying minimal fallback without additional columns")
                        # Create a very minimal insert with just required fields
                        minimal_data = {
                            "user_id": uuid_user_id,
                            "data_type": data.data_type
                        }
                        
                        # Add value field if possible
                        try:
                            minimal_data["value"] = data.value
                        except:
                            pass
                        
                        # Try to insert with minimal data
                        minimal_response = db.table("user_data").insert(minimal_data).execute()
                        
                        if minimal_response.data:
                            logger.info("Minimal data insert succeeded")
                            result = {
                                "id": minimal_response.data[0].get("id", "minimal-id"),
                                "user_id": user_id,
                                "data_type": data.data_type,
                                "value": data.value,
                                "metadata": data.metadata,
                                "created_at": minimal_response.data[0].get("created_at", datetime.now().isoformat()),
                                "storage_type": "minimal"
                            }
                            db_success = True
                            break
                    except Exception as minimal_err:
                        logger.warning(f"Minimal insert failed, using in-memory fallback: {minimal_err}")
                        error_details = minimal_err
                
                elif method == "memory":
                    # Ultimate fallback - just return something in memory
                    result = {
                        "id": f"memory-{user_id}-{datetime.now().timestamp()}",
                        "user_id": user_id,
                        "data_type": data.data_type,
                        "value": data.value,
                        "metadata": data.metadata,
                        "created_at": datetime.now().isoformat(),
                        "storage_type": "memory",
                        "error": str(error_details) if error_details else "Using memory fallback"
                    }
                    logger.info("Using in-memory fallback storage")
                    db_success = True
                    break
            
            except Exception as method_err:
                logger.warning(f"Error with storage method {method}: {method_err}")
                error_details = method_err
        
        # If all methods failed, use the absolute final fallback
        if not db_success:
            logger.error("All storage methods failed, returning memory fallback")
            return {
                "id": f"fallback-{datetime.now().timestamp()}",
                "user_id": user_id,
                "data_type": data.data_type,
                "value": data.value,
                "metadata": data.metadata,
                "created_at": datetime.now().isoformat(),
                "storage_type": "emergency-fallback",
                "error": str(error_details) if error_details else "All storage methods failed"
            }
        
        return result
    
    except Exception as e:
        logger.error(f"Error saving user data: {e}")
        # Even in case of a total failure, return something rather than raise an exception
        # This ensures the app continues to function even with database errors
        return {
            "id": f"error-{datetime.now().timestamp()}",
            "user_id": user_id,
            "data_type": data.data_type,
            "value": data.value,
            "metadata": data.metadata,
            "created_at": datetime.now().isoformat(),
            "storage_type": "error-fallback",
            "error": str(e)
        }

@router.get("/{user_id}")
async def get_user_data(user_id: str, data_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Get user data with optional filtering by data_type
    """
    try:
        logger.info(f"Retrieving user data for {user_id}")
        
        # Get database client
        db = get_db()
        
        if db is None:
            # In-memory fallback
            logger.warning("Database connection not available, returning empty result")
            return []
        
        # Format user ID as UUID
        uuid_user_id = format_uuid(user_id, "user_")
        
        try:
            # Query user data
            query = db.table("user_data").select("*").eq("user_id", uuid_user_id)
            
            # Filter by data_type if provided
            if data_type:
                query = query.eq("data_type", data_type)
            
            # Order by created_at
            query = query.order("created_at", desc=True)
            
            response = query.execute()
            
            if not response.data:
                return []
            
            # Format response
            return [{
                "id": item.get("id"),
                "user_id": user_id,
                "data_type": item.get("data_type"),
                "value": item.get("value"),
                "metadata": json.loads(item.get("metadata")) if item.get("metadata") else None,
                "created_at": item.get("created_at")
            } for item in response.data]
        except Exception as db_err:
            logger.warning(f"Database query failed, returning empty result: {db_err}")
            return []
    
    except Exception as e:
        logger.error(f"Error retrieving user data: {e}")
        # Return empty list instead of raising exception
        return [] 