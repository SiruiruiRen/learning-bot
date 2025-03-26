"""
Example showing how to integrate the multi-agent system with the existing SoLBot platform.
"""

import asyncio
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException

# Import the multi-agent system
from backend.agents.multiagent import multiagent_system
from backend.models.schemas import ChatRequest, ChatResponse

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Example 1: Integration with FastAPI routes
# This shows how you would add a new route for the multi-agent system
def create_multiagent_router():
    """Create a FastAPI router for the multi-agent system"""
    router = APIRouter()
    
    @router.post("/multiagent")
    async def query_multiagent(request: ChatRequest):
        """Process a query using the multi-agent system"""
        try:
            # Process the query with the multi-agent system
            result = await multiagent_system.process_query(request.message)
            
            # Create response object
            response = ChatResponse(
                message=result.get("final_response", "No response generated"),
                phase=request.phase or "multiagent",
                component=request.component or "general",
                agent_type="multiagent",
                scaffolding_level=request.scaffolding_level or 2,
                metadata={
                    "coordinator_plan": result.get("coordinator_plan", ""),
                    "agent_responses": result.get("agent_responses", {})
                }
            )
            
            return response
        except Exception as e:
            # Log error and return HTTP exception
            logging.error(f"Error in multiagent endpoint: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    return router

# Example 2: Integration with existing manager agent
# This shows how to use the multi-agent system from the manager agent
async def process_with_multiagent(state: Dict[str, Any]) -> Dict[str, Any]:
    """Process a message using the multi-agent system from within the manager agent"""
    try:
        # Extract message from state
        message = state.get("message", "")
        
        # Process with multi-agent system
        result = await multiagent_system.process_query(message)
        
        # Update state with the result
        state["response"] = result.get("final_response", "No response generated")
        state["response_metadata"] = {
            "agent_type": "multiagent",
            "scaffolding_level": state.get("current_scaffolding_level", 2),
            "component": state.get("component", "general"),
            "coordinator_plan": result.get("coordinator_plan", ""),
            "agent_responses": result.get("agent_responses", {})
        }
        
        return state
    except Exception as e:
        logging.error(f"Error in process_with_multiagent: {e}")
        state["error"] = f"Failed to process with multiagent: {str(e)}"
        return state

# Example 3: Running a simple synchronous test
def run_sync_test():
    """Run a synchronous test of the multi-agent system"""
    
    async def _test():
        query = "How can we improve student engagement in online learning environments?"
        print(f"Query: {query}")
        
        result = await multiagent_system.process_query(query)
        print(f"\nFinal Response: {result.get('final_response', 'No response')}")
        
        return result
    
    # Run the async function synchronously
    return asyncio.run(_test())

if __name__ == "__main__":
    """Run the synchronous test when script is executed directly"""
    print("\nRunning integration test...")
    run_sync_test()
    print("\nTest complete!") 