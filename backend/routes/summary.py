from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
from ..utils.llm import call_claude

logger = logging.getLogger("solbot.routes.summary")
router = APIRouter()

class SummaryInsightsRequest(BaseModel):
    user_content: str
    user_name: str
    phases_completed: int

@router.post("/summary-insights")
async def generate_summary_insights(request: SummaryInsightsRequest):
    """
    Generate personalized insights, keywords, and recommendations based on user's chat content.
    """
    try:
        system_prompt = """You are an expert learning coach analyzing a student's self-regulated learning journey.

Your task is to extract key insights from the student's chat conversations and provide:
1. **Key Learning Topics**: Extract 5-7 main topics/subjects the student is learning about
2. **Learning Strategies Mentioned**: Identify specific strategies the student plans to use
3. **Goals & Objectives**: Extract their learning goals and objectives
4. **Strengths**: Identify 3-4 areas where the student shows strong understanding or planning
5. **Personalized Recommendations**: Provide 4-5 actionable recommendations based on their specific content

Format your response as JSON with this structure:
{
  "keywords": ["topic1", "topic2", ...],
  "learningStrategies": ["strategy1", "strategy2", ...],
  "goals": ["goal1", "goal2", ...],
  "strengths": ["strength1", "strength2", ...],
  "recommendations": ["recommendation1", "recommendation2", ...]
}

Keep recommendations specific, actionable, and based on the student's actual content. Focus on learning strategies and plans, not time spent."""

        user_message = f"""Analyze this student's learning journey content:

Student Name: {request.user_name}
Phases Completed: {request.phases_completed}

Student's Content:
{request.user_content}

Provide insights in the JSON format specified above."""

        response = await call_claude(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.3,
            max_tokens=1000
        )
        
        content = response.get("content", "")
        
        # Try to extract JSON from the response
        try:
            import json
            import re
            # Find JSON in the response
            json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
            if json_match:
                insights = json.loads(json_match.group())
            else:
                # Fallback: parse the content manually
                insights = parse_insights_from_text(content)
        except Exception as e:
            logger.warning(f"Failed to parse JSON from Claude response: {e}")
            insights = parse_insights_from_text(content)
        
        return {"success": True, "insights": insights}
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")

def parse_insights_from_text(text: str) -> Dict[str, Any]:
    """Fallback parser if JSON extraction fails"""
    insights = {
        "keywords": [],
        "learningStrategies": [],
        "goals": [],
        "strengths": [],
        "recommendations": []
    }
    
    # Simple extraction logic
    lines = text.split('\n')
    current_section = None
    
    for line in lines:
        line_lower = line.lower()
        if 'keyword' in line_lower or 'topic' in line_lower:
            current_section = 'keywords'
        elif 'strateg' in line_lower:
            current_section = 'learningStrategies'
        elif 'goal' in line_lower or 'objective' in line_lower:
            current_section = 'goals'
        elif 'strength' in line_lower:
            current_section = 'strengths'
        elif 'recommendation' in line_lower or 'suggestion' in line_lower:
            current_section = 'recommendations'
        elif line.strip().startswith('-') or line.strip().startswith('•'):
            item = line.strip().lstrip('-•').strip()
            if item and current_section and current_section in insights:
                insights[current_section].append(item)
    
    return insights
