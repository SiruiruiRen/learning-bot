# Claude 3.5 Test Results Evaluation

This folder contains scripts for analyzing the results of Claude 3.5 tests on SoLBot prompts.

## Overview

The analysis evaluates Claude 3.5's performance on different quality levels of student responses across all phases of the SoLBot learning system. It provides:

1. **Score Distribution Analysis**: How well does Claude 3.5 score responses of different quality levels?
2. **Scaffolding Level Assessment**: Does Claude correctly assign scaffolding levels based on scores?
3. **Criteria-Specific Analysis**: How does Claude evaluate different aspects of student responses?
4. **Performance by Phase and Level**: How consistent is Claude across different phases and quality levels?

## Usage

To analyze Claude test results:

1. Ensure you have run the test script (`prompt_engineering/scripts/test_claude_prompts.py`) first to generate `claude_test_results.xlsx`

2. Install the required dependencies:
   ```bash
   pip install pandas numpy matplotlib seaborn
   ```

3. Run the analysis script:
   ```bash
   cd /Users/sirui/Desktop/mybot
   python -m prompt_engineering.evaluation.analyze_claude_results
   ```

4. View the results in the `prompt_engineering/evaluation/results` directory:
   - `summary_report.html`: Interactive HTML report with visualizations
   - `summary_report.txt`: Text summary of key metrics
   - Various visualization images (PNG files)
   - `processed_results.xlsx`: Processed data for further analysis

## Visualizations

The analysis generates several types of visualizations:

- **Box plots**: Score distribution by phase and quality level
- **Heatmaps**: Average scores and relationships between variables
- **Bar charts**: Scaffolding accuracy and distribution
- **Radar charts**: Criteria scores by quality level for each phase

## Reports

The analysis produces two main reports:

1. **Text Summary** (`summary_report.txt`): 
   - Overall metrics (average score, standard deviation, scaffolding accuracy)
   - Phase-specific metrics
   - Level-specific metrics
   - Combined phase and level metrics

2. **HTML Report** (`summary_report.html`):
   - Interactive report with embedded visualizations
   - Organized by phase and analysis type
   - Mobile-friendly design

## Future Improvements

Potential enhancements to the analysis:

- Sentiment analysis of Claude's feedback
- Comparison with human evaluators
- Correlation analysis between criteria
- Deeper analysis of scaffolding strategies 