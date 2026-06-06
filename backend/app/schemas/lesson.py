from pydantic import BaseModel, Field
from typing import List, Optional

class Concept(BaseModel):
    icon: str = Field(..., description="Single emoji representing the concept")
    name: str = Field(..., description="Concept name (2-4 words)")
    desc: str = Field(..., description="Exactly 2 sentences. First sentence: what it is. Second: why it matters or how it connects.")

class QuizQuestion(BaseModel):
    question: str = Field(..., description="Tests conceptual understanding, not trivia")
    options: List[str] = Field(..., description="Exactly 4 options")
    correct: int = Field(..., description="0-3 index of the correct option")
    explanation: str = Field(..., description="1-2 sentences explaining why the correct answer is right")

class LessonResponse(BaseModel):
    title: str = Field(..., description="Clean lesson title (not a question)")
    emoji: str = Field(..., description="Single most relevant emoji")
    subject_tag: str = Field(..., description="One of: Science | Technology | History | Mathematics | Art | Music | Language | Philosophy | Health | Finance | Cooking | Sports | Other")
    level: str = Field(..., description="Beginner | Intermediate | Advanced")
    duration: str = Field(..., description="e.g. '8 min read' or '12 min read'")
    hook: str = Field(..., description="1 sentence. The most surprising or counterintuitive fact about this topic. Must make the reader go 'wait, really?'")
    introduction: str = Field(..., description="2-3 sentences. Must reference the hook in the first or second sentence. Set up why this topic matters.")
    concepts: List[Concept] = Field(..., description="Exactly 4 concepts, building in logical order")
    deep_dive: str = Field(..., description="3-4 sentences. Go beyond surface level. Include a mechanism, a paradox, an unexpected connection, or a frontier insight.")
    example_title: str = Field(..., description="Short title for the real-world example")
    example: str = Field(..., description="2-3 sentences. Specific, named real-world application. Not generic. Name an actual product, person, event, or place.")
    has_code: bool = Field(..., description="True ONLY if the topic is programming, data science, algorithms, or web tech")
    code_snippet: str = Field(..., description="If has_code, a clean 5-15 line runnable example with inline comments. Empty string otherwise.")
    code_lang: str = Field(..., description="Language name if has_code. Empty string otherwise.")
    analogy: str = Field(..., description="1 sentence. The best possible ELI5 analogy for the entire topic. Should make someone go 'oh NOW I get it'.")
    quiz: List[QuizQuestion] = Field(..., description="Exactly 3 questions, increasing in difficulty")
    key_takeaways: List[str] = Field(..., description="Exactly 3 items. Each is a complete, standalone insight. No vague phrases.")
    next_topics: List[str] = Field(..., description="Exactly 3 natural follow-on topics the learner should explore next")
    further_reading: str = Field(..., description="One specific book title, article, paper, or resource + 1 sentence on why it's the best next step")
