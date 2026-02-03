#!/usr/bin/env python3
"""
Test script to generate examples of warm vs direct feedback
for Phase 2 (Task Analysis) using real Claude API calls.

This helps demonstrate the difference in communication styles while maintaining
the same evaluation scores and scaffolding levels.
"""

import sys
import os
import asyncio
import json

# Add parent directories to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.utils.llm import call_claude
from prompt_engineering.scripts.final_prompts import get_prompt

# STEM Example Student Submissions for Task Analysis
# These vary in quality to test different scaffolding levels

STUDENT_EXAMPLES = {
    "low_quality_engineering": {
        "description": "Vague goals, generic resources - Engineering student",
        "submission": """Course/Learning Task: Learn circuit analysis

Available Resources: Textbook, online videos

Strategic Resource Utilization: Study the materials and practice problems""",
        "expected_score": "0-1/4 (LOW)",
    },
    
    "medium_quality_cs": {
        "description": "Some specificity but lacks strategic depth - CS student",
        "submission": """Course/Learning Task: Master data structures including linked lists, stacks, and queues from CS 201

Available Resources: CS 201 textbook "Introduction to Algorithms", lecture videos

Strategic Resource Utilization: I will read the textbook chapters on each data structure and watch the lecture videos""",
        "expected_score": "2/4 (MEDIUM)",
    },
    
    "high_quality_physics": {
        "description": "Specific, detailed, and strategic - Physics student",
        "submission": """Course/Learning Task: Master Newton's laws of motion and their applications to solve kinematics problems involving projectile motion, circular motion, and friction from Physics 101

Available Resources: Physics 101 textbook "University Physics" Chapter 4-6, Professor Martinez's lecture recordings on dynamics (Week 3-4), MIT OpenCourseWare problem sets on kinematics, course lab manual experiments on friction

Strategic Resource Utilization: First, read textbook Chapters 4-6 to understand conceptual foundations of force, mass, and acceleration relationships. Then, watch Professor Martinez's lectures focusing on problem-solving strategies for free-body diagrams. Use MIT OpenCourseWare problem sets for additional practice on projectile motion, starting with simpler 1D problems before advancing to 2D. Cross-reference lab manual to connect theoretical concepts with experimental observations""",
        "expected_score": "4/4 (HIGH)",
    },
    
    "medium_quality_bio": {
        "description": "Specific resources but vague strategy - Biology student",
        "submission": """Course/Learning Task: Learn cellular respiration pathways including glycolysis, Krebs cycle, and electron transport chain

Available Resources: Biology textbook Chapter 9, Khan Academy cellular respiration videos, class lecture notes from Week 5

Strategic Resource Utilization: Watch Khan Academy videos, read textbook chapter, review lecture notes""",
        "expected_score": "2/4 (MEDIUM)",
    },
    
    "low_quality_math": {
        "description": "Too vague, no detail - Math student",
        "submission": """Course/Learning Task: Get better at calculus

Available Resources: Math book and YouTube

Strategic Resource Utilization: Watch videos when confused""",
        "expected_score": "0/4 (LOW)",
    }
}


async def test_tone_difference(example_name: str, example_data: dict):
    """
    Test warm vs direct tone for the same student submission.
    
    Returns both feedback versions for comparison.
    """
    print(f"\n{'='*80}")
    print(f"Testing: {example_name}")
    print(f"Description: {example_data['description']}")
    print(f"Expected Score: {example_data['expected_score']}")
    print(f"{'='*80}\n")
    print(f"Student Submission:\n{example_data['submission']}\n")
    
    results = {}
    
    for style in ["warm", "direct"]:
        print(f"\n--- Generating {style.upper()} feedback ---")
        
        # Get the prompt with specified style
        system_prompt = get_prompt("phase2_learning_objectives", style=style)
        
        try:
            response = await call_claude(
                system_prompt=system_prompt,
                user_message=example_data['submission'],
                chat_history=[],
                temperature=0.5,
                max_tokens=800
            )
            
            feedback = response.get("content", "No response")
            results[style] = feedback
            
            print(f"\n{style.upper()} FEEDBACK:\n")
            print(feedback)
            print("\n" + "-"*80)
            
        except Exception as e:
            print(f"Error generating {style} feedback: {e}")
            results[style] = f"Error: {e}"
    
    return results


async def generate_comparison_document():
    """
    Generate a markdown document comparing warm vs direct feedback
    for all example submissions.
    """
    output = []
    output.append("# Tone Comparison: Warm vs Direct Feedback\n\n")
    output.append("*Generated using Claude 4.5 Sonnet with SoLBot Phase 2 (Task Analysis) Prompts*\n\n")
    output.append("This document demonstrates how the same evaluation scores and scaffolding levels ")
    output.append("can be communicated in different tones (warm vs direct) while maintaining pedagogical effectiveness.\n\n")
    output.append("**Key Principle**: Both versions use identical rubric scores and provide the same level of scaffolding ")
    output.append("(templates, examples, suggestions). The only difference is the communication style.\n\n")
    output.append("---\n\n")
    
    all_results = {}
    
    for example_name, example_data in STUDENT_EXAMPLES.items():
        print(f"\nProcessing: {example_name}...")
        results = await test_tone_difference(example_name, example_data)
        all_results[example_name] = {
            "data": example_data,
            "feedback": results
        }
        
        output.append(f"## Example {len(all_results)}: {example_name.replace('_', ' ').title()}\n\n")
        output.append(f"**Description**: {example_data['description']}\n\n")
        output.append(f"**Expected Score**: {example_data['expected_score']}\n\n")
        output.append(f"### Student Submission\n\n")
        output.append(f"```\n{example_data['submission']}\n```\n\n")
        
        output.append("### 🌟 WARM Feedback\n\n")
        output.append(f"{results.get('warm', 'N/A')}\n\n")
        
        output.append("### 📋 DIRECT Feedback\n\n")
        output.append(f"{results.get('direct', 'N/A')}\n\n")
        
        output.append("### 🔍 Key Differences to Discuss\n\n")
        output.append("- **Tone**: Warm uses encouraging language vs. Direct uses concise statements\n")
        output.append("- **Emojis**: Warm includes more emojis vs. Direct uses minimal emojis\n")
        output.append("- **Feedback Structure**: Both use same rubric scores and scaffolding level\n")
        output.append("- **Content Quality**: Both provide same depth of guidance and examples\n\n")
        output.append("---\n\n")
    
    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "TONE_COMPARISON_EXAMPLES.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(''.join(output))
    
    print(f"\n\n{'='*80}")
    print(f"✅ Comparison document generated successfully!")
    print(f"📄 Location: {output_path}")
    print(f"{'='*80}\n")
    
    return output_path


async def main():
    """Main execution function."""
    print("Starting tone comparison test for Phase 2 (Task Analysis)...")
    print("This will generate real Claude 4.5 responses for warm and direct tones.\n")
    
    # Generate comparison document
    output_path = await generate_comparison_document()
    
    print("\nTest complete! Review the generated document for lab meeting discussion.")
    print(f"Document location: {output_path}")


if __name__ == "__main__":
    asyncio.run(main())
