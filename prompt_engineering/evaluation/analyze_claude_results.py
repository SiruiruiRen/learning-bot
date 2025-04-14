#!/usr/bin/env python3
"""
SoLBot Prompt Engineering - Claude Test Results Analysis

This script analyzes the Claude 3.5 test results from claude_test_results.xlsx,
generating visualizations and statistics on Claude's performance across different
phases and quality levels.
"""

import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Any, Tuple
import json
import ast
import re
import sys
import html
from collections import defaultdict, Counter
from pathlib import Path
import datetime

# Set style for visualizations
plt.style.use('ggplot')
sns.set_theme(style="whitegrid")

# Create output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'results')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def load_data(file_path: str = '/Users/sirui/Desktop/mybot/claude_test_results.xlsx') -> pd.DataFrame:
    """Load test results from Excel file."""
    print(f"Loading data from {file_path}...")
    
    # Load the Excel file
    df = pd.read_excel(file_path, sheet_name='All Results')
    
    # Convert string representations of dictionaries to actual dictionaries
    try:
        df['metadata'] = df['metadata'].apply(ast.literal_eval)
        df['core_components'] = df['core_components'].apply(ast.literal_eval)
    except:
        print("Warning: Could not convert metadata or core_components to dictionaries. Trying another method...")
        # Alternative method using regex if ast.literal_eval fails
        def parse_dict_string(s):
            if isinstance(s, dict):
                return s
            try:
                return json.loads(s.replace("'", "\""))
            except:
                return {"error": "Could not parse"}
        
        df['metadata'] = df['metadata'].apply(parse_dict_string)
        df['core_components'] = df['core_components'].apply(parse_dict_string)
    
    return df

def extract_scores(df: pd.DataFrame) -> pd.DataFrame:
    """Extract scores and create a clean dataframe for analysis."""
    # Create a new dataframe with extracted scores
    data = []
    
    for _, row in df.iterrows():
        phase = row['phase']
        level = row['response_level']
        
        # Extract overall score
        score = row['core_components'].get('Score', 'N/A')
        try:
            score = float(score)
        except:
            score = np.nan
            
        # Extract scaffolding level
        scaffolding = row['core_components'].get('Scaffolding', 'N/A')
        
        # Extract phase-specific criteria
        criteria_scores = {}
        for key, value in row['core_components'].items():
            if key not in ['Score', 'Scaffolding']:
                try:
                    criteria_scores[key] = float(value)
                except:
                    criteria_scores[key] = np.nan
        
        # Add to data
        data_row = {
            'phase': phase,
            'level': level,
            'score': score,
            'scaffolding': scaffolding,
            **criteria_scores
        }
        data.append(data_row)
    
    return pd.DataFrame(data)

def analyze_score_distribution(df: pd.DataFrame) -> None:
    """Analyze and visualize score distribution by phase and level."""
    print("Analyzing score distribution...")
    
    # Create overall score distribution plot
    plt.figure(figsize=(12, 8))
    sns.boxplot(x='phase', y='score', hue='level', data=df)
    plt.title('Score Distribution by Phase and Level')
    plt.xlabel('Phase')
    plt.ylabel('Score')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'score_distribution.png'))
    plt.close()
    
    # Create individual plots for each phase
    for phase in df['phase'].unique():
        phase_df = df[df['phase'] == phase]
        
        plt.figure(figsize=(10, 6))
        sns.boxplot(x='level', y='score', data=phase_df)
        plt.title(f'Score Distribution for {phase}')
        plt.xlabel('Response Quality Level')
        plt.ylabel('Score')
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, f'score_distribution_{phase}.png'))
        plt.close()
        
    # Create a heatmap of average scores by phase and level
    pivot_df = df.pivot_table(values='score', index='phase', columns='level', aggfunc='mean')
    plt.figure(figsize=(10, 8))
    sns.heatmap(pivot_df, annot=True, cmap='YlGnBu', fmt='.2f', cbar_kws={'label': 'Average Score'})
    plt.title('Average Scores by Phase and Level')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'score_heatmap.png'))
    plt.close()

