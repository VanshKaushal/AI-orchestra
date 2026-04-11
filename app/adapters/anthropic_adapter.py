import os
import httpx
from typing import Dict, Any
from app.adapters.base_adapter import BaseAdapter
from app.models.schemas import LLMResponse, LLMProvider
from app.utils.logger import logger


class AnthropicAdapter(BaseAdapter):
    """Anthropic adapter using Claude API"""

    def __init__(self):
        super().__init__()
        self.provider = LLMProvider.ANTHROPIC
        self.api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")
        self.base_url = "https://api.anthropic.com/v1"
        self.max_tokens = 1024

        # Pricing per 1K tokens (approximate)
        self.input_price = 0.00025
        self.output_price = 0.00125

    async def generate(self, prompt: str, context: Dict[str, Any]) -> LLMResponse:
        """Generate a response using Anthropic API"""
        if not self.api_key:
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="ANTHROPIC_API_KEY not set"
            )

        try:
            headers = {
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json"
            }

            full_prompt = self._build_prompt(context)

            payload = {
                "model": self.model,
                "max_tokens": self.max_tokens,
                "messages": [
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ]
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["content"][0]["text"]
                    usage = data.get("usage", {})
                    tokens_used = usage.get("input_tokens", 0) + usage.get("output_tokens", 0)
                    cost = self._calculate_cost(tokens_used)

                    return LLMResponse(
                        response=content,
                        tokens_used=tokens_used,
                        cost=cost,
                        status="success",
                        provider=self.provider
                    )
                else:
                    error_msg = f"Anthropic API error: {response.status_code} - {response.text}"
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
            logger.error("Anthropic request timed out")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"Anthropic error: {str(e)}")
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
            role = "Human" if msg.role.value == "user" else "Assistant"
            parts.append(f"{role}: {msg.content}")

        parts.append(f"Human: {context.get('user_input', '')}")
        parts.append("Assistant:")

        return "\n\n".join(parts)

    def _calculate_cost(self, tokens_used: int) -> float:
        """Calculate cost based on tokens used"""
        return (tokens_used / 1000) * (self.input_price + self.output_price)
