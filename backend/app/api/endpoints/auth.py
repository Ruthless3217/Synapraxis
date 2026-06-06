from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from app.services import db_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class UserAuthRequest(BaseModel):
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")

class AuthResponse(BaseModel):
    status: str
    token: str = ""
    message: str = ""

@router.post("/signup", response_model=AuthResponse)
async def signup(request: UserAuthRequest):
    logger.info(f"Received signup request for email: {request.email}")
    user_id = db_service.create_user(request.email, request.password)
    
    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="A user with this email address already exists."
        )
        
    # Automatically log the user in by creating a session
    token = db_service.create_session(user_id)
    return AuthResponse(status="success", token=token, message="User created successfully.")

@router.post("/login", response_model=AuthResponse)
async def login(request: UserAuthRequest):
    logger.info(f"Received login request for email: {request.email}")
    user_id = db_service.authenticate_user(request.email, request.password)
    
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password."
        )
        
    token = db_service.create_session(user_id)
    return AuthResponse(status="success", token=token, message="Logged in successfully.")

@router.post("/logout")
async def logout(authorization: str = Header(..., description="Bearer token")):
    try:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=400, detail="Invalid authorization header format.")
        token = authorization.split(" ")[1]
        db_service.delete_session(token)
        return {"status": "success", "message": "Logged out successfully."}
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