def analyze_scaffolding(df: pd.DataFrame) -> None:
    """Analyze scaffolding levels assigned by Claude."""
    print("Analyzing scaffolding distribution...")
    
    # Map expected scaffolding based on score range
    def expected_scaffolding(score):
        if pd.isna(score):
            return 'unknown'
        elif score < 1.6:
            return 'high'
        elif score < 2.2:
            return 'medium'
        else:
            return 'low'
    
    # Add expected scaffolding column based on score
    df['expected_scaffolding'] = df['score'].apply(expected_scaffolding)
    
    # Add expected scaffolding based on input quality level (inverse relationship)
    def expected_scaffolding_by_level(level):
        if level == 'low':
            return 'high'
        elif level == 'medium':
            return 'medium'
        elif level == 'high':
            return 'low'
        else:
            return 'unknown'
    
    df['expected_scaffolding_by_level'] = df['level'].apply(expected_scaffolding_by_level)
    
    # Calculate scaffolding accuracy based on score
    df['scaffolding_match'] = df['scaffolding'] == df['expected_scaffolding']
    
    # Calculate scaffolding accuracy based on input level
    df['scaffolding_level_match'] = df['scaffolding'] == df['expected_scaffolding_by_level']
    
    # Create scaffolding accuracy plot by phase (based on score)
    accuracy_by_phase = df.groupby('phase')['scaffolding_match'].mean()
    
    plt.figure(figsize=(10, 6))
    accuracy_by_phase.plot(kind='bar')
    plt.title('Scaffolding Accuracy by Phase (Based on Score)')
    plt.xlabel('Phase')
    plt.ylabel('Accuracy')
    plt.ylim(0, 1)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'scaffolding_accuracy.png'))
    plt.close()
    
    # Create scaffolding accuracy plot by phase (based on input level)
    level_accuracy_by_phase = df.groupby('phase')['scaffolding_level_match'].mean()
    
    plt.figure(figsize=(10, 6))
    level_accuracy_by_phase.plot(kind='bar')
    plt.title('Scaffolding Alignment with Input Level by Phase')
    plt.xlabel('Phase')
    plt.ylabel('Alignment Accuracy')
    plt.ylim(0, 1)
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'scaffolding_level_alignment.png'))
    plt.close()
    
    # Create level-scaffolding alignment matrix
    level_scaffolding_matrix = pd.crosstab(df['level'], df['scaffolding'])
    
    plt.figure(figsize=(10, 8))
    sns.heatmap(level_scaffolding_matrix, annot=True, cmap='YlGnBu', fmt='d')
    plt.title('Input Level vs. Assigned Scaffolding')
    plt.xlabel('Assigned Scaffolding')
    plt.ylabel('Input Level')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'level_scaffolding_matrix.png'))
    plt.close()
    
    # Create scaffolding correctness by phase and level (based on score)
    plt.figure(figsize=(12, 8))
    accuracy_by_phase_level = df.groupby(['phase', 'level'])['scaffolding_match'].mean().reset_index()
    sns.barplot(x='phase', y='scaffolding_match', hue='level', data=accuracy_by_phase_level)
    plt.title('Scaffolding Correctness by Phase and Level (Based on Score)')
    plt.xlabel('Phase')
    plt.ylabel('Correctness Rate')
    plt.ylim(0, 1)
    plt.xticks(rotation=45)
    plt.legend(title='Response Level')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'scaffolding_correctness.png'))
    plt.close()
    
    # Create scaffolding alignment by phase and level (based on input level)
    plt.figure(figsize=(12, 8))
    level_alignment_by_phase = df.groupby(['phase', 'level'])['scaffolding_level_match'].mean().reset_index()
    sns.barplot(x='phase', y='scaffolding_level_match', hue='level', data=level_alignment_by_phase)
    plt.title('Scaffolding Alignment with Input Level by Phase')
    plt.xlabel('Phase')
    plt.ylabel('Alignment Rate')
    plt.ylim(0, 1)
    plt.xticks(rotation=45)
    plt.legend(title='Response Level')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'scaffolding_level_alignment_by_phase.png'))
    plt.close()
    
    # Create confusion matrix for scaffolding levels based on score
    scaffolding_matrix = pd.crosstab(df['expected_scaffolding'], df['scaffolding'])
    plt.figure(figsize=(10, 8))
    sns.heatmap(scaffolding_matrix, annot=True, cmap='Blues', fmt='d')
    plt.title('Scaffolding Level Confusion Matrix (Based on Score)')
    plt.xlabel('Assigned Scaffolding')
    plt.ylabel('Expected Scaffolding (by Score)')
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'scaffolding_confusion.png'))
    plt.close()
    
    # Create phase-specific scaffolding distribution
    for phase in df['phase'].unique():
        phase_df = df[df['phase'] == phase]
        
        plt.figure(figsize=(10, 6))
        sns.countplot(x='level', hue='scaffolding', data=phase_df)
        plt.title(f'Scaffolding Distribution for {phase}')
        plt.xlabel('Response Quality Level')
        plt.ylabel('Count')
        plt.tight_layout()
        plt.savefig(os.path.join(OUTPUT_DIR, f'scaffolding_{phase}.png'))
        plt.close()

