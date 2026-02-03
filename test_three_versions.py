#!/usr/bin/env python3
"""Test three versions: Warm, Warm-De Sixte, Direct"""

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

# Test LOW quality (most important for attributional support)
LOW_SUBMISSION = """Course/Learning Task: Get better at calculus

Available Resources: Math book and YouTube

Strategic Resource Utilization: Watch videos when confused"""


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
    word_count = len(content.split())
    
    return content, word_count


async def main():
    print("Comparing THREE versions on LOW quality submission\n")
    print("="*70)
    
    output = []
    output.append("# Three-Version Tone Comparison (LOW Quality Example)\n\n")
    output.append("**Submission**:\n```\n" + LOW_SUBMISSION + "\n```\n\n")
    output.append("**Settings**: Temperature 0.1, Max Tokens 500\n\n")
    output.append("---\n\n")
    
    versions = [
        ("warm", "🌟 Warm (Original)"),
        ("warm_de_sixte", "🧠 Warm with De Sixte Framework"),
        ("direct", "📋 Direct")
    ]
    
    for style_key, style_name in versions:
        print(f"\nGenerating {style_name}...")
        feedback, word_count = await get_feedback(LOW_SUBMISSION, style_key)
        
        print(f"  Words: {word_count}")
        
        output.append(f"## {style_name} ({word_count} words)\n\n")
        output.append(f"{feedback}\n\n")
        output.append("---\n\n")
    
    # Write
    with open("docs/THREE_VERSION_COMPARISON.md", 'w') as f:
        f.write(''.join(output))
    
    print(f"\n✅ Generated: docs/THREE_VERSION_COMPARISON.md\n")


if __name__ == "__main__":
    asyncio.run(main())
