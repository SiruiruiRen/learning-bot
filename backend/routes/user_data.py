"""
User Data Collection API route for SoLBot
"""

import logging
from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
import json

from backend.utils.db import save_user_data as db_save_user_data
from backend.utils.db import get_user_data as db_get_user_data

logger = logging.getLogger("solbot.routes.user_data")

router = APIRouter()

class UserDataItem(BaseModel):
    data_type: str
    value: str
    metadata: Optional[Dict[str, Any]] = None

@router.post("/{user_id}")
async def save_user_data(user_id: str, data: UserDataItem, request: Request):
    """
    Save user data
    """
    try:
        logger.info(f"Saving user data for {user_id}: {data.data_type}")
        
        # Extract client IP for tracking purposes
        client_ip = request.client.host if request.client else "unknown"
        
        # Add client IP to metadata
        metadata = data.metadata or {}
        metadata["client_ip"] = client_ip
        
        # Save data
        result = db_save_user_data(
            user_id=user_id,
            data_type=data.data_type,
            value=data.value,
            metadata=metadata
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error saving user data: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving user data: {str(e)}")

@router.get("/{user_id}")
async def get_user_data(user_id: str, data_type: Optional[str] = None):
    """
    Get user data with optional filtering by data_type
    """
    try:
        logger.info(f"Retrieving user data for {user_id}")
        
        # Get data
        results = db_get_user_data(
            user_id=user_id,
            data_type=data_type
        )
        
        return results
    
    except Exception as e:
        logger.error(f"Error retrieving user data: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving user data: {str(e)}")

@router.get("/")
async def healthcheck():
    """Health check endpoint"""
    return {"status": "healthy", "service": "user_data"} 