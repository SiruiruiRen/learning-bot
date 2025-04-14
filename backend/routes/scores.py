"""
Scores API route for SoLBot
"""

import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional

from backend.utils.db import get_db, get_user_scores, save_scores

logger = logging.getLogger("solbot.routes.scores")

router = APIRouter()

@router.get("/{user_id}")
async def get_scores(
    user_id: str, 
    phase: Optional[str] = None, 
    component: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get rubric scores for a user, optionally filtered by phase and component
    """
    try:
        logger.info(f"Retrieving scores for user {user_id}")
        
        # Query scores from database
        scores = get_user_scores(user_id, phase, component)
        
        return scores
    
    except Exception as e:
        logger.error(f"Error retrieving scores: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving scores: {str(e)}")

@router.post("/")
async def create_score(score_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Record a new score for a rubric criterion
    """
    try:
        logger.info(f"Creating new score")
        
        # Validate required fields
        required_fields = ["user_id", "phase", "component", "criteria", "score"]
        for field in required_fields:
            if field not in score_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Validate score value
        if not isinstance(score_data["score"], int) or score_data["score"] < 1 or score_data["score"] > 3:
            raise HTTPException(status_code=400, detail="Score must be an integer between 1 and 3")
        
        # Save score to database
        result = save_scores(
            user_id=score_data["user_id"],
            phase=score_data["phase"],
            component=score_data["component"],
            criteria=score_data["criteria"],
            score=score_data["score"],
            feedback=score_data.get("feedback")
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to save score")
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving score: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving score: {str(e)}")

@router.get("/average/{user_id}")
async def get_average_score(
    user_id: str, 
    phase: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get average scores for a user, optionally filtered by phase
    """
    try:
        logger.info(f"Retrieving average scores for user {user_id}")
        
        # Get database client
        db = get_db()
        
        # Build query
        query = db.table("criterion_scores") \
                  .select("phase, AVG(score) as average_score") \
                  .eq("user_id", user_id)
        
        if phase:
            query = query.eq("phase", phase)
        
        # Execute query grouped by phase
        query = query.group_by("phase").execute()
        
        if not query.data:
            return {"averages": []}
        
        # Format response
        averages = []
        for row in query.data:
            averages.append({
                "phase": row["phase"],
                "average_score": float(row["average_score"])
            })
        
        return {"averages": averages}
    
    except Exception as e:
        logger.error(f"Error retrieving average scores: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving average scores: {str(e)}") 