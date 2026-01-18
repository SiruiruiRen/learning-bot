from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from ..utils import db
from ..utils.llm import call_claude
from prompt_engineering.scripts.final_prompts import get_prompt

logger = logging.getLogger("solbot.routes.feedback_style")
router = APIRouter(prefix="/api", tags=["feedback"])

class AlternativeFeedbackRequest(BaseModel):
    session_id: str
    phase: str
    component: str
    user_message: str
    evaluation_metadata: Dict[str, Any]
    alternative_style: str  # "warm" or "direct"

@router.post("/alternative-feedback")
async def get_alternative_feedback(request: AlternativeFeedbackRequest):
    """
    Generate feedback in an alternative communication style based on existing evaluation.
    This allows users to see the same evaluation results presented in a different tone.
    """
    try:
        # Get chat history for context
        chat_history = db.get_messages_for_session(request.session_id, limit=10)
        formatted_history = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in chat_history if msg["role"] in ["user", "assistant"]
        ] if chat_history else []
        
        # Get prompt with alternative style
        try:
            prompt_name = f"phase{request.phase}_{request.component}"
            system_prompt = get_prompt(prompt_name, style=request.alternative_style)
            
            # Add instruction to use the same evaluation results
            system_prompt += f"""

# CRITICAL INSTRUCTION
You have already evaluated this student's submission. The evaluation results are:
{request.evaluation_metadata}

Your task is to present the SAME evaluation results but in a {request.alternative_style} communication style.
- Keep the same scores and categories
- Keep the same assessment criteria
- Only change the TONE and WORDING to match the {request.alternative_style} style
- The content and guidance should be equivalent, just presented differently
"""
        except ValueError:
            system_prompt = f"You are SoL2LBot, an AI tutor for self-regulated learning. Present feedback in a {request.alternative_style} style."
        
        # Generate alternative feedback
        llm_response = await call_claude(
            system_prompt=system_prompt,
            user_message=request.user_message,
            chat_history=formatted_history,
            temperature=0.3,  # Lower temperature for more consistent results
            max_tokens=800
        )
        
        response_content = llm_response.get("content", "")
        
        # Extract evaluation metadata (should be the same)
        from ..routes.chat import _extract_evaluation_metadata, _clean_message_for_student
        evaluation_metadata = _extract_evaluation_metadata(response_content)
        cleaned_content = _clean_message_for_student(response_content)
        
        return {
            "success": True,
            "data": {
                "message": cleaned_content,
                "evaluation": evaluation_metadata or request.evaluation_metadata,  # Use original if extraction fails
                "style": request.alternative_style
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating alternative feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate alternative feedback: {str(e)}")
