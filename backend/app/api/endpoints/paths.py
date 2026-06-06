import os
import json
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import litellm
from litellm import acompletion
from app.services import db_service

logger = logging.getLogger(__name__)

router = APIRouter()

# Configure LiteLLM settings
litellm.drop_params = True

class PathStep(BaseModel):
    order: int
    topic: str
    desc: str
    status: str # 'completed' | 'active' | 'pending'

class CreatePathRequest(BaseModel):
    query: str = Field(..., description="The learning path topic query")
    provider: Optional[str] = Field(default=None, description="Preferred LLM provider")

class PathResponse(BaseModel):
    id: int
    title: str
    query: str
    steps: List[PathStep]
    current_step: int

class StepStatusUpdateRequest(BaseModel):
    step_order: int
    status: str

# System prompt for learning paths
PATH_SYSTEM_PROMPT = """You are Synapraxis, a world-class academic curriculum architect. Your job is to design a highly structured, logical, and engaging 5-step learning path for the given topic.

RESPONSE FORMAT:
You MUST return ONLY valid JSON matching this schema:
{
  "title": "A clear, compelling title for the path (not a question)",
  "steps": [
    {
      "order": 1,
      "topic": "Clean topic name for Step 1",
      "desc": "1-2 sentences overview of what they will master in this step."
    },
    ...
  ]
}

The steps array must have EXACTLY 5 items. Make sure each step builds logically on the previous.
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

@router.post("/generate", response_model=PathResponse)
async def generate_path(request: CreatePathRequest):
    query = request.query
    
    preferred = (request.provider or os.getenv("LLM_PROVIDER", "gemini")).lower()
    providers_to_try = []
    if _is_provider_configured(preferred):
        providers_to_try.append(preferred)
        
    all_possible = ["gemini", "groq", "mistral", "cohere", "claude"]
    for p in all_possible:
        if p != preferred and _is_provider_configured(p):
            providers_to_try.append(p)
            
    logger.info(f"Roadmap generation providers: {providers_to_try}")
    
    response_json = None
    for provider in providers_to_try:
        try:
            model_name, api_key = _get_provider_details(provider)
            
            kwargs = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": PATH_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Design a learning path for: '{query}'"}
                ],
                "temperature": 0.3,
                "api_key": api_key
            }
            if provider != "claude":
                kwargs["response_format"] = {"type": "json_object"}
                
            response = await acompletion(**kwargs)
            response_text = response.choices[0].message.content.strip()
            
            # Clean markdown code fences
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            response_json = json.loads(response_text)
            break
        except Exception as e:
            logger.error(f"Failed to generate path with {provider}: {e}")
            continue
            
    if not response_json:
        # Static fallback path if all else fails
        response_json = {
            "title": f"Pathways to {query}",
            "steps": [
                {"order": 1, "topic": f"Introduction to {query}", "desc": "Establish basic vocabulary and overview concepts."},
                {"order": 2, "topic": f"Core Foundations of {query}", "desc": "Gain deep understanding of mechanical principles."},
                {"order": 3, "topic": f"Intermediate Applications of {query}", "desc": "Examine implementation schemas and workflows."},
                {"order": 4, "topic": f"Advanced Mechanics of {query}", "desc": "Acknowledge caveats, paradoxes, and edge behaviors."},
                {"order": 5, "topic": f"Capston synthesis project", "desc": "Synthesize learning blocks into a completed case study."}
            ]
        }
        
    # Standardize statuses
    steps = []
    for s in response_json["steps"]:
        steps.append({
            "order": s["order"],
            "topic": s["topic"],
            "desc": s["desc"],
            "status": "active" if s["order"] == 1 else "pending"
        })
        
    # Save path in DB
    path_id = db_service.create_learning_path(response_json["title"], query, steps)
    
    return PathResponse(
        id=path_id,
        title=response_json["title"],
        query=query,
        steps=steps,
        current_step=1
    )

@router.get("/all", response_model=List[PathResponse])
async def get_all_paths():
    try:
        paths = db_service.get_learning_paths()
        return [
            PathResponse(
                id=p["id"],
                title=p["title"],
                query=p["query"],
                steps=p["steps"],
                current_step=p["current_step"]
            )
            for p in paths
        ]
    except Exception as e:
        logger.error(f"Error getting paths: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{path_id}", response_model=PathResponse)
async def get_path(path_id: int):
    try:
        p = db_service.get_learning_path_by_id(path_id)
        if not p:
            raise HTTPException(status_code=404, detail="Path not found")
        return PathResponse(
            id=p["id"],
            title=p["title"],
            query=p["query"],
            steps=p["steps"],
            current_step=p["current_step"]
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting path details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{path_id}/step", response_model=List[PathStep])
async def update_step_status(path_id: int, request: StepStatusUpdateRequest):
    try:
        steps = db_service.update_path_step_status(path_id, request.step_order, request.status)
        if not steps:
            raise HTTPException(status_code=404, detail="Path not found")
        
        # Determine next active step if step was completed
        if request.status == "completed":
            conn = db_service.get_db_connection()
            cursor = conn.cursor()
            
            # Find next pending step order
            next_step = request.step_order + 1
            cursor.execute("SELECT steps FROM learning_paths WHERE id = ?", (path_id,))
            row = cursor.fetchone()
            
            if row:
                path_steps = json.loads(row["steps"])
                for s in path_steps:
                    if s["order"] == next_step:
                        s["status"] = "active"
                
                cursor.execute(
                    "UPDATE learning_paths SET steps = ?, current_step = ? WHERE id = ?",
                    (json.dumps(path_steps), next_step, path_id)
                )
                conn.commit()
                steps = path_steps
            conn.close()
            
        return [
            PathStep(
                order=s["order"],
                topic=s["topic"],
                desc=s["desc"],
                status=s["status"]
            )
            for s in steps
        ]
    except Exception as e:
        logger.error(f"Error updating step status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{path_id}/activate")
async def activate_path(path_id: int):
    try:
        conn = db_service.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE user_profile SET active_path_id = ? WHERE id = 1", (path_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error activating path: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
