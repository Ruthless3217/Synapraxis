from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import logging
import litellm
from litellm import acompletion
from app.api.deps import get_current_user_id

logger = logging.getLogger(__name__)

# Configure LiteLLM settings
litellm.drop_params = True

router = APIRouter()

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    current_topic: str = Field(..., description="The topic currently being studied")
    message: str = Field(..., description="The user's question or statement")
    history: List[ChatMessage] = Field(default=[], description="Previous conversation history")
    provider: Optional[str] = Field(default=None, description="Force a specific LLM provider (gemini, groq, mistral, cohere, claude)")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Tutor's response (2-4 sentences)")

TUTOR_SYSTEM_PROMPT = """You are Synapraxis, a warm, brilliant, and encouraging AI tutor currently teaching a lesson on "{current_topic}". A student has just asked you a question.

Your response rules:
1. Maximum 2-4 sentences — be concise and direct. Students do not want essays.
2. Always anchor your answer to the current lesson topic when relevant.
3. If the concept is abstract, use a micro-analogy (1 sentence max).
4. End with a gentle nudge if the student seems confused or to prompt further thought: "Does that help clarify it?" or similar.
5. If the question is off-topic, answer briefly then redirect: "Great question! Interestingly, this actually connects back to {current_topic} because..."
6. Never say "As an AI..." or "I don't have opinions..." — you ARE Synapraxis, a tutor, not a chatbot.
7. Be warm but not sycophantic. Don't say "Great question!" every single time.
8. If the student is frustrated, acknowledge it first before answering.
"""

def _get_provider_details(provider: str) -> tuple[str, str | None]:
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

def _is_provider_configured(provider: str) -> bool:
    _, api_key = _get_provider_details(provider)
    return bool(api_key and api_key.strip())

@router.post("/tutor", response_model=ChatResponse)
async def tutor_chat(request: ChatRequest, user_id: int = Depends(get_current_user_id)):
    topic = request.current_topic
    user_msg = request.message
    
    system_prompt = TUTOR_SYSTEM_PROMPT.format(current_topic=topic)
    
    preferred = (request.provider or os.getenv("LLM_PROVIDER", "gemini")).lower()
    providers_to_try = []
    
    if _is_provider_configured(preferred):
        providers_to_try.append(preferred)
        
    all_possible = ["gemini", "groq", "mistral", "cohere", "claude"]
    for p in all_possible:
        if p != preferred and _is_provider_configured(p):
            providers_to_try.append(p)
            
    logger.info(f"Configured providers for chat fallback [User: {user_id}]: {providers_to_try}")
    
    for provider in providers_to_try:
        try:
            reply = await _chat_with_litellm(system_prompt, user_msg, request.history, provider)
            return ChatResponse(reply=reply)
        except Exception as e:
            logger.error(f"Chat failed with provider '{provider}': {e}", exc_info=True)
            continue
            
    raise HTTPException(
        status_code=500, 
        detail="All configured LLM providers failed to respond to the tutor request."
    )

async def _chat_with_litellm(system_prompt: str, user_msg: str, history: List[ChatMessage], provider: str) -> str:
    model_name, api_key = _get_provider_details(provider)
    if not api_key:
        raise ValueError(f"API key for provider '{provider}' is not configured.")
        
    logger.info(f"Tutor chat using LiteLLM (provider: {provider}, model: {model_name})")
    
    # Format messages for standard OpenAI format (accepted by LiteLLM)
    messages = [{"role": "system", "content": system_prompt}]
    
    # Limit context history to the last 10 messages to avoid token bloat and latency spikes
    for h in history[-10:]:
        # Map roles to "user" or "assistant"
        role = "assistant" if h.role == "assistant" else "user"
        messages.append({"role": role, "content": h.content})
        
    messages.append({"role": "user", "content": user_msg})
    
    response = await acompletion(
        model=model_name,
        messages=messages,
        temperature=0.5,
        max_tokens=300,
        api_key=api_key
    )
    
    return response.choices[0].message.content.strip()
