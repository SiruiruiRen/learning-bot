from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import sys
import logging
from dotenv import load_dotenv
import datetime

# Add the project root to the Python path to fix imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Try to import the keep_warm module
try:
    from backend.utils.keep_warm import start_warmup_thread
except ImportError:
    try:
        from utils.keep_warm import start_warmup_thread
    except ImportError:
        # Define a dummy function if the module can't be imported
        def start_warmup_thread():
            print("Warmup module not found, skipping...")

# Try to import using both styles to ensure compatibility
try:
    # First try relative imports (works when running from project root)
    from backend.routes.chat import router as chat_router
    from backend.routes.user import router as user_router
    from backend.routes.scores import router as scores_router
    from backend.utils.db import init_db, close_db
except ImportError:
    # Fallback to direct imports (works when running directly in backend dir)
    from routes.chat import router as chat_router
    from routes.user import router as user_router
    from routes.scores import router as scores_router
    from utils.db import init_db, close_db

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("solbot")

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