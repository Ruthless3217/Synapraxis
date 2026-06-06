from abc import ABC, abstractmethod
from app.schemas.lesson import LessonResponse

class ILessonGenerationService(ABC):
    @abstractmethod
    async def generate_lesson(
        self, 
        topic: str, 
        level: str, 
        age_group: str, 
        language: str = "English"
    ) -> LessonResponse:
        """
        Generate a structured lesson for the given topic, level, and age group.
        """
        pass
