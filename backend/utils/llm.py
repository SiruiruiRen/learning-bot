"""
LLM utility for interacting with Claude
"""

import logging
import os
import json
from typing import Dict, List, Any, Optional, Union
import asyncio
from anthropic import AsyncAnthropic
from dotenv import load_dotenv
import hashlib
import time
import aiohttp
import traceback
import uuid
import datetime


# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger("solbot.llm")

# Get API key from environment
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
# Hard-code the model to ensure we use the right version
CLAUDE_MODEL = "claude-3-5-sonnet-20241022"

logger.info(f"Using Claude model: {CLAUDE_MODEL}")

# Initialize Anthropic client with increased timeout
try:
    client = AsyncAnthropic(
        api_key=ANTHROPIC_API_KEY,
        timeout=60.0  # Increase timeout to 60 seconds
    )
    logger.info(f"Anthropic client initialized with model: {CLAUDE_MODEL}")
except Exception as e:
    logger.error(f"Error initializing Anthropic client: {e}")
    client = None

# Simple in-memory LRU cache with expiry
response_cache = {}
cache_size_limit = 150  # Increased from 100 to 150 to store more responses
cache_ttl = 1200  # Increased from 600 (10 minutes) to 1200 (20 minutes)

# Local memory DB fallback for logging
local_memory_db = {
    "llm_interactions": []
}

def create_cache_key(system_prompt: str, user_message: str, tools: Optional[List[Dict[str, Any]]] = None, chat_history: Optional[List[Dict[str, Any]]] = None) -> str:
    """Create a cache key for the given parameters with fuzzy matching"""
    # Create a string representation of parameters that's more likely to match similar requests
    # Truncate the system prompt to first 800 chars to increase cache hits
    system_truncated = system_prompt[:800] if system_prompt else ""
    
    # Only use essential parts for the key
    key_parts = [
        system_truncated,
        user_message.strip(),  # Remove whitespace for better matching
        # Only include tools if actually present
        json.dumps(tools) if tools else "",
        # Only use the last message from chat history for caching to increase cache hits
        json.dumps(chat_history[-1:]) if chat_history else ""
    ]
    
    # Create a hash of the key parts
    key = hashlib.md5("".join(key_parts).encode()).hexdigest()
    return key

async def log_llm_interaction(
    user_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    message_id: Optional[str] = None,
    phase: Optional[str] = None,
    component: Optional[str] = None,
    system_prompt: str = "",
    user_message: str = "",
    raw_llm_response: str = "",
    processed_response: str = "",
    model_name: str = CLAUDE_MODEL,
    temperature: float = 0.3,
    max_tokens: int = 750,
    input_tokens: int = 0,
    output_tokens: int = 0,
    request_timestamp: Optional[float] = None,
    response_timestamp: Optional[float] = None,
    duration_ms: Optional[int] = None,
    cache_hit: bool = False,
    metadata: Optional[Dict[str, Any]] = None
) -> None:
    """
    Log an LLM interaction to the database
    
    This function will save all details of an LLM interaction to the llm_interactions table
    for analysis, debugging, and auditing purposes.
    """
    # Import here to avoid circular imports
    from backend.utils.db import get_db
    
    try:
        # Calculate duration if timestamps are provided
        if request_timestamp and response_timestamp and not duration_ms:
            duration_ms = int((response_timestamp - request_timestamp) * 1000)
            
        # Create interaction record
        interaction = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "conversation_id": conversation_id,
            "message_id": message_id,
            "phase": phase or "unknown",
            "component": component,
            "system_prompt": system_prompt,
            "user_message": user_message,
            "raw_llm_response": raw_llm_response,
            "processed_response": processed_response,
            "model_name": model_name,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "request_timestamp": datetime.datetime.fromtimestamp(request_timestamp or time.time()).isoformat(),
            "response_timestamp": datetime.datetime.fromtimestamp(response_timestamp or time.time()).isoformat(),
            "duration_ms": duration_ms,
            "cache_hit": cache_hit,
            "metadata": json.dumps(metadata or {})
        }
        
        # Get DB client
        db = get_db()
        
        # Check if we are using memory storage or the DB connection failed
        try:
            from backend.utils.db import _using_memory_db
            if _using_memory_db or db is None:
                # Store in local memory DB
                global local_memory_db
                local_memory_db["llm_interactions"].append(interaction)
                logger.debug(f"Stored LLM interaction in memory: {interaction['id']}")
                return
        except ImportError:
            logger.warning("Could not import _using_memory_db, falling back to local storage")
            local_memory_db["llm_interactions"].append(interaction)
            return
            
        # If we reach here, use the database
        try:
            db.table("llm_interactions").insert(interaction).execute()
            logger.debug(f"Logged LLM interaction to database: {interaction['id']}")
        except Exception as db_error:
            logger.error(f"Error saving to database: {db_error}")
            # Fallback to memory storage
            local_memory_db["llm_interactions"].append(interaction)
            
    except Exception as e:
        logger.error(f"Error logging LLM interaction: {e}")
        # Don't re-raise to avoid impacting the main flow

