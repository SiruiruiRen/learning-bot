"""
Module for SoLBot's rubric-based scaffolding
Provides access to phase-specific rubrics and prompts
"""

import logging
from typing import Dict, Any, Optional

# Import phase rubrics - removed intro and summary imports
from backend.rubrics.phase2 import PHASE2_RUBRICS, get_system_prompt as get_phase2_prompt
from backend.rubrics.phase4 import PHASE4_RUBRICS, get_system_prompt as get_phase4_prompt
from backend.rubrics.phase5 import PHASE5_RUBRICS, get_system_prompt as get_phase5_prompt

# Define empty rubrics for intro and summary since files were deleted
INTRO_RUBRICS = {"general": {"criteria": {}}}
SUMMARY_RUBRICS = {"general": {"criteria": {}}}

logger = logging.getLogger("solbot.rubrics")

def get_intro_prompt(component="general", scaffolding_level=2):
    """Simple placeholder for intro prompt"""
    return """You are SoLBot guiding the student through the introduction phase.

Your goal is to welcome students and help them get oriented to the learning process.

⚠️ SCORING AND EVALUATION INSTRUCTIONS (NOT VISIBLE TO STUDENTS):
As part of your internal process, score the student's engagement on a scale of 1.0-3.0.
Calculate an overall score based on their participation and understanding.

⚠️ CRITICAL INSTRUCTION: DO NOT include any scoring information in the visible response text.
DO NOT use brackets, parentheses, or any other visible notation to show scores to students.
DO NOT mention "scaffolding" or "support levels" in your response.

Instead, ALWAYS end your response with a technical note using EXACTLY this HTML comment format:
<!-- INSTRUCTOR_METADATA
Score: [1.0-3.0]
Scaffolding: [1-3]
Rationale: [brief explanation]
-->

Example:
<!-- INSTRUCTOR_METADATA
Score: 2.5
Scaffolding: 2
Rationale: Student shows good understanding of the introduction concepts
-->
"""

def get_summary_prompt(component="general", scaffolding_level=2):
    """Simple placeholder for summary prompt"""
    return """You are SoLBot guiding the student through the summary phase.

Your goal is to help students reflect on their learning journey and synthesize what they've learned.

⚠️ SCORING AND EVALUATION INSTRUCTIONS (NOT VISIBLE TO STUDENTS):
As part of your internal process, score the student's overall learning journey on a scale of 1.0-3.0.
Calculate a score based on their reflection quality and demonstrated understanding.

⚠️ CRITICAL INSTRUCTION: DO NOT include any scoring information in the visible response text.

Instead, ALWAYS end your response with a technical note using EXACTLY this HTML comment format:
<!-- INSTRUCTOR_METADATA
Score: [1.0-3.0]
Scaffolding: [1-3]
Rationale: [brief explanation]
-->

Example:
<!-- INSTRUCTOR_METADATA
Score: 2.8
Scaffolding: 3
Rationale: Student demonstrates excellent reflection and synthesis of their learning journey
-->
"""

def get_rubric(phase: str, component: str = "general") -> Dict[str, Any]:
    """
    Get the appropriate rubric for a given phase and component
    
    Args:
        phase: The learning phase (intro, phase2, phase4, phase5, summary)
        component: The specific component within the phase
        
    Returns:
        The rubric dictionary for the specified phase and component
    """
    # Normalize phase name
    phase = phase.lower()
    
    # Map phase to rubric collection
    if phase == "intro":
        rubrics = INTRO_RUBRICS
    elif phase == "phase2":
        rubrics = PHASE2_RUBRICS
    elif phase == "phase4":
        rubrics = PHASE4_RUBRICS
    elif phase == "phase5":
        rubrics = PHASE5_RUBRICS
    elif phase == "summary":
        rubrics = SUMMARY_RUBRICS
    else:
        logger.warning(f"Unknown phase: {phase}, defaulting to intro")
        rubrics = INTRO_RUBRICS
    
    # Get component-specific rubric or default
    rubric = rubrics.get(component)
    if not rubric:
        logger.warning(f"Unknown component: {component} for phase: {phase}, using default")
        rubric = rubrics.get("general")
        
        # Fallback if no general rubric is defined
        if not rubric and rubrics:
            # Get the first available rubric
            rubric = next(iter(rubrics.values()))
    
    return rubric

def get_system_prompt(phase: str, component: str = "general", scaffolding_level: int = 2) -> str:
    """
    Get the appropriate system prompt for a given phase, component, and scaffolding level
    
    Args:
        phase: The learning phase (intro, phase2, phase4, phase5, summary)
        component: The specific component within the phase
        scaffolding_level: The scaffolding level (1-3)
        
    Returns:
        The system prompt for the specified phase, component, and scaffolding level
    """
    # Normalize phase name and scaffolding level
    phase = phase.lower()
    scaffolding_level = max(1, min(3, scaffolding_level))  # Ensure level is between 1 and 3
    
    # Map phase to prompt generator
    if phase == "intro":
        prompt = get_intro_prompt(component, scaffolding_level)
    elif phase == "phase2":
        prompt = get_phase2_prompt(component, scaffolding_level)
    elif phase == "phase4":
        prompt = get_phase4_prompt(component, scaffolding_level)
    elif phase == "phase5":
        prompt = get_phase5_prompt(component, scaffolding_level)
    elif phase == "summary":
        prompt = get_summary_prompt(component, scaffolding_level)
    else:
        logger.warning(f"Unknown phase: {phase}, defaulting to intro")
        prompt = get_intro_prompt(component, scaffolding_level)
    
    return prompt

def get_criteria_for_phase(phase: str, component: str = "general") -> Dict[str, Any]:
    """
    Get the criteria for a given phase and component
    
    Args:
        phase: The learning phase (intro, phase2, phase4, phase5, summary)
        component: The specific component within the phase
        
    Returns:
        A dictionary of criteria for the specified phase and component
    """
    rubric = get_rubric(phase, component)
    return rubric.get("criteria", {}) if rubric else {}

def get_scaffolding_strategies(phase: str, component: str = "general", level: int = 2) -> Dict[str, Any]:
    """
    Get the scaffolding strategies for a given phase, component, and level
    
    Args:
        phase: The learning phase (intro, phase2, phase4, phase5, summary)
        component: The specific component within the phase
        level: The scaffolding level (1-3)
        
    Returns:
        A dictionary of scaffolding strategies for the specified level
    """
    rubric = get_rubric(phase, component)
    if not rubric or "scaffolding" not in rubric:
        return {}
    
    return rubric.get("scaffolding", {}).get(level, {}) 