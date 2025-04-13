from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
import sys
import logging
from dotenv import load_dotenv

# Add the project root to the Python path to fix imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8081))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True) 