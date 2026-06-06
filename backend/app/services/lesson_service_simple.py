import os
import json
import logging
from typing import Dict, Any
from google.generativeai import GenerativeModel
import google.generativeai as genai
from anthropic import Anthropic

from app.schemas.lesson import LessonResponse, Concept, QuizQuestion
from app.services.lesson_service_interface import ILessonGenerationService

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Synapraxis, the world's most knowledgeable and engaging AI tutor. Your teaching style 
combines the clarity of Richard Feynman, the warmth of a great mentor, and the precision 
of an Oxford professor. You can teach any topic on Earth — science, history, mathematics, 
art, music, philosophy, programming, languages, finance, fitness, cooking, or anything else 
a human might want to learn.

RESPONSE FORMAT:
You MUST return ONLY valid JSON matching the requested schema. No markdown fences. No preamble. No explanation outside the JSON object.

TEACHING PHILOSOPHY:
- Every lesson must open with a "hook" — something surprising, counterintuitive, or 
  awe-inspiring about the topic that makes the learner lean forward.
- The deep_dive must contain at least one fact the user would never have expected.
- Concepts must build on each other logically — each one unlocking the next.
- Use concrete, vivid language — no abstract filler. Every sentence must teach something.
- The analogy field must make the entire topic click in one sentence (ELI5 quality).

ADAPTIVE DIFFICULTY:
- Kids/Beginner: everyday analogies, zero jargon, simple sentence structure, relatable examples from daily life.
- Teen/Intermediate: introduce terminology with immediate definitions, build mental models, connect to things they care about (games, social media, sports).
- Adult/Advanced: precise language, acknowledge nuance, reference mechanisms not just outcomes.
- Expert: use field-standard terminology, include caveats and edge cases, reference foundational papers or thinkers where relevant.

QUALITY GATES — every lesson must pass all of these:
1. Hook is genuinely surprising (not just "X is important because...").
2. Introduction references the hook naturally.
3. All 4 concepts are distinct (no overlap).
4. Deep dive goes beyond what a Wikipedia intro would say.
5. Example is concrete and specific (not "X is used in many industries"). Name an actual product, person, event, or place.
6. Quiz questions test conceptual understanding, not trivia or rote memorization.
7. Next topics flow naturally from the lesson.
"""

USER_PROMPT_TEMPLATE = """Generate a comprehensive, engaging lesson on: "{topic}"

Learner profile:
- Age group: {age_group}   // Kids (6-12) | Teen (13-17) | Adult (18+) | Expert
- Level: {level}           // Beginner | Intermediate | Advanced
- Language: {language}     // default: English

Return JSON matching the schema parameters.
"""

class SimpleLLMLessonService(ILessonGenerationService):
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        
        # Initialize Anthropic if key exists
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            self.anthropic_client = Anthropic(api_key=anthropic_key)
        else:
            self.anthropic_client = None
            
        # Initialize Gemini if key exists
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            genai.configure(api_key=gemini_key)
            
    async def generate_lesson(
        self, 
        topic: str, 
        level: str, 
        age_group: str, 
        language: str = "English"
    ) -> LessonResponse:
        user_prompt = USER_PROMPT_TEMPLATE.format(
            topic=topic,
            level=level,
            age_group=age_group,
            language=language
        )
        
        try:
            if self.provider == "gemini":
                return await self._generate_with_gemini(user_prompt)
            elif self.provider == "claude" and self.anthropic_client:
                return await self._generate_with_claude(user_prompt)
            else:
                # Fallback to Gemini if Claude is chosen but key is missing, and vice versa
                if self.anthropic_client:
                    return await self._generate_with_claude(user_prompt)
                else:
                    return await self._generate_with_gemini(user_prompt)
        except Exception as e:
            logger.error(f"Failed to generate lesson from LLM: {e}", exc_info=True)
            return self._get_fallback_lesson(topic, level)

    async def _generate_with_gemini(self, prompt: str) -> LessonResponse:
        # Use gemini-1.5-pro or gemini-2.5-flash as available
        model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
        
        # Native structured JSON output using Pydantic schema!
        model = GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": LessonResponse,
                "temperature": 0.2,
            }
        )
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Parse output and validate with Pydantic
        lesson_data = json.loads(response_text)
        return LessonResponse(**lesson_data)

    async def _generate_with_claude(self, prompt: str) -> LessonResponse:
        model_name = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
        
        response = self.anthropic_client.messages.create(
            model=model_name,
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        
        response_text = response.content[0].text.strip()
        
        # Strip potential markdown code fences if LLM included them
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        lesson_data = json.loads(response_text)
        return LessonResponse(**lesson_data)

    def _get_fallback_lesson(self, topic: str, level: str) -> LessonResponse:
        logger.warning(f"Returning fallback lesson for topic: {topic}")
        return LessonResponse(
            title=f"Exploring {topic}",
            emoji="🏫",
            subject_tag="Other",
            level=level,
            duration="5 min read",
            hook=f"Did you know that {topic} is a subject of fascinating complexity and study?",
            introduction=f"Welcome to this introductory session on {topic}. Today we will explore some of its core concepts.",
            concepts=[
                Concept(icon="🧠", name="Core Foundations", desc=f"Understanding the core principles of {topic} is essential. This forms the basis of all practical applications."),
                Concept(icon="🔍", name="Detailed Analysis", desc=f"We break down the mechanisms driving {topic}. Investigating how elements interact reveals deeper structures."),
                Concept(icon="⚙️", name="Practical Integration", desc=f"Applying {topic} in daily life or industry shows its true utility. Theory meets practice in creative ways."),
                Concept(icon="🚀", name="Future Horizons", desc=f"Where is {topic} heading next? Looking at frontier research helps prepare us for future developments.")
            ],
            deep_dive=f"Going beneath the surface, {topic} presents unique questions and challenges that researchers are actively resolving. Studying these reveals deep insights.",
            example_title="Real-World Example",
            example=f"Many leading institutions use concepts of {topic} to optimize their operations and spark innovation.",
            has_code=False,
            code_snippet="",
            code_lang="",
            analogy=f"{topic} is like a map: it guides you through complex terrain by organizing information logically.",
            quiz=[
                QuizQuestion(
                    question=f"What is the primary goal of studying {topic}?",
                    options=["To build foundational understanding", "To ignore details", "To memorize facts", "None of the above"],
                    correct=0,
                    explanation="Foundational understanding allows you to apply concepts creatively to new problems."
                ),
                QuizQuestion(
                    question=f"How does {topic} apply to the real world?",
                    options=["Only theoretically", "In practical applications and industry", "It doesn't apply", "None of the above"],
                    correct=1,
                    explanation="Almost all concepts have real-world applications that solve actual problems."
                ),
                QuizQuestion(
                    question="Why is mastery-based learning important?",
                    options=["It is faster", "It ensures you build on solid foundations", "It is easier", "It is optional"],
                    correct=1,
                    explanation="Mastery prevents knowledge gaps from compounding as you study advanced concepts."
                )
            ],
            key_takeaways=[
                f"Understanding the foundations of {topic} is crucial.",
                "Real-world application bridges the gap between theory and practice.",
                "Mastery-based progression is key to long-term success."
            ],
            next_topics=[f"Advanced {topic}", "Practical Applications", "Case Studies"],
            further_reading="Foundations of Learning: A Comprehensive Guide - A great book on structured studying."
        )
