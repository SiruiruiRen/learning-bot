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
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
sys.path.insert(0, project_root)

from backend.utils.llm import call_claude
from prompt_engineering.scripts.final_prompts import get_prompt

# STEM Example Student Submissions for Task Analysis
# These vary in quality to test different scaffolding levels

STUDENT_EXAMPLES = {
    "low_quality": {
        "description": "Vague goals, generic resources",
        "submission": """Course/Learning Task: Learn Python for data analysis

Available Resources: Textbooks and online videos

Strategic Resource Utilization: I will study the materials""",
        "expected_score": "0-2/4 (LOW)",
    },
    
    "medium_quality": {
        "description": "Some specificity but lacks depth",
        "submission": """Course/Learning Task: Master data visualization using matplotlib and seaborn libraries from Data Science 101

Available Resources: Data Science 101 lecture slides, course textbook

Strategic Resource Utilization: I will watch the lectures and read the textbook chapters""",
        "expected_score": "2-3/4 (MEDIUM)",
    },
    
    "high_quality": {
        "description": "Specific, detailed, and strategic",
        "submission": """Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum

Available Resources: Data Science 101 Module 2 lecture slides "EDA Fundamentals", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial "DataFrame Basics"

Strategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises""",
        "expected_score": "4/4 (HIGH)",
    },
    
    "stem_engineering": {
        "description": "Engineering mechanics example",
        "submission": """Course/Learning Task: Understand static equilibrium and free body diagrams for analyzing forces in structures from Statics & Mechanics course

Available Resources: Engineering Mechanics textbook Chapter 3-4, Professor Lee's recorded lectures on equilibrium

Strategic Resource Utilization: I will read the chapters and watch videos""",
        "expected_score": "1-2/4 (MEDIUM)",
    },
    
    "stem_chemistry": {
        "description": "Chemistry example with good detail",
        "submission": """Course/Learning Task: Master stoichiometry calculations including mole conversions, limiting reactant identification, and percent yield from General Chemistry I

Available Resources: Chemistry textbook "Zumdahl Chemistry" Chapter 3, Khan Academy stoichiometry module, course problem set worksheets

Strategic Resource Utilization: Review textbook Chapter 3 to understand mole concept and conversion factors, then practice with Khan Academy interactive problems for mole-to-mole calculations. Complete course worksheets focusing on limiting reactant problems, using worked examples from both textbook and videos to check my solution methods""",
        "expected_score": "3-4/4 (MEDIUM-HIGH)",
    }
}


async def test_tone_difference(example_name: str, student_submission: str):
    """
    Test warm vs direct tone for the same student submission.
    
    Returns both feedback versions for comparison.
    """
    print(f"\n{'='*80}")
    print(f"Testing: {example_name}")
    print(f"{'='*80}\n")
    print(f"Student Submission:\n{student_submission}\n")
    
    results = {}
    
    for style in ["warm", "direct"]:
        print(f"\n--- Generating {style.upper()} feedback ---")
        
        # Get the prompt with specified style
        system_prompt = get_prompt("phase2_learning_objectives", style=style)
        
        try:
            response = await call_claude(
                system_prompt=system_prompt,
                user_message=student_submission,
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
    output.append("# Tone Comparison: Warm vs Direct Feedback\n")
    output.append("*Generated using Claude 4.5 Sonnet with SoLBot Phase 2 Prompts*\n\n")
    output.append("This document demonstrates how the same evaluation and scaffolding level ")
    output.append("can be communicated in different tones while maintaining pedagogical effectiveness.\n\n")
    output.append("---\n\n")
    
    for example_name, example_data in STUDENT_EXAMPLES.items():
        output.append(f"## Example: {example_name.replace('_', ' ').title()}\n\n")
        output.append(f"**Description**: {example_data['description']}\n\n")
        output.append(f"**Expected Score**: {example_data['expected_score']}\n\n")
        output.append(f"**Student Submission**:\n```\n{example_data['submission']}\n```\n\n")
        
        results = await test_tone_difference(example_name, example_data['submission'])
        
        output.append("### 🌟 WARM Feedback\n\n")
        output.append(f"```\n{results.get('warm', 'N/A')}\n```\n\n")
        
        output.append("### 📋 DIRECT Feedback\n\n")
        output.append(f"```\n{results.get('direct', 'N/A')}\n```\n\n")
        
        output.append("### 🔍 Key Differences\n\n")
        output.append("*To be analyzed during lab meeting*\n\n")
        output.append("---\n\n")
    
    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), "..", "tone_comparison_examples.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(''.join(output))
    
    print(f"\n\n{'='*80}")
    print(f"Comparison document generated: {output_path}")
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
