"""
Phase 4: Strategic Planning Rubrics
"""

# Long-term Goal Rubric
LONG_TERM_GOAL_RUBRIC = {
    "name": "Long-term Goal Setting",
    "description": "Evaluates the quality of long-term learning goals",
    "criteria": {
        "specificity": {
            "description": "Clarity and detail of the goal",
            "levels": {
                1: "Vague or unclear goal definition",
                2: "Partially specific goal with some details",
                3: "Highly specific goal with clear details"
            }
        },
        "timeline": {
            "description": "Clarity of timeframe and milestones",
            "levels": {
                1: "No clear timeframe",
                2: "General timeframe without milestones",
                3: "Specific start/end dates with milestone timeline"
            }
        },
        "measurement": {
            "description": "Measurability of success criteria",
            "levels": {
                1: "No success indicators",
                2: "Vague success indicators",
                3: "Specific, quantifiable success metrics"
            }
        }
    }
}

# Short-term Goals Rubric
SHORT_TERM_GOALS_RUBRIC = {
    "name": "Short-term Goal Setting",
    "description": "Evaluates the quality of short-term learning goals",
    "criteria": {
        "smart_elements": {
            "description": "SMART goal elements (Specific, Measurable, Achievable, Relevant, Time-bound)",
            "levels": {
                1: "Missing 3+ SMART elements",
                2: "Missing 1-2 SMART elements",
                3: "Complete SMART goals"
            }
        },
        "progressive_sequence": {
            "description": "Progressive sequence of goals",
            "levels": {
                1: "Disconnected goals",
                2: "Partial logical progression",
                3: "Clear building sequence toward larger goal"
            }
        },
        "long_term_alignment": {
            "description": "Alignment with long-term goals",
            "levels": {
                1: "Unclear connection to long-term goal",
                2: "Partial connection to long-term goal",
                3: "Direct contribution to long-term goal"
            }
        }
    }
}

# IF-THEN Contingency Strategies Rubric
CONTINGENCY_STRATEGIES_RUBRIC = {
    "name": "IF-THEN Contingency Strategies",
    "description": "Evaluates the quality of contingency planning",
    "criteria": {
        "challenge_specificity": {
            "description": "Specificity of anticipated challenges",
            "levels": {
                1: "Vague challenges",
                2: "Somewhat specific challenges",
                3: "Precise challenges with clear triggers"
            }
        },
        "response_clarity": {
            "description": "Clarity of responses to challenges",
            "levels": {
                1: "Vague responses",
                2: "General but actionable responses",
                3: "Specific actions with implementation steps"
            }
        },
        "feasibility": {
            "description": "Feasibility of responses",
            "levels": {
                1: "Unrealistic responses",
                2: "Generally feasible with limitations",
                3: "Completely realistic with resource consideration"
            }
        }
    }
}

# Access all rubrics by component name
PHASE4_RUBRICS = {
    "long_term_goals": LONG_TERM_GOAL_RUBRIC,
    "short_term_goals": SHORT_TERM_GOALS_RUBRIC,
    "contingency_strategies": CONTINGENCY_STRATEGIES_RUBRIC,
    # Add URL path-based keys to match frontend routes
    "longtermgoal": LONG_TERM_GOAL_RUBRIC,
    "shorttermgoal": SHORT_TERM_GOALS_RUBRIC,
    "ifthen": CONTINGENCY_STRATEGIES_RUBRIC,
    # Default to long-term goals if component not specified
    "general": LONG_TERM_GOAL_RUBRIC
}

def get_rubric(component="general"):
    """Get the appropriate rubric for the given component"""
    return PHASE4_RUBRICS.get(component, LONG_TERM_GOAL_RUBRIC)

def get_system_prompt(component="general", scaffolding_level=2):
    """Get the system prompt for the given component and scaffolding level"""
    rubric = get_rubric(component)
    
    # Simplified core prompt with visible scoring and faster response design
    prompt = f"""You are a Strategic Planning Guide for Phase 4 of self-regulated learning.
Focus: {rubric["name"]}

KEY CRITERIA:
"""
    
    # Add core criteria - simplified
    for criterion, details in rubric["criteria"].items():
        prompt += f"- {criterion.capitalize()}: {details['levels'][1]} to {details['levels'][3]}\n"
    
    # Add component-specific guidance (simplified)
    task_specific_guidance = ""
    if component in ["longtermgoal", "long_term_goals"]:
        task_specific_guidance = """
LONG-TERM GOAL GUIDANCE:
- Evaluate ONE long-term goal
- Check: specificity (clear details), timeline (with milestones), measurement (success metrics)
- Show the score directly in your evaluation
- Do not use SMART elements in your evaluation
"""
    elif component in ["shorttermgoal", "short_term_goals"]:
        task_specific_guidance = """
SHORT-TERM GOAL GUIDANCE:
- Evaluate ONE SMART goal (Specific, Measurable, Achievable, Relevant, Time-bound)
- Ensure connection to long-term goal
- Show the score directly in your evaluation
"""
    elif component in ["ifthen", "contingency_strategies"]:
        task_specific_guidance = """
IF-THEN CONTINGENCY PLANNING:
- Evaluate EXACTLY 3 IF-THEN contingency strategies
- Check: challenge specificity, response clarity, feasibility
- Show the score directly in your evaluation
"""
    
    prompt += task_specific_guidance
    
    # Add engaging visual assessment framework
    prompt += """
VISUAL ASSESSMENT FORMAT - Always include a visually engaging section at the beginning:
1. Start with a brief, encouraging overview of the goal
2. Include direct scoring information:
   "## Score Summary 📊
   - Specificity: X/3 [brief explanation]
   - Timeline: X/3 [brief explanation]
   - Measurement: X/3 [brief explanation]
   - Overall Score: X.X/3"

3. Add actionable improvement suggestions in an engaging format
4. Use emoji, tables, or bullet points for visual appeal
5. Keep responses concise and direct - focus on actionable feedback
6. Be positive and energetic in tone

When goal is excellent (score ≥ 2.0), end with: "Your goal framework is excellent! Please click the Continue button below to proceed to the next step in your learning journey."

SCORING FORMAT (VISIBLE TO USERS):
Score: [1.0-3.0]/3.0
Scaffolding: Level [1-3]
Rationale: [brief explanation]

METADATA (STILL INCLUDE):
<!-- INSTRUCTOR_METADATA
Score: [1.0-3.0]
Scaffolding: [1-3]
Specificity: [1-3]
Timeline: [1-3]
Measurement: [1-3]
Rationale: [brief explanation]
-->
"""
    
    return prompt 