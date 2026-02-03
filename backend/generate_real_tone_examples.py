#!/usr/bin/env python3
"""
Generate REAL Claude 3.5 Sonnet feedback examples for tone comparison.
This script calls the actual Claude API to demonstrate warm vs direct tones.
"""

import sys
import os
import asyncio
import json

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.utils.llm import call_claude
from prompt_engineering.scripts.final_prompts import get_prompt

# Test with 2 clear examples: one low quality, one high quality
EXAMPLES = {
    "low_math": {
        "name": "Low Quality - Math Student",
        "submission": """Course/Learning Task: Get better at calculus

Available Resources: Math book and YouTube

Strategic Resource Utilization: Watch videos when confused""",
        "expected": "LOW (0/4)",
    },
    
    "high_data_science": {
        "name": "High Quality - Data Science Student",
        "submission": """Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum

Available Resources: Data Science 101 Module 2 lecture slides "EDA Fundamentals", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial "DataFrame Basics"

Strategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises""",
        "expected": "HIGH (4/4)",
    }
}


async def generate_real_feedback(example_key: str, example_data: dict):
    """Generate real Claude feedback for warm and direct tones."""
    
    print(f"\n{'='*80}")
    print(f"{example_data['name']}")
    print(f"Expected Score: {example_data['expected']}")
    print(f"{'='*80}\n")
    
    results = {}
    
    for style in ["warm", "direct"]:
        print(f"\n🔄 Calling Claude API for {style.upper()} tone...")
        
        # Get prompt
        prompt = get_prompt("phase2_learning_objectives", style=style)
        
        try:
            response = await call_claude(
                system_prompt=prompt,
                user_message=example_data['submission'],
                chat_history=[],
                temperature=0.5,  # Standard temperature for educational feedback
                max_tokens=800
            )
            
            feedback = response.get("content", "")
            
            if "error" in response or not feedback or feedback == "I'm having trouble processing your request right now.":
                print(f"❌ API Error for {style}: {response.get('error', 'No content returned')}")
                results[style] = {
                    "feedback": None,
                    "error": response.get("error", "No content")
                }
            else:
                print(f"✅ {style.upper()} feedback generated ({len(feedback)} characters)")
                results[style] = {
                    "feedback": feedback,
                    "error": None
                }
            
        except Exception as e:
            print(f"❌ Exception for {style}: {e}")
            results[style] = {
                "feedback": None,
                "error": str(e)
            }
    
    return results


async def main():
    """Main function to generate real tone comparison."""
    
    print("\n" + "="*80)
    print("Generating REAL Claude 3.5 Sonnet Feedback")
    print("Phase 2 (Task Analysis) - Warm vs Direct Tone Comparison")
    print("Temperature: 0.5 | Max Tokens: 800")
    print("="*80)
    
    output = []
    output.append("# Real Claude 3.5 Sonnet Tone Comparison\n\n")
    output.append("**Generated**: Real API calls to Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)\n")
    output.append("**Temperature**: 0.5\n")
    output.append("**Max Tokens**: 800\n")
    output.append("**Phase**: Phase 2 - Task Analysis\n\n")
    output.append("---\n\n")
    
    # Add prompts section
    output.append("## System Prompts Used\n\n")
    output.append("### Warm Style Prompt\n\n")
    warm_prompt = get_prompt("phase2_learning_objectives", style="warm")
    output.append(f"```\n{warm_prompt}\n```\n\n")
    
    output.append("### Direct Style Prompt\n\n")
    direct_prompt = get_prompt("phase2_learning_objectives", style="direct")
    output.append(f"```\n{direct_prompt}\n```\n\n")
    
    output.append("---\n\n")
    
    # Generate feedback for each example
    for key, data in EXAMPLES.items():
        print(f"\nProcessing: {key}...")
        results = await generate_real_feedback(key, data)
        
        output.append(f"## {data['name']}\n\n")
        output.append(f"**Expected Score**: {data['expected']}\n\n")
        output.append("### Student Submission\n\n")
        output.append(f"```\n{data['submission']}\n```\n\n")
        
        # Warm feedback
        output.append("### 🌟 WARM Feedback (Real Claude Response)\n\n")
        if results['warm']['feedback']:
            output.append(f"{results['warm']['feedback']}\n\n")
        else:
            output.append(f"*Error: {results['warm']['error']}*\n\n")
        
        # Direct feedback
        output.append("### 📋 DIRECT Feedback (Real Claude Response)\n\n")
        if results['direct']['feedback']:
            output.append(f"{results['direct']['feedback']}\n\n")
        else:
            output.append(f"*Error: {results['direct']['error']}*\n\n")
        
        # Analysis section
        output.append("### 🔍 Motivational Differences\n\n")
        output.append("**Growth Mindset Elements (Warm)**:\n")
        output.append("- [To be analyzed from actual feedback]\n\n")
        output.append("**Self-Efficacy Building (Warm)**:\n")
        output.append("- [To be analyzed from actual feedback]\n\n")
        output.append("**Goal Orientation (Warm)**:\n")
        output.append("- [To be analyzed from actual feedback]\n\n")
        output.append("---\n\n")
    
    # Write output
    output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "REAL_CLAUDE_TONE_COMPARISON.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(''.join(output))
    
    print(f"\n✅ Real feedback document generated: {output_path}")
    return output_path


if __name__ == "__main__":
    asyncio.run(main())