def analyze_criteria_scores(df: pd.DataFrame) -> None:
    """Analyze phase-specific criteria scores."""
    print("Analyzing criteria scores...")
    
    # Get all phase-specific criteria columns
    # Exclude expected_scaffolding_by_level and scaffolding_level_match which were added during analysis
    criteria_columns = [col for col in df.columns if col not in 
                       ['phase', 'level', 'score', 'scaffolding', 
                        'expected_scaffolding', 'scaffolding_match',
                        'expected_scaffolding_by_level', 'scaffolding_level_match']]
    
    # Create criteria score plots for each phase
    for phase in df['phase'].unique():
        phase_df = df[df['phase'] == phase]
        
        # Find criteria columns for this phase that contain numeric values
        phase_criteria = []
        for col in criteria_columns:
            if col in phase_df.columns:
                # Check if column contains numeric data
                try:
                    # Try converting to numeric and check if any non-NaN values exist
                    numeric_values = pd.to_numeric(phase_df[col], errors='coerce')
                    if not numeric_values.isna().all():
                        phase_criteria.append(col)
                except:
                    continue
        
        if not phase_criteria:
            print(f"No numeric criteria found for {phase}, skipping criteria analysis")
            continue
            
        # Create a boxplot for each criterion
        for criterion in phase_criteria:
            plt.figure(figsize=(10, 6))
            try:
                # Ensure values are numeric
                phase_df[criterion] = pd.to_numeric(phase_df[criterion], errors='coerce')
                sns.boxplot(x='level', y=criterion, data=phase_df)
                plt.title(f'{criterion} Scores for {phase}')
                plt.xlabel('Response Quality Level')
                plt.ylabel(f'{criterion} Score')
                plt.tight_layout()
                plt.savefig(os.path.join(OUTPUT_DIR, f'{criterion}_{phase}.png'))
                plt.close()
            except Exception as e:
                print(f"Error creating boxplot for {criterion} in {phase}: {e}")
                plt.close()
                continue
        
        # Create a radar chart comparing average criteria scores by level
        try:
            criteria_avg = pd.DataFrame()
            
            for level in ['low', 'medium', 'high']:
                level_df = phase_df[phase_df['level'] == level]
                if len(level_df) == 0:
                    continue
                
                # Make sure to use only numeric values
                numeric_data = level_df[phase_criteria].apply(pd.to_numeric, errors='coerce')
                criteria_avg[level] = numeric_data.mean()
            
            if criteria_avg.empty:
                print(f"No data for radar chart for {phase}, skipping")
                continue
                
            # Create radar chart
            categories = list(criteria_avg.index)
            N = len(categories)
            
            if N < 2:
                print(f"Not enough criteria for radar chart for {phase}, skipping")
                continue
                
            # Create angle for each category
            angles = [n / float(N) * 2 * np.pi for n in range(N)]
            angles += angles[:1]  # Close the loop
            
            # Create the plot
            fig, ax = plt.subplots(figsize=(10, 10), subplot_kw=dict(polar=True))
            
            # Add each level
            for level in criteria_avg.columns:
                values = criteria_avg[level].values.tolist()
                values += values[:1]  # Close the loop
                
                ax.plot(angles, values, linewidth=2, label=level)
                ax.fill(angles, values, alpha=0.1)
            
            # Add category labels
            plt.xticks(angles[:-1], categories)
            
            # Add legend
            plt.legend(loc='upper right')
            
            plt.title(f'Criteria Scores for {phase}')
            plt.tight_layout()
            plt.savefig(os.path.join(OUTPUT_DIR, f'radar_{phase}.png'))
            plt.close()
        except Exception as e:
            print(f"Error creating radar chart for {phase}: {e}")
            plt.close()

