#!/usr/bin/env python3
"""
SoLBot Prompt Engineering - Claude 3.5 Test

This script tests the final prompts from final_prompts.py with mock responses from mock.py.
It sends prompts with mock responses to Claude 3.5 and records the results in an Excel file.
"""

import os
import sys
import json
import re
import random
import pandas as pd
from typing import Dict, List, Any, Tuple
import time
import anthropic
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from prompt_engineering.scripts.final_prompts import FINAL_PROMPTS
from prompt_engineering.mock import MOCK_RESPONSES

# Claude API configuration
CLAUDE_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not CLAUDE_API_KEY:
    raise ValueError("ANTHROPIC_API_KEY environment variable not set")

CLAUDE_CLIENT = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"  # As specified in the requirements

# Metadata extraction regex pattern
METADATA_PATTERN = r'<!-- INSTRUCTOR_METADATA\n(.*?)\n-->'

def extract_metadata(response: str) -> Dict[str, Any]:
    """Extract metadata from Claude's response."""
    match = re.search(METADATA_PATTERN, response, re.DOTALL)
    if not match:
        return {"error": "No metadata found in response"}
    
    metadata_text = match.group(1)
    metadata = {}
    
    # Parse metadata key-value pairs
    for line in metadata_text.split('\n'):
        if ':' in line:
            key, value = line.split(':', 1)
            metadata[key.strip()] = value.strip()
    
    return metadata

def extract_core_components(metadata: Dict[str, Any], phase: str) -> Dict[str, Any]:
    """Extract core components from metadata based on the phase."""
    core = {"Score": metadata.get("Score", "N/A"), "Scaffolding": metadata.get("Scaffolding", "N/A")}
    
    # Extract phase-specific criteria
    if phase == "phase2_learning_objectives":
        core["Task_Identification"] = metadata.get("Task_Identification", "N/A")
        core["Resource_Specificity"] = metadata.get("Resource_Specificity", "N/A")
    
    elif phase == "phase4_long_term_goals":
        core["Goal_Clarity"] = metadata.get("Goal_Clarity", "N/A")
        core["Goal_Orientation"] = metadata.get("Goal_Orientation", "N/A")
        core["Visualization"] = metadata.get("Visualization", "N/A")
    
    elif phase == "phase4_short_term_goals":
        core["Specific_Goal"] = metadata.get("Specific_Goal", "N/A")
        core["Action_Plan"] = metadata.get("Action_Plan", "N/A")
        core["Timeline"] = metadata.get("Timeline", "N/A")
    
    elif phase == "phase4_contingency_strategies":
        core["If_Then_Structure"] = metadata.get("If_Then_Structure", "N/A")
        core["Response_Specificity"] = metadata.get("Response_Specificity", "N/A")
        core["Feasibility"] = metadata.get("Feasibility", "N/A")
    
    elif phase == "phase5_monitoring_adaptation":
        core["Monitoring_Strategy"] = metadata.get("Monitoring_Strategy", "N/A")
        core["Adaptation_Triggers"] = metadata.get("Adaptation_Triggers", "N/A")
        core["Alternative_Strategies"] = metadata.get("Alternative_Strategies", "N/A")
    
    return core

def send_to_claude(prompt: str, mock_response: str) -> str:
    """Send prompt with mock response to Claude 3.5 and return the response."""
    full_prompt = f"{prompt}\n\nStudent response: {mock_response}"
    
    try:
        response = CLAUDE_CLIENT.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4000,
            temperature=0,
            system="You are an educational AI assistant helping students develop effective learning strategies.",
            messages=[{"role": "user", "content": full_prompt}]
        )
        return response.content[0].text
    except Exception as e:
        print(f"Error calling Claude API: {e}")
        return f"API Error: {e}"

def test_prompts() -> pd.DataFrame:
    """Test all prompts with mock responses and return results as a DataFrame."""
    results = []
    
    # Define phases to test
    phases = [
        "phase2_learning_objectives",
        "phase4_long_term_goals", 
        "phase4_short_term_goals",
        "phase4_contingency_strategies",
        "phase5_monitoring_adaptation"
    ]
    
    # Test each phase with mock responses
    for phase in phases:
        print(f"Testing {phase}...")
        
        if phase not in FINAL_PROMPTS or phase not in MOCK_RESPONSES:
            print(f"Skipping {phase} - not found in prompts or mock responses")
            continue
        
        prompt = FINAL_PROMPTS[phase]
        
        for level in ["low", "medium", "high"]:
            # Get mock responses for this level
            responses = MOCK_RESPONSES[phase][level]
            
            # Test with each mock response
            for i, response in enumerate(responses):
                print(f"  Testing {level} response {i+1}...")
                
                # Send to Claude
                claude_response = send_to_claude(prompt, response)
                
                # Extract metadata
                metadata = extract_metadata(claude_response)
                core_components = extract_core_components(metadata, phase)
                
                # Add to results
                results.append({
                    "phase": phase,
                    "response_level": level,
                    "response_text": response,
                    "claude_response": claude_response,
                    "metadata": metadata,
                    "core_components": core_components
                })
                
                # Add a delay to avoid rate limits
                time.sleep(3)  # Increased from 1 to 3 seconds to handle more requests
    
    # Convert results to DataFrame
    df = pd.DataFrame(results)
    return df

def save_to_excel(df: pd.DataFrame, output_path: str = "claude_test_results.xlsx"):
    """Save test results to Excel file."""
    with pd.ExcelWriter(output_path, engine='xlsxwriter') as writer:
        # Save all data to main sheet
        df.to_excel(writer, sheet_name='All Results', index=False)
        
        # Create separate sheets for each phase
        for phase in df['phase'].unique():
            phase_df = df[df['phase'] == phase]
            phase_df.to_excel(writer, sheet_name=phase[:31], index=False)  # Excel limits sheet names to 31 chars
        
        # Create summary sheet
        summary_data = []
        for phase in df['phase'].unique():
            phase_df = df[df['phase'] == phase]
            for level in ['low', 'medium', 'high']:
                level_df = phase_df[phase_df['response_level'] == level]
                if not level_df.empty:
                    avg_score = pd.to_numeric(level_df['core_components'].apply(lambda x: x.get('Score', 'N/A')), errors='coerce').mean()
                    summary_data.append({
                        'Phase': phase,
                        'Level': level,
                        'Count': len(level_df),
                        'Avg Score': avg_score,
                    })
        
        summary_df = pd.DataFrame(summary_data)
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        print(f"Results saved to {output_path}")

def main():
    """Main function to run the test."""
    print("Starting Claude 3.5 prompt testing...")
    
    # Test prompts and get results
    results_df = test_prompts()
    
    # Save results to Excel
    save_to_excel(results_df)
    
    print("Testing complete!")

if __name__ == "__main__":
    main() 