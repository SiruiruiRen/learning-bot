#!/usr/bin/env python3
"""
Generate comprehensive tone comparison examples across quality levels.
"""

import asyncio
from anthropic import AsyncAnthropic
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from prompt_engineering.scripts.final_prompts import get_prompt

API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-5-20250929"
TEMPERATURE = 0.1  # Best consistency
MAX_TOKENS = 800

if not API_KEY:
    print("Set ANTHROPIC_API_KEY environment variable")
    sys.exit(1)

client = AsyncAnthropic(api_key=API_KEY)

# Comprehensive STEM examples across quality levels
EXAMPLES = {
    "low_math": {
        "quality": "LOW (0/4)",
        "subject": "Mathematics - Calculus",
        "submission": """Course/Learning Task: Get better at calculus

Available Resources: Math book and YouTube

Strategic Resource Utilization: Watch videos when confused""",
    },
    
    "medium_cs": {
        "quality": "MEDIUM (2/4)",
        "subject": "Computer Science - Data Structures",
        "submission": """Course/Learning Task: Master data structures including linked lists, stacks, and queues from CS 201

Available Resources: CS 201 textbook "Introduction to Algorithms", lecture videos

Strategic Resource Utilization: I will read the textbook chapters on each data structure and watch the lecture videos""",
    },
    
    "high_data_science": {
        "quality": "HIGH (4/4)",
        "subject": "Data Science - Exploratory Data Analysis",
        "submission": """Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum

Available Resources: Data Science 101 Module 2 lecture slides "EDA Fundamentals", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial "DataFrame Basics"

Strategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises""",
    },
    
    "medium_physics": {
        "quality": "MEDIUM (2-3/4)",
        "subject": "Physics - Mechanics",
        "submission": """Course/Learning Task: Understand Newton's laws of motion and free body diagrams for Physics 101

Available Resources: Physics textbook Chapter 4, Professor Lee's lecture videos, practice problems

Strategic Resource Utilization: Read textbook chapter first, then watch videos for examples, complete practice problems""",
    }
}


async def get_feedback(submission: str, style: str):
    """Get feedback from Claude."""
    prompt = get_prompt("phase2_learning_objectives", style=style)
    
    response = await client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=prompt,
        messages=[{"role": "user", "content": submission}]
    )
    
    content = ""
    for block in response.content:
        if block.type == "text":
            content += block.text
    
    return {
        "content": content,
        "tokens": {
            "input": response.usage.input_tokens,
            "output": response.usage.output_tokens
        }
    }


async def main():
    print(f"\nGenerating Comprehensive Tone Comparison")
    print(f"Model: {MODEL}, Temperature: {TEMPERATURE}\n")
    
    output = []
    output.append("# 系统化 Tone 对比：完整示例集\n\n")
    output.append(f"**Model**: {MODEL}\n")
    output.append(f"**Temperature**: {TEMPERATURE} (optimal for consistency)\n")
    output.append(f"**Max Tokens**: {MAX_TOKENS}\n")
    output.append(f"**Date**: {asyncio.get_event_loop().time()}\n\n")
    output.append("---\n\n")
    
    # Add note about prompts
    output.append("## 📌 Note on Prompts\n\n")
    output.append("Both warm and direct use **identical evaluation rubrics and calibration examples**.\n")
    output.append("The ONLY difference is the communication style section.\n\n")
    output.append("**Warm**: Includes growth mindset, self-efficacy, goal orientation, emotional support\n")
    output.append("**Direct**: Eliminates all praise, motivation, and emotional language\n\n")
    output.append("---\n\n")
    
    for idx, (key, data) in enumerate(EXAMPLES.items(), 1):
        print(f"\n[{idx}/{len(EXAMPLES)}] Processing: {key}...")
        
        output.append(f"## Example {idx}: {data['subject']}\n\n")
        output.append(f"**Quality Level**: {data['quality']}\n\n")
        output.append(f"### Student Submission\n\n```\n{data['submission']}\n```\n\n")
        
        # Get warm feedback
        print("  → Calling API for WARM...")
        warm = await get_feedback(data['submission'], "warm")
        output.append(f"### 🌟 WARM Feedback\n\n{warm['content']}\n\n")
        output.append(f"*Tokens: {warm['tokens']['input']} input, {warm['tokens']['output']} output*\n\n")
        
        # Get direct feedback
        print("  → Calling API for DIRECT...")
        direct = await get_feedback(data['submission'], "direct")
        output.append(f"### 📋 DIRECT Feedback\n\n{direct['content']}\n\n")
        output.append(f"*Tokens: {direct['tokens']['input']} input, {direct['tokens']['output']} output*\n\n")
        
        output.append("---\n\n")
    
    # Write output
    output_path = os.path.join(os.path.dirname(__file__), "..", "docs", "SYSTEMATIC_TONE_COMPARISON.md")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(''.join(output))
    
    print(f"\n✅ Complete comparison generated: {output_path}\n")


if __name__ == "__main__":
    asyncio.run(main())
