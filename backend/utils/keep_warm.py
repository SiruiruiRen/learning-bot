"""
A script to keep the backend warm by sending periodic requests to itself.
This prevents the service from going to sleep on free tiers of hosting platforms.
"""

import time
import threading
import requests
import os
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("warmup")

# Get service URL from environment or use default
SERVICE_URL = os.environ.get("SERVICE_URL", "http://localhost:8080")
PING_INTERVAL = int(os.environ.get("PING_INTERVAL", 10 * 60))  # 10 minutes by default

def ping_service():
    """Send a request to the service health endpoint."""
    try:
        start_time = time.time()
        response = requests.get(f"{SERVICE_URL}/health", timeout=5)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            logger.info(f"Service is healthy. Response time: {duration:.2f}s")
            return True
        else:
            logger.warning(f"Service returned status code {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"Error pinging service: {str(e)}")
        return False

def warmup_service_periodically():
    """Run a loop to ping the service at regular intervals."""
    logger.info(f"Starting warmup service. Will ping {SERVICE_URL} every {PING_INTERVAL} seconds")
    
    while True:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        logger.info(f"[{now}] Pinging service to keep it warm...")
        ping_service()
        
        # Sleep until next ping
        time.sleep(PING_INTERVAL)

def start_warmup_thread():
    """Start the warmup process in a background thread."""
    if os.environ.get("ENABLE_WARMUP", "true").lower() == "true":
        warmup_thread = threading.Thread(target=warmup_service_periodically, daemon=True)
        warmup_thread.start()
        logger.info("Warmup thread started")
    else:
        logger.info("Warmup service is disabled")

if __name__ == "__main__":
    # This allows running the script directly for testing
    ping_service() 