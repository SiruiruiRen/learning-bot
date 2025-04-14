import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import re
import os
from pathlib import Path
import json
from collections import Counter

def extract_score_from_metadata(text):
    """Extract score from metadata section if present."""
    if isinstance(text, str) and "INSTRUCTOR_METADATA" in text:
        match = re.search(r'Score:\s*(\d+\.\d+)', text)
        if match:
            return float(match.group(1))
    return np.nan

def extract_metadata_fields(text):
    """Extract all metadata fields from the response."""
    if not isinstance(text, str):
        return {}
    
    if "INSTRUCTOR_METADATA" not in text:
        return {}
    
    metadata = {}
    # Extract the metadata section
    match = re.search(r'INSTRUCTOR_METADATA\s*(.*?)\s*-->', text, re.DOTALL)
    if match:
        metadata_text = match.group(1)
        # Parse individual fields
        for line in metadata_text.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                # Try to convert numeric values
                try:
                    if '.' in value:
                        value = float(value)
                    else:
                        value = int(value)
                except ValueError:
                    pass
                metadata[key] = value
    
    return metadata

def load_and_clean_data(file_path):
    """Load the CSV data and clean it for analysis."""
    print(f"Loading data from {file_path}...")
    try:
        df = pd.read_csv(file_path, on_bad_lines='skip')
        print(f"Successfully loaded {len(df)} rows.")
    except Exception as e:
        print(f"Error loading CSV: {e}")
        # Try with different encoding or error handling
        df = pd.read_csv(file_path, encoding='latin1', on_bad_lines='skip')
        print(f"Loaded {len(df)} rows with alternative approach.")
    
    # Extract metadata from responses if available
    print("Extracting metadata from responses...")
    metadata_fields = []
    all_metadata = df['llm_response'].apply(extract_metadata_fields).tolist()
    
    # Find all unique metadata fields
    for metadata in all_metadata:
        metadata_fields.extend(metadata.keys())
    metadata_fields = list(set(metadata_fields))
    
    # Add metadata as columns if they don't exist
    for field in metadata_fields:
        if field not in df.columns:
            df[field] = [meta.get(field, np.nan) for meta in all_metadata]
    
    # Make sure quality is lowercase for consistency
    if 'quality' in df.columns:
        df['quality'] = df['quality'].str.lower()
    
    # Convert Score to numeric if it exists
    if 'Score' in df.columns:
        df['Score'] = pd.to_numeric(df['Score'], errors='coerce')
    
    print(f"Data cleaned. Shape: {df.shape}")
    return df

def analyze_performance_by_phase_and_quality(df):
    """Calculate performance metrics by phase and quality level."""
    print("Analyzing performance by phase and quality level...")
    
    # Overall average score by phase
    phase_scores = df.groupby('phase')['Score'].agg(['mean', 'std', 'count']).reset_index()
    phase_scores.columns = ['Phase', 'Average Score', 'Standard Deviation', 'Count']
    
    # Scores by phase and quality level
    phase_quality_scores = df.groupby(['phase', 'quality'])['Score'].agg(['mean', 'std', 'count']).reset_index()
    phase_quality_scores.columns = ['Phase', 'Quality Level', 'Average Score', 'Standard Deviation', 'Count']
    
    return phase_scores, phase_quality_scores

