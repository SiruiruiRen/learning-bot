"""
Script to check if the Anthropic API key is valid.
This helps diagnose authentication issues before running the full multi-agent system.
"""

import os
import asyncio
from anthropic import AsyncAnthropic, AnthropicError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Always use the specified model exactly as required
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"

async def check_api_key():
    """Check if the Anthropic API key is valid by making a simple API call"""
    
    # Get API key from environment
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY not found in environment variables")
        return False
    
    print(f"🔑 Using API key: {api_key[:8]}...{api_key[-4:]}")
    print(f"🤖 Using model: {CLAUDE_MODEL}")
    
    # Initialize client
    client = AsyncAnthropic(api_key=api_key)
    
    try:
        # Make a simple API call
        print("🔄 Making test API call to verify key...")
        response = await client.messages.create(
            model=CLAUDE_MODEL,  # Using the exact model version
            max_tokens=10,
            temperature=0,
            system="You are a helpful assistant. Keep your response very short.",
            messages=[
                {
                    "role": "user",
                    "content": "Say 'API key is valid' and nothing else."
                }
            ]
        )
        
        # Extract response text
        response_text = ""
        if response.content:
            for content_block in response.content:
                if content_block.type == "text":
                    response_text = content_block.text
                    break
        
        # Check if we got a valid response
        if "API key is valid" in response_text:
            print(f"✅ Success! API key is valid. Response: '{response_text}'")
            return True
        else:
            print(f"❓ Got response but it doesn't contain expected text: '{response_text}'")
            return True  # Still consider it valid since we got a response
    
    except AnthropicError as e:
        if "authentication_error" in str(e):
            print(f"❌ Authentication error: {e}")
            print("\nPlease update your .env file with a valid API key.")
            print("The key should look like: sk-ant-api03-...")
            return False
        elif "model_not_found" in str(e) or "not_found" in str(e):
            print(f"❌ Model not found error: {e}")
            print(f"\nThe model '{CLAUDE_MODEL}' may not be available to your account.")
            print("Please make sure you have access to Claude 3.5 Sonnet in your Anthropic account.")
            return False
        else:
            print(f"❌ API error: {e}")
            return False
    
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

async def main():
    """Main function"""
    print("\n" + "=" * 50)
    print("ANTHROPIC API KEY VALIDATION")
    print("=" * 50)
    
    result = await check_api_key()
    
    print("\n" + "=" * 50)
    if result:
        print("✅ API KEY VALIDATION SUCCESSFUL")
    else:
        print("❌ API KEY VALIDATION FAILED")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    asyncio.run(main()) 