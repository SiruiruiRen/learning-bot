# Claude 3.5 Prompt Testing

This directory contains scripts for testing the SoLBot prompts with Claude 3.5.

## test_claude_prompts.py

This script tests the final prompts against mock student responses using Claude 3.5 (claude-3-5-sonnet-20241022). It sends each prompt with different quality mock responses to the API and records the results in an Excel file.

### Prerequisites

1. Install the required dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```

2. Set your Anthropic API key as an environment variable:
   ```bash
   export ANTHROPIC_API_KEY=your_api_key_here
   ```
   
   Alternatively, you can create a `.env` file in the project root with the following content:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

### Usage

Run the script from the project root directory:
```bash
python -m prompt_engineering.scripts.test_claude_prompts
```

### Output

The script generates an Excel file named `claude_test_results.xlsx` with the following sheets:
- `All Results`: Contains all test results
- One sheet per phase (e.g., `phase2_learning_objectives`)
- `Summary`: Summary statistics for each phase and quality level

### Excel Data Structure

Each row in the results contains:
- `phase`: The phase being tested (e.g., phase2_learning_objectives)
- `response_level`: The quality level of the mock response (low, medium, high)
- `response_text`: The text of the mock response
- `claude_response`: The raw response from Claude 3.5
- `metadata`: Extracted metadata from Claude's response
- `core_components`: Extracted core components specific to each phase

### Customizing Tests

By default, the script tests 2 mock responses per level for each phase. To test more or fewer responses, modify this line in the `test_prompts()` function:
```python
# Test with each mock response (limiting to 2 per level to avoid excessive API calls)
for i, response in enumerate(responses[:2]):
``` 