def analyze_score_consistency(df):
    """Analyze how consistently Claude scores responses of different quality levels."""
    # Calculate the difference between average scores of high and low quality responses
    if 'level' not in df.columns:
        return 0.5  # Default if no level info
    
    level_scores = df.groupby('level')['score'].mean()
    
    if 'high' in level_scores and 'low' in level_scores:
        # Score range from low to high quality
        score_range = level_scores['high'] - level_scores['low']
        # Normalize to a 0-1 scale (assuming max range would be 2.0)
        consistency = min(1.0, score_range / 2.0)
        return consistency
    else:
        return 0.5  # Default if missing levels

def analyze_scaffolding_distribution(df):
    """Analyze how well scaffolding aligns with response quality levels."""
    results = {}
    
    if 'level' not in df.columns or 'scaffolding' not in df.columns:
        results["level_alignment"] = "Unknown"
        return results
    
    # Expected alignment: low quality -> high scaffolding, etc.
    alignment_map = {
        'low': 'high',
        'medium': 'medium', 
        'high': 'low'
    }
    
    # Calculate alignment rate
    aligned_count = 0
    total_count = 0
    
    for level, expected_scaffolding in alignment_map.items():
        level_df = df[df['level'] == level]
        if len(level_df) > 0:
            aligned = level_df[level_df['scaffolding'] == expected_scaffolding]
            aligned_count += len(aligned)
            total_count += len(level_df)
    
    if total_count > 0:
        alignment_rate = aligned_count / total_count
    else:
        alignment_rate = 0
    
    # Create scaffolding distribution visualization
    plt.figure(figsize=(10, 6))
    
    # Create a crosstab of level vs scaffolding
    level_scaffolding = pd.crosstab(df['level'], df['scaffolding'], normalize='index')
    
    # Plot heatmap
    sns.heatmap(level_scaffolding, annot=True, cmap="YlGnBu", fmt='.2f', cbar_kws={'label': 'Percentage'})
    plt.title('Input Quality Level vs. Assigned Scaffolding')
    plt.xlabel('Assigned Scaffolding')
    plt.ylabel('Input Quality Level')
    
    # Determine alignment level based on rate
    if alignment_rate > 0.8:
        results["level_alignment"] = "Strong"
    elif alignment_rate > 0.6:
        results["level_alignment"] = "Moderate"
    else:
        results["level_alignment"] = "Weak"
    
    results["alignment_rate"] = alignment_rate
    return results

