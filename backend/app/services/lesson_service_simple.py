import os
import json
import logging
from typing import Dict, Any
import litellm
from litellm import acompletion

from app.schemas.lesson import LessonResponse, Concept, QuizQuestion
from app.services.lesson_service_interface import ILessonGenerationService

logger = logging.getLogger(__name__)

# Configure LiteLLM settings
litellm.drop_params = True

SYSTEM_PROMPT = """You are Synapraxis, the world's most knowledgeable and engaging AI tutor. Your teaching style 
combines the clarity of Richard Feynman, the warmth of a great mentor, and the precision 
of an Oxford professor. You can teach any topic on Earth — science, history, mathematics, 
art, music, philosophy, programming, languages, finance, fitness, cooking, or anything else 
a human might want to learn.

RESPONSE FORMAT:
You MUST return ONLY valid JSON matching the requested schema. No markdown fences. No backticks. No preamble. No explanation outside the JSON object.

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

Return ONLY valid JSON matching EXACTLY this schema (no extra fields, no missing fields):

{{
  "title": "string — clean lesson title (not a question)",
  "emoji": "string — single most relevant emoji",
  "subject_tag": "string — one of: Science | Technology | History | Mathematics | Art | Music | Language | Philosophy | Health | Finance | Cooking | Sports | Other",
  "level": "string — Beginner | Intermediate | Advanced",
  "duration": "string — e.g. '8 min read'",
  "hook": "string — 1 sentence surprising fact",
  "introduction": "string — 2-3 sentences referencing the hook",
  "concepts": [
    {{ "icon": "string — single emoji", "name": "string — 2-4 words", "desc": "string — exactly 2 sentences" }}
  ],
  "deep_dive": "string — 3-4 sentences with unexpected insight",
  "example_title": "string — short title",
  "example": "string — 2-3 sentences naming a real product/person/event",
  "has_code": false,
  "code_snippet": "",
  "code_lang": "",
  "analogy": "string — 1 sentence ELI5 analogy",
  "quiz": [
    {{ "question": "string", "options": ["string","string","string","string"], "correct": 0, "explanation": "string" }}
  ],
  "key_takeaways": ["string", "string", "string"],
  "next_topics": ["string", "string", "string"],
  "further_reading": "string — one specific resource + 1 sentence why"
}}

The concepts array must have EXACTLY 4 items. The quiz array must have EXACTLY 3 items. key_takeaways and next_topics must each have EXACTLY 3 items.
Set has_code to true ONLY if the topic is programming/data science/algorithms/web tech, and provide code_snippet and code_lang accordingly. Otherwise set has_code to false and leave code_snippet and code_lang as empty strings.
"""

class SimpleLLMLessonService(ILessonGenerationService):
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "gemini").lower()
        
    def _get_provider_details(self, provider: str) -> tuple[str, str | None]:
        provider = provider.lower()
        if provider == "gemini":
            return os.getenv("GEMINI_MODEL", "gemini/gemini-2.0-flash"), os.getenv("GEMINI_API_KEY")
        elif provider == "groq":
            return os.getenv("GROQ_MODEL", "groq/llama-3.3-70b-versatile"), os.getenv("GROQ_API_KEY")
        elif provider == "mistral":
            return os.getenv("MISTRAL_MODEL", "mistral/mistral-large-latest"), os.getenv("MISTRAL_API_KEY")
        elif provider == "cohere":
            return os.getenv("COHERE_MODEL", "cohere/command-r-plus"), os.getenv("COHERE_API_KEY")
        elif provider == "claude":
            return os.getenv("CLAUDE_MODEL", "anthropic/claude-3-5-sonnet-20241022"), os.getenv("ANTHROPIC_API_KEY")
        else:
            return os.getenv("GEMINI_MODEL", "gemini/gemini-2.0-flash"), os.getenv("GEMINI_API_KEY")

    def _is_provider_configured(self, provider: str) -> bool:
        _, api_key = self._get_provider_details(provider)
        return bool(api_key and api_key.strip())

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
        
        # Determine fallback sequence: start with preferred, then try the others in order
        preferred = self.provider
        providers_to_try = []
        
        if self._is_provider_configured(preferred):
            providers_to_try.append(preferred)
            
        all_possible = ["gemini", "groq", "mistral", "cohere", "claude"]
        for p in all_possible:
            if p != preferred and self._is_provider_configured(p):
                providers_to_try.append(p)
                
        logger.info(f"Configured providers for generation fallback: {providers_to_try}")
        
        for provider in providers_to_try:
            try:
                return await self._generate_with_litellm(provider, user_prompt)
            except Exception as e:
                logger.error(f"Failed to generate lesson with provider '{provider}': {e}", exc_info=True)
                continue
                
        logger.warning("All configured LLM providers failed. Returning static fallback lesson.")
        return self._get_fallback_lesson(topic, level)

    async def _generate_with_litellm(self, provider: str, prompt: str) -> LessonResponse:
        model_name, api_key = self._get_provider_details(provider)
        if not api_key:
            raise ValueError(f"API key for provider '{provider}' is not configured.")
            
        logger.info(f"Generating lesson using LiteLLM (provider: {provider}, model: {model_name})")
        
        kwargs = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "api_key": api_key
        }
        
        # Enable structured/JSON output for providers supporting it
        # Anthropic claude doesn't support json_object natively without tools, so we omit for it
        if provider != "claude":
            kwargs["response_format"] = {"type": "json_object"}
            
        response = await acompletion(**kwargs)
        response_text = response.choices[0].message.content.strip()
        
        # Clean potential markdown code fences
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
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
