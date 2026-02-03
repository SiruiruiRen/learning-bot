#!/usr/bin/env python3
"""Generate final concise examples for lab meeting."""

import asyncio
from anthropic import AsyncAnthropic
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prompt_engineering.scripts.final_prompts import get_prompt

API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-5-20250929"

if not API_KEY:
    print("Set ANTHROPIC_API_KEY")
    sys.exit(1)

client = AsyncAnthropic(api_key=API_KEY)

EXAMPLES = {
    "low_math": """Course/Learning Task: Get better at calculus

Available Resources: Math book and YouTube

Strategic Resource Utilization: Watch videos when confused""",
    
    "high_data_science": """Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum

Available Resources: Data Science 101 Module 2 lecture slides "EDA Fundamentals", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial "DataFrame Basics"

Strategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises"""
}


async def get_feedback(submission: str, style: str):
    """Get feedback."""
    prompt = get_prompt("phase2_learning_objectives", style=style)
    
    response = await client.messages.create(
        model=MODEL,
        max_tokens=500,
        temperature=0.1,
        system=prompt,
        messages=[{"role": "user", "content": submission}]
    )
    
    content = "".join(block.text for block in response.content if block.type == "text")
    return content


async def main():
    output = []
    
    for name, submission in EXAMPLES.items():
        quality = "LOW (0/4)" if "low" in name else "HIGH (4/4)"
        print(f"\nGenerating: {name} - {quality}")
        
        output.append(f"## {name.replace('_', ' ').title()} - {quality}\n\n")
        output.append(f"**Submission**:\n```\n{submission}\n```\n\n")
        
        for style in ["warm", "direct"]:
            print(f"  → {style}...")
            feedback = await get_feedback(submission, style)
            word_count = len(feedback.split())
            
            output.append(f"### {style.upper()} ({word_count} words)\n\n")
            output.append(f"{feedback}\n\n")
            output.append("---\n\n")
    
    # Write
    with open("docs/FINAL_LAB_EXAMPLES.md", 'w') as f:
        f.write(''.join(output))
    
    print("\n✅ Generated: docs/FINAL_LAB_EXAMPLES.md")


if __name__ == "__main__":
    asyncio.run(main())
