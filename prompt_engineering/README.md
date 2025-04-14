# SoLBot Prompt Engineering

This directory contains scripts for testing and analyzing prompts for the SoLBot learning system.

## Overview

The system includes:

1. **Mock Data** (`mock.py`): Contains mock student responses at different quality levels (low, medium, high) for each phase of the SoLBot learning system.

2. **Prompts** (`scripts/final_prompts.py`): Contains the optimized system prompts for each phase of the SoLBot learning system.

3. **Prompt Testing** (`scripts/test_prompts.py`): Tests the prompts against mock student responses using Claude 3.5 Sonnet and collects the results.

4. **Results Analysis** (`scripts/analyze_results.py`): Analyzes the test results and generates visualizations and statistics.

## Project Structure

```
prompt_engineering/
├── __init__.py               # Package initialization file
├── README.md                 # This file
├── mock.py                   # Mock student responses
├── scripts/
│   ├── __init__.py           # Scripts package initialization
│   ├── final_prompts.py      # System prompts for each phase
│   ├── test_prompts.py       # Script to test prompts against mock responses
│   └── analyze_results.py    # Script to analyze test results
```

## Requirements

- Python 3.7+
- Required packages: `requests`, `pandas`, `numpy`, `matplotlib`, `seaborn`, `python-dotenv`, `openpyxl`

You can install the required packages using:

```bash
pip install requests pandas numpy matplotlib seaborn python-dotenv openpyxl
```

## Setup

1. Create a `.env` file in the root directory with your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

## Usage

### Testing Prompts

To test all prompts against all mock responses:

```bash
cd /path/to/mybot  # Make sure you're in the project root directory
python -m prompt_engineering.scripts.test_prompts
```

This will generate a CSV file `prompt_test_results.csv` containing the test results.

Options:
- `--output`: Specify the output CSV file (default: `prompt_test_results.csv`)
- `--sample`: Run a smaller test with just one response per quality level

Example:
```bash
python -m prompt_engineering.scripts.test_prompts --output my_results.csv --sample
```

### Analyzing Results

To analyze the test results:

```bash
python -m prompt_engineering.scripts.analyze_results
```

This will generate:
- Visualizations in the `analysis_results` directory
- A summary report `analysis_results/analysis_report.md`
- An Excel file `prompt_analysis_detailed.xlsx` with detailed results

Options:
- `--input`: Specify the input CSV file (default: `prompt_test_results.csv`)
- `--output-dir`: Specify the output directory for analysis results (default: `analysis_results`)
- `--excel-output`: Specify the output Excel file (default: `prompt_analysis_detailed.xlsx`)

Example:
```bash
python -m prompt_engineering.scripts.analyze_results --input my_results.csv --output-dir my_analysis --excel-output my_detailed_analysis.xlsx
```

## Output Structure

### CSV Output

The CSV output from `test_prompts.py` includes:

- `phase`: The phase of the SoLBot learning system
- `quality`: The quality level of the mock response (low, medium, high)
- `response_index`: The index of the mock response
- `input_response`: The mock student response
- `llm_response`: The response from Claude
- Metadata extracted from Claude's response:
  - `Score`: The overall score (1-3)
  - `Scaffolding`: The scaffolding level (low, medium, high)
  - Phase-specific criteria scores
  - `Rationale`: The rationale for the scores

### Analysis Output

The analysis results include:

1. **Visualizations**:
   - Score distribution by phase and quality level
   - Score difference distribution
   - Scaffolding accuracy
   - Criteria-specific scores by phase

2. **Summary Report**:
   - Overall metrics
   - Phase-specific metrics
   - Quality-specific metrics
   - Accuracy metrics by phase

3. **Excel File**:
   - All data in one sheet
   - Separate sheets for each phase
   - Pivot tables for score analysis
   - Pivot tables for scaffolding analysis

## Adding New Prompts or Mock Responses

To add new prompts:
1. Add the prompt to `scripts/final_prompts.py` in the `FINAL_PROMPTS` dictionary
2. Add corresponding mock responses to `mock.py` in the `MOCK_RESPONSES` dictionary
3. Update the `phase_mapping` in `test_prompts.py` if necessary

## Troubleshooting

If you encounter import errors like `ModuleNotFoundError: No module named 'prompt_engineering'`, make sure:

1. You are running the scripts from the project root directory (the one containing the `prompt_engineering` directory)
2. You're using the module import syntax (`python -m prompt_engineering.scripts.test_prompts`)
3. The directory structure and `__init__.py` files are properly set up

## Authors

SoLBot Learning System Team 