from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)

# Import API routers
from app.api.endpoints import lesson, chat, user, paths

app = FastAPI(
    title="Synapraxis AI API",
    description="Backend API for Synapraxis: AI-Powered Personal Learning Platform",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    from app.services.db_service import init_db
    init_db()

# Enable CORS for the frontend Vite development server (usually http://localhost:5173 or * for safety in local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Synapraxis AI API",
        "version": "1.0.0"
    }

# Include routers
app.include_router(lesson.router, prefix="/api/lesson", tags=["Lesson"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(paths.router, prefix="/api/path", tags=["Learning Path"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
