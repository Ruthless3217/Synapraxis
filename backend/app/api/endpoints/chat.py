from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import os
import logging
from google.generativeai import GenerativeModel
import google.generativeai as genai
from anthropic import Anthropic

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    current_topic: str = Field(..., description="The topic currently being studied")
    message: str = Field(..., description="The user's question or statement")
    history: List[ChatMessage] = Field(default=[], description="Previous conversation history")

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

@router.post("/tutor", response_model=ChatResponse)
async def tutor_chat(request: ChatRequest):
    topic = request.current_topic
    user_msg = request.message
    
    system_prompt = TUTOR_SYSTEM_PROMPT.format(current_topic=topic)
    
    provider = os.getenv("LLM_PROVIDER", "gemini").lower()
    
    try:
        if provider == "gemini":
            reply = await _chat_with_gemini(system_prompt, user_msg, request.history)
        else:
            # Fallback/Default to Claude if configured and available
            anthropic_key = os.getenv("ANTHROPIC_API_KEY")
            if anthropic_key:
                reply = await _chat_with_claude(system_prompt, user_msg, request.history, anthropic_key)
            else:
                reply = await _chat_with_gemini(system_prompt, user_msg, request.history)
                
        return ChatResponse(reply=reply)
        
    except Exception as e:
        logger.error(f"Error in tutor_chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Tutor failed to respond: {str(e)}")

async def _chat_with_gemini(system_prompt: str, user_msg: str, history: List[ChatMessage]) -> str:
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Simple direct API model call with system instruction
    model = GenerativeModel(
        model_name=model_name,
        system_instruction=system_prompt,
        generation_config={"temperature": 0.5, "max_output_tokens": 300}
    )
    
    # We can format the history and query
    prompt_parts = []
    for h in history:
        prefix = "Student: " if h.role == "user" else "Synapraxis: "
        prompt_parts.append(f"{prefix}{h.content}")
    
    prompt_parts.append(f"Student: {user_msg}")
    full_prompt = "\n".join(prompt_parts)
    
    response = model.generate_content(full_prompt)
    return response.text.strip()

async def _chat_with_claude(system_prompt: str, user_msg: str, history: List[ChatMessage], api_key: str) -> str:
    client = Anthropic(api_key=api_key)
    model_name = os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022")
    
    # Format messages for Anthropic API
    messages = []
    for h in history:
        # Anthropic roles must be "user" or "assistant"
        role = "user" if h.role == "user" else "assistant"
        messages.append({"role": role, "content": h.content})
        
    messages.append({"role": "user", "content": user_msg})
    
    response = client.messages.create(
        model=model_name,
        max_tokens=300,
        system=system_prompt,
        messages=messages,
        temperature=0.5
    )
    
    return response.content[0].text.strip()