def visualize_score_distribution(df, output_dir):
    """Create visualizations for score distributions."""
    print("Creating visualizations for score distributions...")
    
    # Set up the plotting style
    sns.set(style="whitegrid")
    
    # 1. Overall score distribution
    plt.figure(figsize=(10, 6))
    sns.histplot(df['Score'].dropna(), bins=20, kde=True)
    plt.title('Distribution of Scores Across All Phases', fontsize=15)
    plt.xlabel('Score', fontsize=12)
    plt.ylabel('Frequency', fontsize=12)
    plt.savefig(f"{output_dir}/overall_score_distribution.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # 2. Score distribution by phase
    plt.figure(figsize=(14, 8))
    sns.boxplot(x='phase', y='Score', data=df)
    plt.title('Score Distribution by Phase', fontsize=15)
    plt.xlabel('Phase', fontsize=12)
    plt.ylabel('Score', fontsize=12)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/score_by_phase.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # 3. Score distribution by quality level
    plt.figure(figsize=(12, 7))
    sns.boxplot(x='quality', y='Score', data=df, palette="Set3")
    plt.title('Score Distribution by Quality Level', fontsize=15)
    plt.xlabel('Quality Level', fontsize=12)
    plt.ylabel('Score', fontsize=12)
    plt.savefig(f"{output_dir}/score_by_quality.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # 4. Score heatmap by phase and quality
    pivot_table = df.pivot_table(values='Score', index='phase', columns='quality', aggfunc='mean')
    plt.figure(figsize=(12, 10))
    sns.heatmap(pivot_table, annot=True, cmap="YlGnBu", fmt=".2f", linewidths=.5)
    plt.title('Average Score by Phase and Quality Level', fontsize=15)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/score_heatmap_phase_quality.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # 5. Score distribution for each phase and quality level
    phases = df['phase'].unique()
    for phase in phases:
        phase_data = df[df['phase'] == phase]
        plt.figure(figsize=(12, 7))
        sns.boxplot(x='quality', y='Score', data=phase_data, palette="Set2")
        plt.title(f'Score Distribution for {phase} by Quality Level', fontsize=15)
        plt.xlabel('Quality Level', fontsize=12)
        plt.ylabel('Score', fontsize=12)
        plt.savefig(f"{output_dir}/score_{phase}_by_quality.png", dpi=300, bbox_inches='tight')
        plt.close()

def analyze_scaffolding_effectiveness(df, output_dir):
    """Analyze and visualize the effectiveness of scaffolding approaches."""
    print("Analyzing scaffolding effectiveness...")
    
    if 'Scaffolding' not in df.columns:
        print("No Scaffolding column found in data")
        return None, None
    
    # Create a figure for scaffolding effectiveness
    plt.figure(figsize=(14, 8))
    
    # Get average scores by scaffolding level
    scaffolding_scores = df.groupby('Scaffolding')['Score'].agg(['mean', 'std', 'count']).reset_index()
    scaffolding_scores.columns = ['Scaffolding Level', 'Average Score', 'Standard Deviation', 'Count']
    
    sns.barplot(x='Scaffolding Level', y='Average Score', data=scaffolding_scores, palette="viridis")
    plt.title('Average Score by Scaffolding Level', fontsize=15)
    plt.xlabel('Scaffolding Level', fontsize=12)
    plt.ylabel('Average Score', fontsize=12)
    plt.savefig(f"{output_dir}/scaffolding_effectiveness.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # Scaffolding by phase
    plt.figure(figsize=(16, 10))
    scaffolding_by_phase = df.groupby(['phase', 'Scaffolding']).size().unstack(fill_value=0)
    try:
        scaffolding_by_phase.plot(kind='bar', stacked=True)
        plt.title('Scaffolding Distribution by Phase', fontsize=15)
        plt.xlabel('Phase', fontsize=12)
        plt.ylabel('Count', fontsize=12)
        plt.legend(title='Scaffolding Level')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(f"{output_dir}/scaffolding_by_phase.png", dpi=300, bbox_inches='tight')
    except:
        print("Error creating scaffolding by phase plot - may be due to insufficient data")
    plt.close()
    
    # Scaffolding by phase and quality
    scaffolding_by_phase_quality = df.groupby(['phase', 'quality', 'Scaffolding']).size().reset_index(name='Count')
    
    # Create visualizations for each phase
    phases = df['phase'].unique()
    for phase in phases:
        phase_data = scaffolding_by_phase_quality[scaffolding_by_phase_quality['phase'] == phase]
        if not phase_data.empty:
            plt.figure(figsize=(12, 7))
            sns.barplot(x='quality', y='Count', hue='Scaffolding', data=phase_data, palette="Set3")
            plt.title(f'Scaffolding Distribution for {phase} by Quality Level', fontsize=15)
            plt.xlabel('Quality Level', fontsize=12)
            plt.ylabel('Count', fontsize=12)
            plt.legend(title='Scaffolding Level')
            plt.savefig(f"{output_dir}/scaffolding_{phase}_by_quality.png", dpi=300, bbox_inches='tight')
            plt.close()
    
    return scaffolding_scores, scaffolding_by_phase_quality

def analyze_criteria_performance(df, output_dir):
    """Analyze performance across different criteria."""
    print("Analyzing criteria-specific performance...")
    
    # Identify all criteria columns (those that are not phase, quality, etc.)
    excluded_columns = ['phase', 'quality', 'response_index', 'input_response', 
                        'llm_response', 'Score', 'Scaffolding', 'Rationale', 
                        'Specificity']
    
    # Find all numeric columns that could be criteria
    criteria_columns = [col for col in df.columns if col not in excluded_columns 
                        and df[col].dtype in ['float64', 'int64']]
    
    if not criteria_columns:
        print("No criteria columns found for analysis")
        return None
    
    # Check which columns actually have data
    valid_criteria = []
    for col in criteria_columns:
        if df[col].notna().sum() > 10:  # Only include if we have enough data
            valid_criteria.append(col)
    
    if not valid_criteria:
        print("No criteria with sufficient data found")
        return None
    
    # Create average scores by criteria
    criteria_means = []
    for criterion in valid_criteria:
        mean_value = df[criterion].mean()
        if not pd.isna(mean_value):
            criteria_means.append({'Criteria': criterion, 'Average Score': mean_value})
    
    if not criteria_means:
        print("No valid criteria means calculated")
        return None
        
    criteria_df = pd.DataFrame(criteria_means)
    
    # Plot criteria performance
    plt.figure(figsize=(14, 8))
    sns.barplot(x='Criteria', y='Average Score', data=criteria_df, palette="rocket")
    plt.title('Average Score by Evaluation Criteria', fontsize=15)
    plt.xlabel('Criteria', fontsize=12)
    plt.ylabel('Average Score', fontsize=12)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig(f"{output_dir}/criteria_performance.png", dpi=300, bbox_inches='tight')
    plt.close()
    
    # Criteria performance by phase
    criteria_by_phase = []
    
    for criterion in valid_criteria:
        for phase in df['phase'].unique():
            phase_data = df[df['phase'] == phase]
            mean_value = phase_data[criterion].mean()
            if not pd.isna(mean_value) and phase_data[criterion].notna().sum() > 5:
                criteria_by_phase.append({
                    'Phase': phase,
                    'Criteria': criterion,
                    'Average Score': mean_value
                })
    
    if criteria_by_phase:
        criteria_by_phase_df = pd.DataFrame(criteria_by_phase)
        
        plt.figure(figsize=(16, 10))
        sns.barplot(x='Phase', y='Average Score', hue='Criteria', data=criteria_by_phase_df, palette="Set3")
        plt.title('Criteria Performance by Phase', fontsize=15)
        plt.xlabel('Phase', fontsize=12)
        plt.ylabel('Average Score', fontsize=12)
        plt.legend(title='Criteria', bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(f"{output_dir}/criteria_by_phase.png", dpi=300, bbox_inches='tight')
        plt.close()
    
    return criteria_df

def analyze_adaptive_effect(df, output_dir):
    """Analyze the adaptive effect by comparing quality level and score."""
    print("Analyzing adaptive effect...")
    
    # Map quality to numeric values for visualization
    quality_map = {'low': 1, 'medium': 2, 'high': 3}
    if 'quality' in df.columns:
        df['quality_numeric'] = df['quality'].map(quality_map)
        
        # Create scatter plot with regression line
        plt.figure(figsize=(12, 8))
        sns.regplot(x='quality_numeric', y='Score', data=df, scatter_kws={'alpha':0.5}, line_kws={'color': 'red'})
        plt.xticks([1, 2, 3], ['Low', 'Medium', 'High'])
        plt.title('Relationship Between Initial Quality and Final Score', fontsize=15)
        plt.xlabel('Initial Response Quality', fontsize=12)
        plt.ylabel('Final Score', fontsize=12)
        plt.savefig(f"{output_dir}/adaptive_effect.png", dpi=300, bbox_inches='tight')
        plt.close()
        
        # Adaptive effect by phase
        phases = df['phase'].unique()
        for phase in phases:
            phase_data = df[df['phase'] == phase]
            if len(phase_data) >= 10:  # Only plot if we have enough data
                plt.figure(figsize=(12, 8))
                sns.regplot(x='quality_numeric', y='Score', 
                           data=phase_data, 
                           scatter_kws={'alpha':0.5}, 
                           line_kws={'color': 'red'})
                plt.xticks([1, 2, 3], ['Low', 'Medium', 'High'])
                plt.title(f'Adaptive Effect for {phase}', fontsize=15)
                plt.xlabel('Initial Response Quality', fontsize=12)
                plt.ylabel('Final Score', fontsize=12)
                plt.savefig(f"{output_dir}/adaptive_effect_{phase}.png", dpi=300, bbox_inches='tight')
                plt.close()
        
        # Calculate correlation between quality and score
        correlation = df[['quality_numeric', 'Score']].corr().iloc[0, 1]
        
        # Calculate average improvement (score - quality_numeric)
        df['improvement'] = df['Score'] - df['quality_numeric']
        avg_improvement = df['improvement'].mean()
        
        return correlation, avg_improvement
    
    return None, None

def extract_prompts_from_file(file_path):
    """Extract the prompt templates from the final_prompts.py file."""
    print(f"Extracting prompt templates from {file_path}...")
    
    prompts = {}
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Extract the FINAL_PROMPTS dictionary
        match = re.search(r'FINAL_PROMPTS\s*=\s*{([^}]*)}', content, re.DOTALL)
        if match:
            prompt_dict_text = match.group(1)
            # Extract each prompt key and value
            prompt_pattern = r'"([^"]+)":\s*"""(.*?)""",'
            for prompt_match in re.finditer(prompt_pattern, prompt_dict_text, re.DOTALL):
                key, value = prompt_match.groups()
                prompts[key] = value.strip()
    except Exception as e:
        print(f"Error extracting prompts: {e}")
    
    return prompts

def generate_markdown_report(
    df, phase_scores, phase_quality_scores, scaffolding_scores, 
    scaffolding_by_phase_quality, criteria_df, correlation, avg_improvement,
    prompts, output_dir
):
    """Generate a comprehensive markdown report of the analysis."""
    print("Generating markdown report...")
    
    report_path = f"{output_dir}/prompt_engineering_report.md"
    
    with open(report_path, 'w') as f:
        # Title and introduction
        f.write("# Prompt Engineering Analysis Report\n\n")
        f.write("This report provides a comprehensive analysis of the prompt engineering process for the SoLBot learning system.\n\n")
        
        # Table of Contents
        f.write("## Table of Contents\n\n")
        f.write("1. [Introduction](#introduction)\n")
        f.write("2. [Methodology](#methodology)\n")
        f.write("3. [Prompt Templates](#prompt-templates)\n")
        f.write("4. [Overall Performance](#overall-performance)\n")
        f.write("5. [Phase-by-Phase Analysis](#phase-by-phase-analysis)\n")
        f.write("6. [Scaffolding Analysis](#scaffolding-analysis)\n")
        f.write("7. [Criteria Analysis](#criteria-analysis)\n")
        f.write("8. [Adaptive Effect Analysis](#adaptive-effect-analysis)\n")
        f.write("9. [Conclusion](#conclusion)\n\n")
        
        # Introduction
        f.write("## Introduction\n\n")
        f.write("The SoLBot learning system utilizes a sophisticated prompt engineering approach to provide adaptive guidance to students. ")
        f.write("This analysis examines the effectiveness of the prompts across different phases and quality levels, ")
        f.write("with particular focus on the scaffolding mechanisms and evaluation criteria.\n\n")
        
        f.write("The dataset includes responses from multiple phases of the learning process:\n\n")
        phase_counts = df['phase'].value_counts().reset_index()
        phase_counts.columns = ['Phase', 'Count']
        f.write("| Phase | Count |\n")
        f.write("|-------|-------|\n")
        for _, row in phase_counts.iterrows():
            f.write(f"| {row['Phase']} | {row['Count']} |\n")
        f.write("\n")
        
        # Methodology
        f.write("## Methodology\n\n")
        f.write("The analysis methodology involves:\n\n")
        f.write("1. **Data Cleaning**: Extracting and normalizing scores and metadata from responses\n")
        f.write("2. **Score Analysis**: Calculating performance metrics by phase and quality level\n")
        f.write("3. **Scaffolding Analysis**: Examining the effectiveness of different scaffolding levels\n")
        f.write("4. **Criteria Evaluation**: Analyzing performance across specific evaluation criteria\n")
        f.write("5. **Adaptive Effect Assessment**: Measuring the relationship between initial quality and final score\n\n")
        
        # Prompt Templates
        f.write("## Prompt Templates\n\n")
        f.write("The SoLBot system uses structured prompts for each phase of the learning process. ")
        f.write("Below are the templates used for each phase:\n\n")
        
        for key, prompt in prompts.items():
            f.write(f"### {key}\n\n")
            f.write("```\n")
            # Limit the length of the prompt to keep the report manageable
            if len(prompt) > 500:
                f.write(prompt[:500] + "...\n[Full prompt text truncated for brevity]\n")
            else:
                f.write(prompt + "\n")
            f.write("```\n\n")
        
        # Overall Performance
        f.write("## Overall Performance\n\n")
        f.write("### Score Distribution\n\n")
        f.write("The overall distribution of scores across all phases:\n\n")
        f.write("![Overall Score Distribution](overall_score_distribution.png)\n\n")
        
        f.write("### Performance by Phase\n\n")
        f.write("The following table shows the average performance for each phase:\n\n")
        f.write("| Phase | Average Score | Standard Deviation | Count |\n")
        f.write("|-------|--------------|-------------------|-------|\n")
        for _, row in phase_scores.iterrows():
            f.write(f"| {row['Phase']} | {row['Average Score']:.2f} | {row['Standard Deviation']:.2f} | {row['Count']} |\n")
        f.write("\n")
        
        f.write("![Score by Phase](score_by_phase.png)\n\n")
        
        f.write("### Performance by Quality Level\n\n")
        f.write("The relationship between initial response quality and score:\n\n")
        f.write("![Score by Quality](score_by_quality.png)\n\n")
        
        f.write("### Phase-Quality Relationship\n\n")
        f.write("The heatmap below shows the average score for each combination of phase and quality level:\n\n")
        f.write("![Score Heatmap by Phase and Quality](score_heatmap_phase_quality.png)\n\n")
        
        # Phase-by-Phase Analysis
        f.write("## Phase-by-Phase Analysis\n\n")
        
        phases = df['phase'].unique()
        for phase in phases:
            if phase.startswith('phase'):
                f.write(f"### {phase}\n\n")
                
                # Score distribution by quality level for this phase
                f.write("#### Score Distribution by Quality Level\n\n")
                f.write(f"![Score Distribution for {phase}](score_{phase}_by_quality.png)\n\n")
                
                # Phase-specific performance metrics
                phase_data = phase_quality_scores[phase_quality_scores['Phase'] == phase]
                if not phase_data.empty:
                    f.write("| Quality Level | Average Score | Standard Deviation | Count |\n")
                    f.write("|--------------|--------------|-------------------|-------|\n")
                    for _, row in phase_data.iterrows():
                        f.write(f"| {row['Quality Level']} | {row['Average Score']:.2f} | {row['Standard Deviation']:.2f} | {row['Count']} |\n")
                    f.write("\n")
        
        # Scaffolding Analysis
        f.write("## Scaffolding Analysis\n\n")
        
        if scaffolding_scores is not None:
            f.write("### Scaffolding Effectiveness\n\n")
            f.write("The effectiveness of different scaffolding levels:\n\n")
            f.write("![Scaffolding Effectiveness](scaffolding_effectiveness.png)\n\n")
            
            f.write("| Scaffolding Level | Average Score | Standard Deviation | Count |\n")
            f.write("|-------------------|--------------|-------------------|-------|\n")
            for _, row in scaffolding_scores.iterrows():
                f.write(f"| {row['Scaffolding Level']} | {row['Average Score']:.2f} | {row['Standard Deviation']:.2f} | {row['Count']} |\n")
            f.write("\n")
            
            f.write("### Scaffolding Distribution by Phase and Quality\n\n")
            
            for phase in phases:
                if phase.startswith('phase'):
                    f.write(f"#### {phase}\n\n")
                    f.write(f"![Scaffolding Distribution for {phase}](scaffolding_{phase}_by_quality.png)\n\n")
                    
                    # Create a summary table of scaffolding distribution for this phase
                    phase_scaffolding = scaffolding_by_phase_quality[scaffolding_by_phase_quality['phase'] == phase]
                    if not phase_scaffolding.empty:
                        f.write("| Quality Level | Scaffolding Level | Count |\n")
                        f.write("|--------------|-------------------|-------|\n")
                        for _, row in phase_scaffolding.iterrows():
                            f.write(f"| {row['quality']} | {row['Scaffolding']} | {row['Count']} |\n")
                        f.write("\n")
        
        # Criteria Analysis
        f.write("## Criteria Analysis\n\n")
        
        if criteria_df is not None:
            f.write("### Average Performance by Criteria\n\n")
            f.write("![Criteria Performance](criteria_performance.png)\n\n")
            
            f.write("| Criteria | Average Score |\n")
            f.write("|----------|---------------|\n")
            for _, row in criteria_df.iterrows():
                f.write(f"| {row['Criteria']} | {row['Average Score']:.2f} |\n")
            f.write("\n")
            
            f.write("### Criteria Performance by Phase\n\n")
            f.write("![Criteria by Phase](criteria_by_phase.png)\n\n")
        
        # Adaptive Effect Analysis
        f.write("## Adaptive Effect Analysis\n\n")
        
        if correlation is not None:
            f.write("### Relationship Between Initial Quality and Final Score\n\n")
            f.write("![Adaptive Effect](adaptive_effect.png)\n\n")
            
            f.write(f"**Correlation between initial quality and final score:** {correlation:.2f}\n\n")
            f.write(f"**Average improvement (Score - Quality Numeric):** {avg_improvement:.2f}\n\n")
            
            # Phase-specific adaptive effects
            f.write("### Adaptive Effect by Phase\n\n")
            
            for phase in phases:
                if phase.startswith('phase'):
                    phase_data = df[df['phase'] == phase]
                    if len(phase_data) >= 10:
                        phase_corr = phase_data[['quality_numeric', 'Score']].corr().iloc[0, 1]
                        phase_improvement = phase_data['improvement'].mean()
                        
                        f.write(f"#### {phase}\n\n")
                        f.write(f"![Adaptive Effect for {phase}](adaptive_effect_{phase}.png)\n\n")
                        f.write(f"**Correlation for {phase}:** {phase_corr:.2f}\n\n")
                        f.write(f"**Average improvement for {phase}:** {phase_improvement:.2f}\n\n")
        
        # Conclusion
        f.write("## Conclusion\n\n")
        f.write("Based on the analysis of the prompt engineering process for the SoLBot learning system:\n\n")
        
        # Generate some summary insights
        insights = []
        
        # Overall performance insight
        overall_avg = df['Score'].mean()
        insights.append(f"The overall average score across all phases is {overall_avg:.2f} on a scale of 1-3.")
        
        # Scaffolding insight
        if scaffolding_scores is not None:
            max_scaffolding = scaffolding_scores.loc[scaffolding_scores['Average Score'].idxmax()]
            insights.append(f"The most effective scaffolding level is '{max_scaffolding['Scaffolding Level']}' with an average score of {max_scaffolding['Average Score']:.2f}.")
        
        # Adaptive effect insight
        if correlation is not None:
            insights.append(f"The correlation between initial quality and final score is {correlation:.2f}, indicating a {'strong' if abs(correlation) > 0.7 else 'moderate' if abs(correlation) > 0.4 else 'weak'} relationship.")
            insights.append(f"On average, responses show an improvement of {avg_improvement:.2f} points from their initial quality level.")
        
        # Add insights to conclusion
        for insight in insights:
            f.write(f"- {insight}\n")
        
        f.write("\nThe prompt engineering approach demonstrates effectiveness in providing adaptive guidance to students, ")
        f.write("with scaffolding mechanisms that respond appropriately to different quality levels. ")
        f.write("The system shows particular strength in [identify strongest phase/aspect] while opportunities for improvement exist in [identify weakest phase/aspect].\n")
    
    print(f"Report generated at {report_path}")
    return report_path

def main():
    # Define file paths
    input_file = "/Users/sirui/Desktop/mybot/prompt_test_results.csv"
    prompt_file = "/Users/sirui/Desktop/mybot/prompt_engineering/scripts/final_prompts.py"
    output_dir = "prompt_analysis_results"
    
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(exist_ok=True)
    
    # Load and process data
    df = load_and_clean_data(input_file)
    
    # Extract prompts from the file
    prompts = extract_prompts_from_file(prompt_file)
    
    # Perform all analyses
    phase_scores, phase_quality_scores = analyze_performance_by_phase_and_quality(df)
    visualize_score_distribution(df, output_dir)
    scaffolding_scores, scaffolding_by_phase_quality = analyze_scaffolding_effectiveness(df, output_dir)
    criteria_df = analyze_criteria_performance(df, output_dir)
    correlation, avg_improvement = analyze_adaptive_effect(df, output_dir)
    
    # Generate the report
    report_path = generate_markdown_report(
        df, phase_scores, phase_quality_scores, scaffolding_scores, 
        scaffolding_by_phase_quality, criteria_df, correlation, avg_improvement,
        prompts, output_dir
    )
    
    print(f"Analysis complete! Report saved to {report_path}")

if __name__ == "__main__":
    main() 