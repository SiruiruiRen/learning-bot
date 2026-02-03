#!/usr/bin/env python3
"""
Test scoring consistency with enhanced prompts at different temperatures.
"""

import asyncio
from anthropic import AsyncAnthropic
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from prompt_engineering.scripts.final_prompts import get_prompt

API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-5-20250929"

if not API_KEY:
    print("Set ANTHROPIC_API_KEY environment variable")
    sys.exit(1)

client = AsyncAnthropic(api_key=API_KEY)

# Test submission: High quality (should get 4/4 consistently)
TEST_SUBMISSION = """Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum

Available Resources: Data Science 101 Module 2 lecture slides "EDA Fundamentals", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial "DataFrame Basics"

Strategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises"""


async def get_feedback(style: str, temperature: float):
    """Get feedback with specified temperature."""
    prompt = get_prompt("phase2_learning_objectives", style=style)
    
    response = await client.messages.create(
        model=MODEL,
        max_tokens=800,
        temperature=temperature,
        system=prompt,
        messages=[{"role": "user", "content": TEST_SUBMISSION}]
    )
    
    content = ""
    for block in response.content:
        if block.type == "text":
            content += block.text
    
    return content


def extract_score(feedback: str):
    """Extract overall score from feedback."""
    import re
    # Try multiple patterns
    patterns = [
        r'OVERALL[:\s*]+(\d+)/4',
        r'Overall[:\s*]+(\d+)/4',
        r'overall[:\s*]+(\d+)/4',
        r'Overall_Score:\s*(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, feedback)
        if match:
            return int(match.group(1))
    
    # If no match, print feedback snippet for debugging
    print(f"    [DEBUG] Could not extract score. Feedback snippet: {feedback[:200]}")
    return None


async def test_temperature(temp: float, trials: int = 5):
    """Test consistency at given temperature."""
    print(f"\n{'='*80}")
    print(f"Testing Temperature: {temp}")
    print(f"Trials: {trials}")
    print(f"{'='*80}\n")
    
    warm_scores = []
    direct_scores = []
    
    for i in range(trials):
        print(f"Trial {i+1}/{trials}...")
        
        # Warm
        warm_feedback = await get_feedback("warm", temp)
        warm_score = extract_score(warm_feedback)
        warm_scores.append(warm_score)
        print(f"  Warm: {warm_score}/4")
        
        # Direct
        direct_feedback = await get_feedback("direct", temp)
        direct_score = extract_score(direct_feedback)
        direct_scores.append(direct_score)
        print(f"  Direct: {direct_score}/4")
        
        if i == 0:
            # Save first feedback for comparison
            with open(f"temp_{temp}_warm.txt", 'w') as f:
                f.write(warm_feedback)
            with open(f"temp_{temp}_direct.txt", 'w') as f:
                f.write(direct_feedback)
    
    # Statistics (filter None values)
    warm_valid = [s for s in warm_scores if s is not None]
    direct_valid = [s for s in direct_scores if s is not None]
    
    if not warm_valid or not direct_valid:
        print("❌ Error: Could not extract scores. Check feedback format.")
        return None
    
    warm_avg = sum(warm_valid) / len(warm_valid)
    direct_avg = sum(direct_valid) / len(direct_valid)
    
    print(f"\n📊 Results:")
    print(f"Warm scores: {warm_scores} → Avg: {warm_avg:.2f}")
    print(f"Direct scores: {direct_scores} → Avg: {direct_avg:.2f}")
    print(f"Difference: {abs(warm_avg - direct_avg):.2f}")
    print(f"Warm variance: {sum((s - warm_avg)**2 for s in warm_scores) / len(warm_scores):.2f}")
    print(f"Direct variance: {sum((s - direct_avg)**2 for s in direct_scores) / len(direct_scores):.2f}")
    
    return {
        'temp': temp,
        'warm_scores': warm_scores,
        'direct_scores': direct_scores,
        'warm_avg': warm_avg,
        'direct_avg': direct_avg,
        'diff': abs(warm_avg - direct_avg)
    }


async def main():
    print("Testing Scoring Consistency with Enhanced Prompts")
    print(f"Model: {MODEL}")
    print("Test submission: High Quality Data Science Example\n")
    
    results = []
    
    # Test different temperatures
    for temp in [0.1, 0.3]:
        result = await test_temperature(temp, trials=3)
        results.append(result)
    
    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}\n")
    
    for r in results:
        print(f"Temperature {r['temp']}:")
        print(f"  Warm avg: {r['warm_avg']:.2f}, Direct avg: {r['direct_avg']:.2f}")
        print(f"  Difference: {r['diff']:.2f}")
        print()
    
    print("Recommendation:")
    best = min(results, key=lambda x: x['diff'])
    print(f"  Use temperature {best['temp']} for best consistency (diff: {best['diff']:.2f})")


if __name__ == "__main__":
    asyncio.run(main())
