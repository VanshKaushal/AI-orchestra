import os
import httpx
from typing import Dict, Any
from app.adapters.base_adapter import BaseAdapter
from app.models.schemas import LLMResponse, LLMProvider
from app.utils.logger import logger


class OllamaAdapter(BaseAdapter):
    """Ollama adapter for local LLM"""

    def __init__(self):
        super().__init__()
        self.provider = LLMProvider.OLLAMA
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "mistral")
        self.max_tokens = 2048

    async def generate(self, prompt: str, context: Dict[str, Any]) -> LLMResponse:
        """Generate a response using Ollama"""
        try:
            headers = {
                "Content-Type": "application/json"
            }

            full_prompt = self._build_prompt(context)

            payload = {
                "model": self.model,
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "num_predict": self.max_tokens,
                    "temperature": 0.7
                }
            }

            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data.get("response", "")
                    
                    # Ollama doesn't provide token counts, estimate based on response length
                    # Roughly 4 characters per token
                    tokens_used = len(content) // 4
                    
                    # Local LLM is free
                    cost = 0.0

                    return LLMResponse(
                        response=content,
                        tokens_used=tokens_used,
                        cost=cost,
                        status="success",
                        provider=self.provider
                    )
                else:
                    error_msg = f"Ollama API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return LLMResponse(
                        response="",
                        tokens_used=0,
                        cost=0.0,
                        status="error",
                        provider=self.provider,
                        error_message=error_msg
                    )

        except httpx.TimeoutException:
            logger.error("Ollama request timed out")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"Ollama error: {str(e)}")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message=str(e)
            )

    def _build_prompt(self, context: Dict[str, Any]) -> str:
        """Build prompt from context"""
        parts = []

        if context.get("system_prompt"):
            parts.append(f"System: {context['system_prompt']}")

        if context.get("conversation_summary"):
            parts.append(f"Conversation summary: {context['conversation_summary']}")

        for msg in context.get("recent_messages", []):
            role = "User" if msg.role.value == "user" else "Assistant"
            parts.append(f"{role}: {msg.content}")

        parts.append(f"User: {context.get('user_input', '')}")
        parts.append("Assistant:")

        return "\n\n".join(parts)

    def _calculate_cost(self, tokens_used: int) -> float:
        """Calculate cost - local LLM is free"""
        return 0.0
