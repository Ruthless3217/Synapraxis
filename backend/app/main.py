from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import logging
import os

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)

# Import API routers
from app.api.endpoints import lesson, chat, user, paths, auth

app = FastAPI(
    title="Synapraxis AI API",
    description="Backend API for Synapraxis: AI-Powered Personal Learning Platform",
    version="1.0.0"
)

class FirebasePrefixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path.startswith("/_/backend"):
                new_path = path[len("/_/backend"):]
                if not new_path.startswith("/"):
                    new_path = "/" + new_path
                scope["path"] = new_path
                
                if "raw_path" in scope:
                    raw_path = scope["raw_path"]
                    new_raw = raw_path[len(b"/_/backend"):]
                    if not new_raw.startswith(b"/"):
                        new_raw = b"/" + new_raw
                    scope["raw_path"] = new_raw
        await self.app(scope, receive, send)

app.add_middleware(FirebasePrefixMiddleware)

@app.on_event("startup")
def on_startup():
    from app.services.db_service import init_db
    init_db()

# Tighten CORS origins (Option A)
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_str:
    allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
else:
    # Default to common frontend ports (Vite dev, Docker deploy)
    allowed_origins = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(lesson.router, prefix="/api/lesson", tags=["Lesson"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(paths.router, prefix="/api/path", tags=["Learning Path"])

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
