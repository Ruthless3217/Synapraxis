import os
import logging
from fastapi import Header, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.services import db_service

logger = logging.getLogger(__name__)

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "dummy-project-id")

async def get_current_user_id(authorization: str = Header(..., description="Bearer token")) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Must start with Bearer."
        )
    token = authorization.split(" ")[1]
    
    # 1. Try to verify it as a Firebase ID token
    try:
        # A JWT token contains exactly two dots
        if token.count('.') == 2:
            # Note: in a local test scenario with dummy-project-id, verify_oauth2_token might fail.
            # We wrap it and fall back to local session if it fails.
            decoded_token = id_token.verify_oauth2_token(
                token,
                google_requests.Request(),
                audience=FIREBASE_PROJECT_ID
            )
            
            # Verify issuer matches Firebase
            iss = decoded_token.get("iss", "")
            expected_iss = f"https://securetoken.google.com/{FIREBASE_PROJECT_ID}"
            if iss != expected_iss and FIREBASE_PROJECT_ID != "dummy-project-id":
                logger.warning(f"Firebase token issuer mismatch: expected {expected_iss}, got {iss}")
                
            firebase_uid = decoded_token.get("sub")
            email = decoded_token.get("email")
            if not firebase_uid or not email:
                raise HTTPException(status_code=401, detail="Firebase token missing email or UID.")
                
            user_id = db_service.get_or_create_user_by_firebase(firebase_uid, email)
            if not user_id:
                raise HTTPException(status_code=401, detail="Could not retrieve or create user from Firebase token.")
            return user_id
    except Exception as e:
        logger.info(f"Firebase token verification failed or skipped: {e}. Checking local session.")
        
    # 2. Fall back to local SQLite sessions
    user_id = db_service.get_user_id_by_session(token)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session token."
        )
    return user_id
