from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
import logging
from app.schemas.lesson import LessonResponse
from app.services.lesson_service_interface import ILessonGenerationService
from app.services.lesson_service_simple import SimpleLLMLessonService
from app.services import db_service
from app.services.cache_service import cache_service
from app.api.deps import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()

def get_lesson_service() -> ILessonGenerationService:
    """
    Dependency injector for the lesson service.
    This is the EXACT 'easy switch' point where the future Multi-Agent system (LangGraph)
    can be plugged in. When you build the multi-agent system, simply return the
    agentic service here (e.g. based on an environment variable configuration).
    """
    return SimpleLLMLessonService()

@router.get("/generate")
async def generate_lesson(
    topic: str = Query(..., description="The subject/topic to learn"),
    level: str = Query("Beginner", description="Difficulty: Beginner | Intermediate | Advanced"),
    age_group: str = Query("Adult", description="Age level: Kids | Teen | Adult | Expert"),
    language: str = Query("English", description="Language of the lesson"),
    provider: Optional[str] = Query(None, description="Force a specific LLM provider (gemini, groq, mistral, cohere, claude)"),
    service: ILessonGenerationService = Depends(get_lesson_service),
    user_id: int = Depends(get_current_user_id)
):
    topic_clean = topic.strip()
    logger.info(f"Received request to generate lesson for topic: '{topic_clean}' [User: {user_id}, Level: {level}, Age Group: {age_group}, Provider: {provider}]")
    
    try:
        # 1. Check SQLite database history first (retains progress, completed concepts, quiz scores)
        existing = db_service.get_lesson_data(user_id, topic_clean)
        if existing and existing.get("level") == level and existing.get("age_group") == age_group:
            logger.info(f"Returning persisted lesson from SQLite for: '{topic_clean}'")
            return existing
            
        # 2. Check Redis/In-memory cache
        cache_key = f"lesson:{topic_clean.lower()}:{level.lower()}:{age_group.lower()}:{language.lower()}"
        cached = cache_service.get(cache_key)
        if cached:
            logger.info(f"Returning cached lesson from Redis/Memory cache for: '{topic_clean}'")
            # Save to SQLite history for this user
            db_service.add_lesson_to_history(
                user_id=user_id,
                topic=topic_clean,
                title=cached["title"],
                emoji=cached["emoji"],
                subject_tag=cached["subject_tag"],
                level=level,
                age_group=age_group,
                duration=cached["duration"],
                lesson_data=cached
            )
            return cached
            
        # 3. Generate from LLM
        lesson = await service.generate_lesson(
            topic=topic_clean,
            level=level,
            age_group=age_group,
            language=language,
            provider=provider
        )
        
        lesson_dict = lesson.dict()
        
        # Save to SQLite history
        db_service.add_lesson_to_history(
            user_id=user_id,
            topic=topic_clean,
            title=lesson.title,
            emoji=lesson.emoji,
            subject_tag=lesson.subject_tag,
            level=level,
            age_group=age_group,
            duration=lesson.duration,
            lesson_data=lesson_dict
        )
        
        # Save to Redis/In-memory cache
        cache_service.set(cache_key, lesson_dict)
        
        return lesson
        
    except Exception as e:
        logger.error(f"Error in generate_lesson endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred while generating the lesson: {str(e)}"
        )
