from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class GlobalState(BaseModel):
    goal: str = ""
    global_summary: str = ""
    decisions: List[str] = []
    open_tasks: List[str] = []
    style: dict = {
        "tone": "professional",
        "depth": "detailed"
    }
    last_updated: datetime = datetime.now()


class SessionState(BaseModel):
    session_id: str
    task: str
    model: str = "ollama"
    local_summary: str = ""
    status: str = "waiting"
    created_at: datetime = datetime.now()
    messages: List[dict] = []


class LLMResponse(BaseModel):
    response: str
    status: str = "success"
    model: str
    tokens_used: int = 0
    raw_response: Optional[dict] = None


class ChatMessage(BaseModel):
    session_id: str
    message: str
    role: str = "user"


class SessionCreate(BaseModel):
    task: str
    model: Optional[str] = "ollama"