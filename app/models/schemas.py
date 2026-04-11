from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    GEMINI = "gemini"
    GROK = "grok"


class Message(BaseModel):
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    provider: Optional[LLMProvider] = None
    tokens_used: Optional[int] = None
    cost: Optional[float] = None


class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"
    force_provider: Optional[LLMProvider] = None


class ChatResponse(BaseModel):
    response: str
    provider: LLMProvider
    tokens_used: int
    cost: float
    fallback_triggered: bool = False
    fallback_from: Optional[LLMProvider] = None
    switch_reason: Optional[str] = None


class LLMResponse(BaseModel):
    response: str
    tokens_used: int
    cost: float
    status: str
    provider: LLMProvider
    error_message: Optional[str] = None


class ConversationContext(BaseModel):
    system_prompt: str = ""
    conversation_summary: str = ""
    recent_messages: List[Message] = Field(default_factory=list)
    user_input: str = ""


class UsageStats(BaseModel):
    provider: LLMProvider
    tokens_used: int = 0
    total_cost: float = 0.0
    failures: int = 0
    success_count: int = 0
