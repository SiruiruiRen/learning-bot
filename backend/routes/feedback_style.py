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
        
        # Use chain prompting: Generate feedback based on evaluation results
        try:
            prompt_name = f"phase{request.phase}_{request.component}"
            from prompt_engineering.scripts.final_prompts import get_feedback_prompt
            
            # Use feedback prompt with evaluation metadata (chain prompting step 2)
            system_prompt = get_feedback_prompt(
                prompt_name, 
                style=request.alternative_style, 
                evaluation_metadata=request.evaluation_metadata
            )
        except ValueError:
            # Fallback if prompt not found
            import json
            eval_str = json.dumps(request.evaluation_metadata, indent=2)
            system_prompt = f"""You are SoL2LBot, an AI tutor for self-regulated learning.

# EVALUATION RESULTS (DO NOT CHANGE)
{eval_str}

Generate feedback in {request.alternative_style} style using the EXACT evaluation results above.
Only change the tone and wording, keep all scores identical."""
        
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
        extracted_metadata = _extract_evaluation_metadata(response_content)
        cleaned_content = _clean_message_for_student(response_content)
        
        # CRITICAL: Always use the original evaluation_metadata to ensure consistency
        # Only use extracted if it matches the original scores
        final_evaluation = request.evaluation_metadata
        if extracted_metadata:
            original_score = request.evaluation_metadata.get('Overall_Score') or request.evaluation_metadata.get('overall_score')
            extracted_score = extracted_metadata.get('Overall_Score') or extracted_metadata.get('overall_score')
            # Only use extracted if scores match (within tolerance)
            if original_score and extracted_score and abs(float(original_score) - float(extracted_score)) < 0.1:
                # Merge extracted metadata but preserve original scores
                final_evaluation = {**request.evaluation_metadata, **extracted_metadata}
                final_evaluation['Overall_Score'] = original_score
                final_evaluation['overall_score'] = original_score
        
        # Log the alternative feedback generation for analytics
        try:
            session_details = db.get_session_by_id(request.session_id)
            if session_details:
                db.log_message(
                    session_id=request.session_id,
                    role="assistant",
                    content=cleaned_content,
                    phase=request.phase,
                    component=request.component,
                    metadata={
                        "feedback_style": request.alternative_style,
                        "original_evaluation": request.evaluation_metadata,
                        "is_alternative_feedback": True
                    }
                )
        except Exception as log_error:
            logger.warning(f"Failed to log alternative feedback: {log_error}")
        
        return {
            "success": True,
            "data": {
                "message": cleaned_content,
                "evaluation": final_evaluation,  # Always use original evaluation to ensure consistency
                "style": request.alternative_style
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating alternative feedback: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate alternative feedback: {str(e)}")