def create_summary_report(analysis_df):
    """Create an HTML summary report with visualizations and analysis."""
    print("Creating summary report...")
    
    # Create output directory if it doesn't exist
    OUTPUT_DIR = "output"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Get testing sample information
    total_samples = len(analysis_df)
    phase_counts = analysis_df.groupby("phase").size().to_dict()
    level_counts = analysis_df.groupby("level").size().to_dict()
    phase_level_counts = analysis_df.groupby(["phase", "level"]).size().reset_index(name="count")
    
    # Load raw prompts
    prompts = load_raw_prompts()
    print(f"Successfully loaded {len(prompts)} prompts.")
    
    # Score distribution by phase and level
    plt.figure(figsize=(12, 8))
    phase_order = sorted(analysis_df["phase"].unique())
    sns.boxplot(x="phase", y="score", hue="level", data=analysis_df, order=phase_order)
    plt.title("Score Distribution by Phase and Level")
    plt.xlabel("Phase")
    plt.ylabel("Score")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/score_by_phase_level.png")
    
    # Create heatmap of average scores by phase and level
    pivot_df = analysis_df.pivot_table(values='score', index='phase', columns='level', aggfunc='mean')
    plt.figure(figsize=(10, 8))
    sns.heatmap(pivot_df, annot=True, cmap='YlGnBu', fmt='.2f', cbar_kws={'label': 'Average Score'})
    plt.title('Average Scores by Phase and Level')
    plt.tight_layout()
    plt.savefig(f"{OUTPUT_DIR}/score_heatmap.png")
    
    # Scaffolding distribution analysis
    scaffolding_data = analyze_scaffolding_distribution(analysis_df)
    plt.savefig(f"{OUTPUT_DIR}/scaffolding_alignment.png")
    
    # Generate scaffolding distribution by level for each phase
    for phase in phase_order:
        phase_df = analysis_df[analysis_df["phase"] == phase]
        if len(phase_df) == 0:
            continue
            
        plt.figure(figsize=(10, 6))
        sns.countplot(x="level", hue="scaffolding", data=phase_df)
        plt.title(f"Scaffolding Distribution by Level for {phase}")
        plt.xlabel("Response Quality Level")
        plt.ylabel("Count")
        plt.tight_layout()
        plt.savefig(f"{OUTPUT_DIR}/scaffolding_dist_{phase}.png")
    
    # Generate score consistency and improvement recommendations
    score_consistency = analyze_score_consistency(analysis_df)
    score_consistency_text = "High" if score_consistency > 0.8 else "Medium" if score_consistency > 0.6 else "Low"
    
    # Get scaffolding alignment level
    level_alignment = scaffolding_data.get("level_alignment", "Unknown")
    
    # Get interpretation functions
    def get_scoring_interpretation(consistency_level):
        if consistency_level == "High":
            return "Claude demonstrates consistent performance across different response quality levels."
        elif consistency_level == "Medium":
            return "Claude shows somewhat variable performance across different quality levels."
        else:
            return "Claude exhibits significant variability in scoring across different quality levels."
    
    def get_scaffolding_interpretation(alignment_level):
        if alignment_level == "Strong":
            return "Claude demonstrates excellent understanding of pedagogical scaffolding principles, providing appropriate support levels based on student needs."
        elif alignment_level == "Moderate":
            return "Claude shows good alignment of scaffolding with student needs, though there is some room for improvement in certain phases or response levels."
        else:
            return "Claude shows moderate alignment between scaffolding and student needs. Further prompt refinement is recommended to improve pedagogical effectiveness."
    
    def get_scaffolding_recommendations(alignment_level):
        if alignment_level == "Strong":
            return "Continue with current scaffolding approach. Consider introducing more challenging examples."
        elif alignment_level == "Moderate":
            return "Refine scaffolding to better differentiate between quality levels. Focus on clearer distinctions between medium and high quality examples."
        else:
            return "Restructure scaffolding approach to create clearer quality distinctions. Consider revising evaluation criteria for better alignment with quality levels."
    
    def get_scoring_recommendations(consistency_level):
        if consistency_level == "High":
            return "Maintain current scoring approach. Consider adding more nuanced criteria to further distinguish quality levels."
        elif consistency_level == "Medium":
            return "Review scoring criteria for ambiguities. Provide more explicit examples for scorers to improve consistency."
        else:
            return "Revise scoring methodology to reduce variability. Implement calibration sessions for scorers and develop more objective rubrics."
    
    # Format sample information
    sample_table_rows = ""
    for _, row in phase_level_counts.iterrows():
        sample_table_rows += f"""
        <tr>
            <td>{row['phase']}</td>
            <td>{row['level']}</td>
            <td>{row['count']}</td>
        </tr>
        """
    
    # Format phase level scaffolding distribution
    scaffolding_distribution_html = ""
    for phase in phase_order:
        scaffolding_distribution_html += f"""
        <div class="visualization">
            <h3>{phase}</h3>
            <img src="scaffolding_dist_{phase}.png" alt="Scaffolding Distribution for {phase}">
        </div>
        """
    
    # Format prompts section
    prompts_html = ""
    for phase, prompt in prompts.items():
        prompts_html += f"""
        <h3>{phase}</h3>
        <div class="prompt-container">{prompt}</div>
        """
    
    # Create HTML content with all the data
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Claude 3.5 Performance Analysis</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1, h2, h3 {{
                color: #2c3e50;
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 1px solid #eee;
            }}
            .section {{
                margin-bottom: 40px;
            }}
            .visualization {{
                margin: 20px 0;
                text-align: center;
            }}
            .visualization img {{
                max-width: 100%;
                border: 1px solid #eee;
                border-radius: 5px;
            }}
            .finding {{
                background-color: #f8f9fa;
                border-left: 4px solid #3498db;
                padding: 15px;
                margin-bottom: 15px;
            }}
            .recommendation {{
                background-color: #f8f9fa;
                border-left: 4px solid #2ecc71;
                padding: 15px;
                margin-bottom: 15px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }}
            th, td {{
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #ddd;
            }}
            th {{
                background-color: #f2f2f2;
            }}
            .prompt-container {{
                background-color: #f8f9fa;
                border: 1px solid #ddd;
                border-radius: 5px;
                padding: 15px;
                margin: 10px 0;
                white-space: pre-wrap;
                font-family: monospace;
                font-size: 14px;
            }}
            .model-info {{
                display: flex;
                justify-content: space-between;
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Claude 3.5 Performance Analysis</h1>
            <div class="model-info">
                <p><strong>Model:</strong> claude-3-5-sonnet-20241022</p>
                <p><strong>Analysis Date:</strong> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Testing Sample Description</h2>
            <p>This analysis is based on a total of <strong>{total_samples}</strong> test samples across different phases and quality levels.</p>
            
            <table>
                <tr>
                    <th>Phase</th>
                    <th>Quality Level</th>
                    <th>Sample Count</th>
                </tr>
                {sample_table_rows}
            </table>
        </div>
        
        <div class="section">
            <h2>Score Distribution Analysis</h2>
            <p>This visualization shows the distribution of scores assigned by Claude for each phase and quality level:</p>
            <div class="visualization">
                <img src="score_by_phase_level.png" alt="Score Distribution by Phase and Level">
            </div>
            
            <div class="visualization">
                <img src="score_heatmap.png" alt="Score Heatmap by Phase and Level">
            </div>
            
            <div class="finding">
                <p><strong>Score Consistency:</strong> {score_consistency_text} ({score_consistency:.2f})</p>
                <p>{get_scoring_interpretation(score_consistency_text)}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Scaffolding Distribution Analysis</h2>
            <p>These visualizations show how scaffolding levels are distributed across different quality levels for each phase:</p>
            
            {scaffolding_distribution_html}
            
            <div class="visualization">
                <img src="scaffolding_alignment.png" alt="Scaffolding Alignment">
            </div>
            
            <div class="finding">
                <p><strong>Scaffolding Alignment:</strong> {level_alignment}</p>
                <p>{get_scaffolding_interpretation(level_alignment)}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Recommendations</h2>
            <div class="recommendation">
                <h3>For Scoring Consistency</h3>
                <p>{get_scoring_recommendations(score_consistency_text)}</p>
            </div>
            
            <div class="recommendation">
                <h3>For Scaffolding Alignment</h3>
                <p>{get_scaffolding_recommendations(level_alignment)}</p>
            </div>
        </div>
        
        <div class="section">
            <h2>Appendix: Prompts Used</h2>
            {prompts_html}
        </div>
    </body>
    </html>
    """
    
    # Write to file
    with open(os.path.join(OUTPUT_DIR, 'summary_report.html'), 'w') as f:
        f.write(html_content)

def create_markdown_report(analysis_df):
    """Create a markdown summary report with visualizations and analysis."""
    print("Creating markdown report...")
    
    # Create output directory if it doesn't exist
    OUTPUT_DIR = "output"
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Load raw prompts
    prompts = load_raw_prompts()
    
    # Get testing sample information
    total_samples = len(analysis_df)
    phase_level_counts = analysis_df.groupby(["phase", "level"]).size().reset_index(name="count")
    
    # Generate score consistency and improvement recommendations
    score_consistency = analyze_score_consistency(analysis_df)
    score_consistency_text = "High" if score_consistency > 0.8 else "Medium" if score_consistency > 0.6 else "Low"
    
    # Get scaffolding alignment level
    scaffolding_data = analyze_scaffolding_distribution(analysis_df)
    level_alignment = scaffolding_data.get("level_alignment", "Unknown")
    
    # Get interpretation functions
    def get_scoring_interpretation(consistency_level):
        if consistency_level == "High":
            return "Claude demonstrates consistent performance across different response quality levels."
        elif consistency_level == "Medium":
            return "Claude shows somewhat variable performance across different quality levels."
        else:
            return "Claude exhibits significant variability in scoring across different quality levels."
    
    def get_scaffolding_interpretation(alignment_level):
        if alignment_level == "Strong":
            return "Claude demonstrates excellent understanding of pedagogical scaffolding principles, providing appropriate support levels based on student needs."
        elif alignment_level == "Moderate":
            return "Claude shows good alignment of scaffolding with student needs, though there is some room for improvement in certain phases or response levels."
        else:
            return "Claude shows moderate alignment between scaffolding and student needs. Further prompt refinement is recommended to improve pedagogical effectiveness."
    
    def get_scaffolding_recommendations(alignment_level):
        if alignment_level == "Strong":
            return "Continue with current scaffolding approach. Consider introducing more challenging examples."
        elif alignment_level == "Moderate":
            return "Refine scaffolding to better differentiate between quality levels. Focus on clearer distinctions between medium and high quality examples."
        else:
            return "Restructure scaffolding approach to create clearer quality distinctions. Consider revising evaluation criteria for better alignment with quality levels."
    
    def get_scoring_recommendations(consistency_level):
        if consistency_level == "High":
            return "Maintain current scoring approach. Consider adding more nuanced criteria to further distinguish quality levels."
        elif consistency_level == "Medium":
            return "Review scoring criteria for ambiguities. Provide more explicit examples for scorers to improve consistency."
        else:
            return "Revise scoring methodology to reduce variability. Implement calibration sessions for scorers and develop more objective rubrics."
    
    # Format sample table
    sample_table = "| Phase | Quality Level | Sample Count |\n|-------|--------------|--------------|"
    for _, row in phase_level_counts.iterrows():
        sample_table += f"\n| {row['phase']} | {row['level']} | {row['count']} |"
    
    # Format phase section
    phase_sections = ""
    phase_order = sorted(analysis_df["phase"].unique())
    for phase in phase_order:
        phase_sections += f"\n\n### {phase}\n![Scaffolding Distribution for {phase}](scaffolding_dist_{phase}.png)"
    
    # Format prompts section
    prompts_section = ""
    for phase, prompt in prompts.items():
        # Remove HTML escaping for markdown display
        if isinstance(prompt, str):
            clean_prompt = html.unescape(prompt)
            
            # Process each line properly with consistent indentation
            lines = clean_prompt.split('\n')
            processed_lines = []
            
            for line in lines:
                # Adjust heading levels but preserve empty lines and other formatting
                if line.startswith('# '):
                    processed_lines.append("#### " + line[2:])
                elif line.startswith('## '):
                    processed_lines.append("##### " + line[3:])
                else:
                    processed_lines.append(line)
            
            # Join with double newlines to ensure proper line separation in markdown
            processed_prompt = "\n\n".join(processed_lines)
            
            # Add each prompt as a proper markdown section with adequate spacing
            prompts_section += f"\n\n### {phase}\n\n```\n{processed_prompt}\n```\n\n---\n"
    
    # Create markdown content
    markdown_content = f"""# Claude 3.5 Performance Analysis

**Model:** claude-3-5-sonnet-20241022  
**Analysis Date:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Testing Sample Description

This analysis is based on a total of **{total_samples}** test samples (mock student responses) across different phases and quality levels.

{sample_table}

## Score Distribution Analysis

This visualization shows the distribution of scores assigned by Claude for each phase and quality level:

![Score Distribution by Phase and Level](score_by_phase_level.png)

![Score Heatmap by Phase and Level](score_heatmap.png)

### Key Finding: Score Consistency

**Score Consistency:** {score_consistency_text} ({score_consistency:.2f})

{get_scoring_interpretation(score_consistency_text)}

## Scaffolding Distribution Analysis

These visualizations show how scaffolding levels are distributed across different quality levels for each phase:{phase_sections}

![Scaffolding Alignment](scaffolding_alignment.png)

### Key Finding: Scaffolding Alignment

**Scaffolding Alignment:** {level_alignment}

{get_scaffolding_interpretation(level_alignment)}

## Recommendations

### For Scoring Consistency

{get_scoring_recommendations(score_consistency_text)}

### For Scaffolding Alignment

{get_scaffolding_recommendations(level_alignment)}

## Appendix: Prompts Used

The following prompts were used to guide Claude in evaluating student responses for each phase:{prompts_section}
"""
    
    # Write to file
    with open(os.path.join(OUTPUT_DIR, 'analysis_report.md'), 'w') as f:
        f.write(markdown_content)
    
    print(f"Markdown report saved to {os.path.join(OUTPUT_DIR, 'analysis_report.md')}")

def load_raw_prompts():
    """Load raw prompts from the final_prompts.py file."""
    print("Loading raw prompts...")
    
    try:
        # Try to import the FINAL_PROMPTS dictionary
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))
        from prompt_engineering.scripts.final_prompts import FINAL_PROMPTS
        
        # Escape HTML characters in prompts
        escaped_prompts = {}
        for phase, prompt in FINAL_PROMPTS.items():
            escaped_prompts[phase] = html.escape(prompt)
        
        print(f"Successfully loaded {len(escaped_prompts)} prompts.")
        return escaped_prompts
    except ImportError as e:
        print(f"ImportError: {e} - Could not import FINAL_PROMPTS.")
        print(f"Current sys.path: {sys.path}")
        # Try alternative path
        try:
            sys.path.append('/Users/sirui/Desktop/mybot')
            from prompt_engineering.scripts.final_prompts import FINAL_PROMPTS
            
            escaped_prompts = {}
            for phase, prompt in FINAL_PROMPTS.items():
                escaped_prompts[phase] = html.escape(prompt)
            
            print(f"Successfully loaded {len(escaped_prompts)} prompts with alternative path.")
            return escaped_prompts
        except Exception as e2:
            print(f"Alternative import also failed: {e2}")
    except Exception as e:
        print(f"Error loading prompts: {e}")
    
    print("Using placeholder prompts instead.")
    return {
        "phase2_learning_objectives": "Prompt not available. Please check the file prompt_engineering/scripts/final_prompts.py",
        "phase4_long_term_goals": "Prompt not available. Please check the file prompt_engineering/scripts/final_prompts.py",
        "phase4_short_term_goals": "Prompt not available. Please check the file prompt_engineering/scripts/final_prompts.py",
        "phase4_contingency_strategies": "Prompt not available. Please check the file prompt_engineering/scripts/final_prompts.py",
        "phase5_monitoring_adaptation": "Prompt not available. Please check the file prompt_engineering/scripts/final_prompts.py"
    }

def export_processed_data(df: pd.DataFrame) -> None:
    """Export the processed data for further analysis."""
    print("Exporting processed data...")
    
    # Export to Excel
    df.to_excel(os.path.join(OUTPUT_DIR, 'processed_results.xlsx'), index=False)
    
    # Export to CSV
    df.to_csv(os.path.join(OUTPUT_DIR, 'processed_results.csv'), index=False)

def main():
    """Main function to run the analysis."""
    print("Starting Claude 3.5 test results analysis...")
    
    # Load data
    df = load_data()
    
    # Extract scores
    analysis_df = extract_scores(df)
    
    # Run analyses
    analyze_score_distribution(analysis_df)
    analyze_scaffolding(analysis_df)
    analyze_criteria_scores(analysis_df)
    
    # Create summary reports
    create_summary_report(analysis_df)
    create_markdown_report(analysis_df)
    
    # Export processed data
    export_processed_data(analysis_df)
    
    print(f"Analysis complete! Results saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    main() 