from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import logging
from app.services import db_service
from app.api.deps import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()

class ProfileResponse(BaseModel):
    xp: int
    streak: int
    daily_concepts_completed: int
    active_path_id: Optional[int]
    recent_lessons: List[Dict[str, Any]]

class ConceptCompleteRequest(BaseModel):
    topic: str
    concept_name: str

class QuizSubmitRequest(BaseModel):
    topic: str
    score: int

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: int = Depends(get_current_user_id)):
    try:
        profile = db_service.get_user_profile(user_id)
        recent = db_service.get_lessons_history(user_id)
        
        return ProfileResponse(
            xp=profile["xp"],
            streak=profile["streak"],
            daily_concepts_completed=profile["daily_concepts_completed"],
            active_path_id=profile["active_path_id"],
            recent_lessons=recent[:5] # Return top 5 recent lessons
        )
    except Exception as e:
        logger.error(f"Error getting profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/concept-complete")
async def complete_concept(request: ConceptCompleteRequest, user_id: int = Depends(get_current_user_id)):
    try:
        completed = db_service.update_concept_completion(user_id, request.topic, request.concept_name)
        profile = db_service.get_user_profile(user_id)
        return {
            "status": "success",
            "completed_concepts": completed,
            "xp": profile["xp"],
            "streak": profile["streak"],
            "daily_concepts_completed": profile["daily_concepts_completed"]
        }
    except Exception as e:
        logger.error(f"Error completing concept: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz-submit")
async def submit_quiz_score(request: QuizSubmitRequest, user_id: int = Depends(get_current_user_id)):
    try:
        db_service.update_quiz_score(user_id, request.topic, request.score)
        profile = db_service.get_user_profile(user_id)
        return {
            "status": "success",
            "xp": profile["xp"],
            "streak": profile["streak"]
        }
    except Exception as e:
        logger.error(f"Error submitting quiz score: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