async def call_claude(
    system_prompt: str,
    user_message: str,
    tools: Optional[List[Dict[str, Any]]] = None,
    chat_history: Optional[List[Dict[str, Any]]] = None,
    temperature: float = 0.3,  # Reduced default temperature from 0.7 to 0.5
    max_tokens: int = 750,     # Reduced default max tokens from 1000 to 750
    use_cache: bool = True,
    stream: bool = False,
    user_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    message_id: Optional[str] = None,
    phase: Optional[str] = None,
    component: Optional[str] = None
) -> Dict[str, Any]:
    """
    Call Claude with the specified prompts and parameters
    
    Args:
        system_prompt: The system prompt
        user_message: The user message
        tools: Optional list of tools to use
        chat_history: Optional chat history
        temperature: The temperature (0.0-1.0)
        max_tokens: Maximum tokens to generate
        use_cache: Whether to use caching (default: True)
        stream: Whether to stream the response (default: False)
        user_id: Optional user ID for logging
        conversation_id: Optional conversation ID for logging
        message_id: Optional message ID for logging
        phase: Optional phase for logging
        component: Optional component for logging
        
    Returns:
        Dictionary containing the model's response
    """
    # Track request start time
    request_timestamp = time.time()
    cache_hit = False
    
    try:
        # Optimize: Cache for temperatures up to 0.6 for more cache hits
        if use_cache and temperature <= 0.6:
            cache_key = create_cache_key(system_prompt, user_message, tools, chat_history)
            
            # Check if we have a cached response
            if cache_key in response_cache:
                cache_entry = response_cache[cache_key]
                
                # Check if cache entry is still valid
                if time.time() - cache_entry["timestamp"] < cache_ttl:
                    logger.info(f"Using cached response for {cache_key[:8]}...")
                    
                    # Extract response from cache
                    result = cache_entry["response"]
                    cache_hit = True
                    
                    # Calculate response time for logging
                    response_timestamp = time.time()
                    
                    # Log the cached interaction
                    await log_llm_interaction(
                        user_id=user_id,
                        conversation_id=conversation_id,
                        message_id=message_id,
                        phase=phase,
                        component=component,
                        system_prompt=system_prompt,
                        user_message=user_message,
                        raw_llm_response=result.get("content", ""),
                        processed_response=result.get("content", ""),
                        model_name=result.get("model", CLAUDE_MODEL),
                        temperature=temperature,
                        max_tokens=max_tokens,
                        input_tokens=result.get("usage", {}).get("input_tokens", 0),
                        output_tokens=result.get("usage", {}).get("output_tokens", 0),
                        request_timestamp=request_timestamp,
                        response_timestamp=response_timestamp,
                        duration_ms=int((response_timestamp - request_timestamp) * 1000),
                        cache_hit=True,
                        metadata={
                            "tools": tools,
                            "cache_key": cache_key,
                            "chat_history_length": len(chat_history) if chat_history else 0
                        }
                    )
                    
                    return result
                else:
                    # Remove expired cache entry
                    del response_cache[cache_key]
        
        # Format messages - use up to 8 recent messages for full context
        messages = []
        
        # Add chat history if provided (up to last 8 messages)
        if chat_history:
            for msg in chat_history[-8:]:  # Use last 8 messages
                # Add each message to the context
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role in ["user", "assistant"] and content:
                    messages.append({"role": role, "content": content})

        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Prepare API call parameters
        params = {
            "model": CLAUDE_MODEL,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": messages
        }
        
        # Add tools if provided
        if tools:
            params["tools"] = tools
        
        # Make API call with proper timeout handling using asyncio.wait_for
        try:
            # Set a reasonable timeout for the API call (60 seconds)
            api_timeout = 60  # Increased timeout for complex prompts
            
            logger.info(f"Calling Claude API with model={CLAUDE_MODEL}, temperature={temperature}")
            
            # Create the API call as a task
            if stream:
                # Streaming logic - not implemented in this edit for simplicity
                # Would need to implement client-side streaming reception
                logger.warning("Streaming requested but not implemented yet")
            
            # Implement retry logic for API calls
            max_retries = 2
            retry_count = 0
            last_error = None
            
            while retry_count <= max_retries:
                try:
                    # Create the API call as a task
                    api_task = client.messages.create(**params)
                    
                    # Wait for the task with a timeout
                    response = await asyncio.wait_for(api_task, timeout=api_timeout)
                    
                    # If we get here, the call succeeded
                    break
                    
                except asyncio.TimeoutError:
                    retry_count += 1
                    last_error = "timeout"
                    logger.warning(f"API call timed out (attempt {retry_count}/{max_retries})")
                    if retry_count <= max_retries:
                        # Wait before retrying
                        await asyncio.sleep(2)
                    else:
                        # Max retries reached, re-raise
                        raise
                        
                except aiohttp.ClientError as e:
                    retry_count += 1
                    last_error = f"connection: {str(e)}"
                    logger.warning(f"API connection error (attempt {retry_count}/{max_retries}): {e}")
                    if retry_count <= max_retries:
                        # Wait before retrying
                        await asyncio.sleep(2)
                    else:
                        # Max retries reached, re-raise
                        raise
                        
                except Exception as e:
                    retry_count += 1
                    last_error = f"other: {str(e)}"
                    logger.warning(f"API call error (attempt {retry_count}/{max_retries}): {e}")
                    if retry_count <= max_retries:
                        # Wait before retrying
                        await asyncio.sleep(2)
                    else:
                        # Max retries reached, re-raise
                        raise
            
            # Check if we exhausted all retries
            if retry_count > max_retries:
                raise Exception(f"Failed after {max_retries} retries. Last error: {last_error}")
            
        except asyncio.TimeoutError:
            logger.error(f"API call timed out after {api_timeout} seconds and {max_retries} retries")
            result = {
                "error": "The request timed out", 
                "content": "I'm taking too long to respond. Please try again with a simpler query or check your network connection."
            }
            
            # Calculate response time for logging
            response_timestamp = time.time()
            
            # Log the timed out interaction
            await log_llm_interaction(
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=message_id,
                phase=phase,
                component=component,
                system_prompt=system_prompt,
                user_message=user_message,
                raw_llm_response="TIMEOUT",
                model_name=CLAUDE_MODEL,
                temperature=temperature,
                max_tokens=max_tokens,
                request_timestamp=request_timestamp,
                response_timestamp=response_timestamp,
                duration_ms=int((response_timestamp - request_timestamp) * 1000),
                cache_hit=False,
                metadata={
                    "error": "timeout",
                    "tools": tools,
                    "chat_history_length": len(chat_history) if chat_history else 0,
                    "timeout_seconds": api_timeout
                }
            )
            
            return result
        except aiohttp.ClientError as e:
            logger.error(f"API connection error after {max_retries} retries: {e}")
            result = {
                "error": str(e), 
                "content": "I'm having network connectivity issues right now. Please check your internet connection and try again."
            }
            
            # Calculate response time for logging
            response_timestamp = time.time()
            
            # Log the connection error
            await log_llm_interaction(
                user_id=user_id,
                conversation_id=conversation_id,
                message_id=message_id,
                phase=phase,
                component=component,
                system_prompt=system_prompt,
                user_message=user_message,
                raw_llm_response=f"CONNECTION_ERROR: {str(e)}",
                model_name=CLAUDE_MODEL,
                temperature=temperature,
                max_tokens=max_tokens,
                request_timestamp=request_timestamp,
                response_timestamp=response_timestamp,
                duration_ms=int((response_timestamp - request_timestamp) * 1000),
                cache_hit=False,
                metadata={
                    "error": "connection",
                    "error_details": str(e),
                    "tools": tools,
                    "chat_history_length": len(chat_history) if chat_history else 0
                }
            )
            
            return result
        
        # Record response timestamp
        response_timestamp = time.time()
        
        # Extract content from response
        content = ""
        if response.content:
            for block in response.content:
                if block.type == "text":
                    content += block.text
        
        # Create result object
        result = {
            "content": content,
            "model": CLAUDE_MODEL,
            "usage": {
                "input_tokens": response.usage.input_tokens,
                "output_tokens": response.usage.output_tokens
            }
        }
        
        # Add tool calls if present
        if hasattr(response, "tool_calls") and response.tool_calls:
            result["tool_calls"] = response.tool_calls
        
        # Log the successful interaction
        await log_llm_interaction(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            phase=phase,
            component=component,
            system_prompt=system_prompt,
            user_message=user_message,
            raw_llm_response=content,
            processed_response=content,
            model_name=CLAUDE_MODEL,
            temperature=temperature,
            max_tokens=max_tokens,
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            request_timestamp=request_timestamp,
            response_timestamp=response_timestamp,
            duration_ms=int((response_timestamp - request_timestamp) * 1000),
            cache_hit=False,
            metadata={
                "has_tool_calls": hasattr(response, "tool_calls") and len(response.tool_calls) > 0,
                "tools": tools,
                "chat_history_length": len(chat_history) if chat_history else 0
            }
        )
        
        # Cache the result if caching is enabled
        if use_cache and temperature <= 0.6:
            # Add to cache with compression
            response_cache[cache_key] = {
                "response": result,
                "timestamp": time.time()
            }
            
            # Prune cache if necessary
            if len(response_cache) > cache_size_limit:
                # Remove oldest 10% of entries at once for efficiency
                prune_count = max(1, int(cache_size_limit * 0.1))
                oldest_keys = sorted(response_cache.keys(), 
                                    key=lambda k: response_cache[k]["timestamp"])[:prune_count]
                for key in oldest_keys:
                    del response_cache[key]
        
        return result
    
    except Exception as e:
        logger.error(f"Error calling Claude: {e}")
        result = {"error": str(e), "content": "I'm having trouble processing your request right now."}
        
        # Calculate response time for logging
        response_timestamp = time.time()
        
        # Log the error
        await log_llm_interaction(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            phase=phase,
            component=component,
            system_prompt=system_prompt,
            user_message=user_message,
            raw_llm_response=f"ERROR: {str(e)}",
            model_name=CLAUDE_MODEL,
            temperature=temperature,
            max_tokens=max_tokens,
            request_timestamp=request_timestamp,
            response_timestamp=response_timestamp,
            duration_ms=int((response_timestamp - request_timestamp) * 1000),
            cache_hit=False,
            metadata={
                "error": "exception",
                "error_details": str(e),
                "traceback": traceback.format_exc(),
                "tools": tools,
                "chat_history_length": len(chat_history) if chat_history else 0
            }
        )
        
        return result

