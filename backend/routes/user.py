"""
User API route for SoLBot
"""

import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional

from backend.utils.db import get_db

logger = logging.getLogger("solbot.routes.user")

router = APIRouter()

@router.get("/{user_id}")
async def get_user(user_id: str) -> Dict[str, Any]:
    """
    Get user profile information
    """
    try:
        logger.info(f"Retrieving user profile for {user_id}")
        
        # Get database client
        db = get_db()
        
        # Query user profile
        response = db.table("users").select("*").eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving user profile: {str(e)}")

@router.post("/")
async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new user profile
    """
    try:
        logger.info(f"Creating new user profile")
        
        # Get database client
        db = get_db()
        
        # Validate required fields
        if "id" not in user_data:
            raise HTTPException(status_code=400, detail="User ID is required")
        
        # Insert user record
        response = db.table("users").insert(user_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create user profile")
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating user profile: {str(e)}")

@router.put("/{user_id}")
async def update_user(user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing user profile
    """
    try:
        logger.info(f"Updating user profile for {user_id}")
        
        # Get database client
        db = get_db()
        
        # Remove id from update data if present
        if "id" in user_data:
            del user_data["id"]
        
        # Update user record
        response = db.table("users").update(user_data).eq("id", user_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
        
        return response.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating user profile: {str(e)}") 