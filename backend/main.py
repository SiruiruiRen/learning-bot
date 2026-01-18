from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import sys
import logging
from dotenv import load_dotenv
import datetime

# Add project root and backend directory to the Python path to fix imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
sys.path.append(project_root)
sys.path.append(current_dir)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("solbot")

# Import conditionally based on environment
try:
    # Try importing the keep_warm module
    try:
        logger.info("Attempting to import from backend package...")
        from backend.utils.keep_warm import start_warmup_thread
        # If this succeeds, we're likely running from project root
        from backend.routes.chat import router as main_api_router
        from backend.routes.summary import router as summary_router
        from backend.routes.feedback_style import router as feedback_style_router
        from backend.utils import db
        logger.info("Successfully imported modules from backend package")
    except ImportError as e:
        logger.info(f"Backend package import failed: {e}, trying direct import...")
        # If that fails, try direct import (running from backend dir)
        from utils.keep_warm import start_warmup_thread
        from routes.chat import router as main_api_router
        from routes.summary import router as summary_router
        from routes.feedback_style import router as feedback_style_router
        from utils import db
        logger.info("Successfully imported modules directly")
except Exception as e:
    logger.error(f"All import attempts failed: {e}")
    # Define dummy functions if imports fail
    def start_warmup_thread():
        logger.warning("Using dummy warmup thread function")
    # But we still need routers, so raise the error
    raise

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize resources
    logger.info("SoL2LBot backend starting up...")
    
    # Initialize database with error handling
    try:
        db.get_db()
        logger.info("Database initialized")
    except Exception as db_err:
        logger.error(f"Database initialization failed: {db_err}")
    
    logger.info("Using simplified direct LLM architecture")
    
    # Start the warmup thread to keep the service from sleeping
    if os.environ.get("ENABLE_WARMUP", "true").lower() == "true":
        logger.info("Starting warmup service...")
        start_warmup_thread()
    
    yield
    # Shutdown: cleanup resources
    logger.info("SoL2LBot backend shutting down...")

# Initialize FastAPI
app = FastAPI(
    title="SoL2LBot API",
    description="Backend API for SoL2LBot self-regulated learning platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [
    "http://localhost:3000",          # Local development
    "http://localhost:3004",          # Local development alternate port
    "https://sol-bot-seven.vercel.app", # Vercel domain (legacy)
    "https://learning-bot.vercel.app",   # Alternate Vercel domain (legacy)
    "https://solbot.vercel.app",         # Another possible Vercel domain (legacy)
    "https://sol-kfr2d09v1-rensirui-uncedus-projects.vercel.app", # Current Vercel domain (legacy)
    "https://solbot-frontend.onrender.com",  # Render frontend domain
    "https://*.onrender.com",          # All Render subdomains
    "*"  # Allow all origins temporarily for testing (remove in production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specified frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the main API router
app.include_router(main_api_router)
app.include_router(summary_router)
app.include_router(feedback_style_router)

@app.get("/")
async def root():
    return {"message": "SoL2LBot API is running"}

@app.get("/health")
async def health():
    """Health check endpoint accessible to external monitoring services."""
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8081))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 