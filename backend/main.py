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
        from backend.routes.chat import router as chat_router
        from backend.routes.user import router as user_router
        from backend.routes.scores import router as scores_router
        from backend.routes.user_data import router as user_data_router
        from backend.utils.db import init_db, close_db
        logger.info("Successfully imported modules from backend package")
    except ImportError as e:
        logger.info(f"Backend package import failed: {e}, trying direct import...")
        # If that fails, try direct import (running from backend dir)
        from utils.keep_warm import start_warmup_thread
        from routes.chat import router as chat_router
        from routes.user import router as user_router
        from routes.scores import router as scores_router
        from routes.user_data import router as user_data_router
        from utils.db import init_db, close_db
        logger.info("Successfully imported modules directly")
except Exception as e:
    logger.error(f"All import attempts failed: {e}")
    # Define dummy functions if imports fail
    def start_warmup_thread():
        logger.warning("Using dummy warmup thread function")
    def init_db():
        logger.warning("Using dummy init_db function")
    def close_db():
        logger.warning("Using dummy close_db function")
    # But we still need routers, so raise the error
    raise

# Startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize resources
    logger.info("SoLBot backend starting up...")
    init_db()
    logger.info("Database initialized")
    logger.info("Using simplified direct LLM architecture")
    
    # Start the warmup thread to keep the service from sleeping
    if os.environ.get("ENABLE_WARMUP", "true").lower() == "true":
        logger.info("Starting warmup service...")
        start_warmup_thread()
    
    yield
    # Shutdown: cleanup resources
    logger.info("SoLBot backend shutting down...")
    close_db()

# Initialize FastAPI
app = FastAPI(
    title="SoLBot API",
    description="Backend API for SoLBot self-regulated learning platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [
    "http://localhost:3000",          # Local development
    "http://localhost:3004",          # Local development alternate port
    "https://sol-bot-seven.vercel.app", # Vercel domain
    "https://learning-bot.vercel.app",   # Alternate Vercel domain
    "https://solbot.vercel.app",         # Another possible Vercel domain
    "https://sol-kfr2d09v1-rensirui-uncedus-projects.vercel.app", # Current Vercel domain
    "*"  # Allow all origins temporarily for testing
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Specified frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)  # Remove prefix for the chat router, as it already has tags
app.include_router(user_router, prefix="/api/user", tags=["user"])
app.include_router(scores_router, prefix="/api/scores", tags=["scores"])
app.include_router(user_data_router, prefix="/api/user-data", tags=["user_data"])

@app.get("/")
async def root():
    return {"message": "SoLBot API is running"}

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