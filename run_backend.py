#!/usr/bin/env python3
"""
Start the SoLBot backend server with multiple workers for enhanced performance
"""

import os
import sys
import logging
import uvicorn
import socket
import signal
import subprocess
import multiprocessing
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("solbot")

def is_port_in_use(port):
    """Check if the specified port is already in use"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def main():
    """Run the SoLBot backend server with multiple workers"""
    
    # Load environment variables
    load_dotenv()
    
    # Check if API key is set
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        logger.error("ANTHROPIC_API_KEY not found in environment variables")
        print("Error: ANTHROPIC_API_KEY is not set in your environment.")
        print("Please set it in your .env file or environment variables.")
        sys.exit(1)
    
    # Print key information (first 8 and last 4 characters only)
    if api_key:
        masked_key = f"{api_key[:8]}...{api_key[-4:]}"
        print(f"Using API key: {masked_key}")
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8080))
    
    # Check if port is already in use
    if is_port_in_use(port):
        print(f"Error: Port {port} is already in use.")
        print("Either stop the existing server or use a different port by setting the PORT environment variable.")
        sys.exit(1)
    
    # Determine number of workers based on CPU cores
    workers_count = min(multiprocessing.cpu_count(), 4)  # Use at most 4 workers
    print(f"Starting SoLBot backend with {workers_count} workers on port {port}...")
    print("Press CTRL+C to stop the server")
    
    try:
        # Start the uvicorn server with multiple workers
        uvicorn.run(
            "backend.main:app",
            host="0.0.0.0",
            port=port,
            workers=workers_count,  # Use multiple workers
            reload=False,  # Disable reload in multi-worker mode
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nShutting down SoLBot backend...")
    except Exception as e:
        logger.error(f"Error running server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Handle signals properly for clean shutdown
    signal.signal(signal.SIGINT, lambda sig, frame: sys.exit(0))
    signal.signal(signal.SIGTERM, lambda sig, frame: sys.exit(0))
    
    try:
        main()
    except KeyboardInterrupt:
        print("\nShutting down SoLBot backend...")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1) 