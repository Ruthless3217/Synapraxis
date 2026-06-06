from fastapi import APIRouter, Depends, Query, HTTPException
import logging
from app.schemas.lesson import LessonResponse
from app.services.lesson_service_interface import ILessonGenerationService
from app.services.lesson_service_simple import SimpleLLMLessonService

logger = logging.getLogger(__name__)

router = APIRouter()

def get_lesson_service() -> ILessonGenerationService:
    """
    Dependency injector for the lesson service.
    This is the EXACT 'easy switch' point where the future Multi-Agent system (LangGraph)
    can be plugged in. When you build the multi-agent system, simply return the
    agentic service here (e.g. based on an environment variable configuration).
    """
    # Future swap example:
    # if os.getenv("BACKEND_MODE") == "agentic":
    #     return MultiAgentLessonService()
    return SimpleLLMLessonService()

@router.get("/generate", response_model=LessonResponse)
async def generate_lesson(
    topic: str = Query(..., description="The subject/topic to learn"),
    level: str = Query("Beginner", description="Difficulty: Beginner | Intermediate | Advanced"),
    age_group: str = Query("Adult", description="Age level: Kids | Teen | Adult | Expert"),
    language: str = Query("English", description="Language of the lesson"),
    service: ILessonGenerationService = Depends(get_lesson_service)
):
    logger.info(f"Received request to generate lesson for topic: '{topic}' [Level: {level}, Age Group: {age_group}]")
    try:
        lesson = await service.generate_lesson(
            topic=topic,
            level=level,
            age_group=age_group,
            language=language
        )
        return lesson
    except Exception as e:
        logger.error(f"Error in generate_lesson endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"An error occurred while generating the lesson: {str(e)}"
        )