def get_rubric_evaluation_tool(phase: str, component: str = "general") -> List[Dict[str, Any]]:
    """
    Create a tool for evaluating user responses against rubrics
    
    Args:
        phase: The learning phase
        component: The specific component within the phase
        
    Returns:
        A list containing the evaluation tool definition
    """
    # Get criteria for this phase and component
    criteria = get_criteria_for_phase(phase, component)
    
    # Create properties for each criterion
    criteria_properties = {}
    required_criteria = []
    
    for criterion, details in criteria.items():
        criteria_properties[criterion] = {
            "type": "object",
            "properties": {
                "score": {
                    "type": "integer",
                    "enum": [1, 2, 3],
                    "description": f"Score for {criterion}"
                },
                "feedback": {
                    "type": "string",
                    "description": f"Feedback explaining the score for {criterion}"
                }
            },
            "required": ["score", "feedback"],
            "description": details.get("description", f"Evaluation for {criterion}")
        }
        required_criteria.append(criterion)
    
    # Define the evaluation tool
    evaluation_tool = {
        "name": "evaluate_response",
        "description": f"Evaluate the student's response against the {phase} rubric for {component}",
        "input_schema": {
            "type": "object",
            "properties": {
                "overall_score": {
                    "type": "number",
                    "description": "The overall score (average of all criteria scores)"
                },
                "scaffolding_level": {
                    "type": "integer",
                    "enum": [1, 2, 3],
                    "description": "The scaffolding level based on the overall score (1: high support, 2: medium support, 3: low support)"
                },
                "explanation": {
                    "type": "string",
                    "description": "Explanation of the overall evaluation"
                },
                "criteria_scores": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "criteria": {
                                "type": "string",
                                "description": "The name of the criterion"
                            },
                            "score": {
                                "type": "integer",
                                "enum": [1, 2, 3],
                                "description": "The score for this criterion (1-3)"
                            },
                            "feedback": {
                                "type": "string",
                                "description": "Specific feedback for this criterion"
                            }
                        },
                        "required": ["criteria", "score", "feedback"]
                    },
                    "description": "Scores and feedback for each criterion"
                }
            },
            "required": ["overall_score", "scaffolding_level", "explanation", "criteria_scores"]
        }
    }
    
    return [evaluation_tool]

def parse_tool_output(tool_calls: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Parse the output from a tool call
    
    Args:
        tool_calls: List of tool calls from the model
        
    Returns:
        The parsed tool output
    """
    if not tool_calls:
        return {}
    
    try:
        # Get the first tool call
        tool_call = tool_calls[0]
        
        # Parse the output
        if isinstance(tool_call, dict) and "input" in tool_call:
            # Already parsed
            return tool_call["input"]
        elif hasattr(tool_call, "input"):
            # Parse from object
            input_data = tool_call.input
            if isinstance(input_data, str):
                return json.loads(input_data)
            elif isinstance(input_data, dict):
                return input_data
    
    except Exception as e:
        logger.error(f"Error parsing tool output: {e}")
    
    return {} 