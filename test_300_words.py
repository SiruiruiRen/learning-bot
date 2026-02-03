#!/usr/bin/env python3
"""Test that feedback stays under 300 words."""

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
    "low": "Course/Learning Task: Get better at calculus\n\nAvailable Resources: Math book and YouTube\n\nStrategic Resource Utilization: Watch videos when confused",
    "high": "Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum\n\nAvailable Resources: Data Science 101 Module 2 lecture slides \"EDA Fundamentals\", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial \"DataFrame Basics\"\n\nStrategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises"
}


async def test_word_count(name: str, submission: str, style: str):
    """Test word count."""
    prompt = get_prompt("phase2_learning_objectives", style=style)
    
    response = await client.messages.create(
        model=MODEL,
        max_tokens=500,
        temperature=0.1,
        system=prompt,
        messages=[{"role": "user", "content": submission}]
    )
    
    content = "".join(block.text for block in response.content if block.type == "text")
    word_count = len(content.split())
    
    return {
        "content": content,
        "word_count": word_count,
        "under_300": word_count <= 300
    }


async def main():
    print("Testing 300-word limit\n")
    
    for name, submission in EXAMPLES.items():
        print(f"\n{'='*60}")
        print(f"{name.upper()} Quality Example")
        print(f"{'='*60}")
        
        for style in ["warm", "direct"]:
            result = await test_word_count(name, submission, style)
            status = "✅" if result['under_300'] else "❌"
            print(f"\n{style.upper()}: {result['word_count']} words {status}")
            
            if not result['under_300']:
                print(f"  EXCEEDED by {result['word_count'] - 300} words")
    
    print("\n" + "="*60)


if __name__ == "__main__":
    asyncio.run(main())
