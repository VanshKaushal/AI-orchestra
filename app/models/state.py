from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ConversationStyle(BaseModel):
    tone: str = "helpful"
    depth: str = "standard"


class ConversationState(BaseModel):
    goal: str = ""
    context_summary: str = ""
    decisions: List[str] = []
    open_tasks: List[str] = []
    last_user_intent: str = ""
    conversation_style: ConversationStyle = ConversationStyle()
    updated_at: datetime = datetime.now()


class StateUpdate(BaseModel):
    goal: Optional[str] = None
    context_summary: Optional[str] = None
    decisions: Optional[List[str]] = None
    open_tasks: Optional[List[str]] = None
    last_user_intent: Optional[str] = None
    tone: Optional[str] = None
    depth: Optional[str] = None