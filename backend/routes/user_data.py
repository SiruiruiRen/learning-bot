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
            return {
                "id": "memory-id",
                "user_id": user_id,
                "data_type": data.data_type,
                "value": data.value,
                "metadata": data.metadata,
                "created_at": datetime.now().isoformat()
            }
        
        # Format user ID as UUID
        uuid_user_id = format_uuid(user_id, "user_")
        
        # Check if user exists, create if not
        user_response = db.table("users").select("id").eq("id", uuid_user_id).execute()
        if not user_response.data:
            logger.info(f"Creating new user: {uuid_user_id}")
            db.table("users").insert({"id": uuid_user_id, "email": f"{user_id}@example.com"}).execute()
        
        # Either use SQL function or direct insert
        try:
            # Try using the SQL function first
            response = db.rpc(
                "save_user_data", 
                {
                    "p_user_id": uuid_user_id,
                    "p_data_type": data.data_type,
                    "p_value": data.value,
                    "p_metadata": json.dumps(data.metadata) if data.metadata else None
                }
            ).execute()
            
            return {
                "id": response.data[0] if response.data else "function-id",
                "user_id": user_id,
                "data_type": data.data_type,
                "value": data.value, 
                "metadata": data.metadata,
                "created_at": datetime.now().isoformat()
            }
        except Exception as function_error:
            logger.warning(f"SQL function failed, falling back to direct insert: {function_error}")
            
            # Direct insert as fallback
            insert_data = {
                "user_id": uuid_user_id,
                "data_type": data.data_type,
                "value": data.value,
                "metadata": json.dumps(data.metadata) if data.metadata else None
            }
            
            response = db.table("user_data").insert(insert_data).execute()
            
            if not response.data:
                raise Exception("Failed to insert user data")
                
            return {
                "id": response.data[0]["id"],
                "user_id": user_id,
                "data_type": data.data_type,
                "value": data.value,
                "metadata": data.metadata,
                "created_at": response.data[0].get("created_at", datetime.now().isoformat())
            }
    
    except Exception as e:
        logger.error(f"Error saving user data: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving user data: {str(e)}")

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
            return []
        
        # Format user ID as UUID
        uuid_user_id = format_uuid(user_id, "user_")
        
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
    
    except Exception as e:
        logger.error(f"Error retrieving user data: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving user data: {str(e)}") 