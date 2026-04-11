from abc import ABC, abstractmethod
from typing import Dict, Any
from app.models.schemas import LLMResponse, LLMProvider


class BaseAdapter(ABC):
    """Base class for all LLM adapters"""

    def __init__(self):
        self.provider: LLMProvider = LLMProvider.OPENAI

    @abstractmethod
    async def generate(self, prompt: str, context: Dict[str, Any]) -> LLMResponse:
        """Generate a response from the LLM"""
        pass

    def _calculate_cost(self, tokens_used: int) -> float:
        """Calculate cost based on tokens used"""
        return 0.0
