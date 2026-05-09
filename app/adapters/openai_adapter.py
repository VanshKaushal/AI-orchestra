import os
import httpx
from typing import Dict, Any
from app.adapters.base_adapter import BaseAdapter
from app.models.schemas import LLMResponse, LLMProvider
from app.utils.logger import logger


class OpenAIAdapter(BaseAdapter):
    """OpenAI adapter using OpenAI API"""

    def __init__(self):
        super().__init__()
        self.provider = LLMProvider.OPENAI
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        
        # Auto-detect OpenRouter keys used in OpenAI slot
        if self.api_key.startswith("sk-or-v1-"):
            self.base_url = "https://openrouter.ai/api/v1"
            logger.info("OpenAI Adapter: OpenRouter key detected, using OpenRouter base URL")
            if self.model.startswith("gpt-"):
                # If they used an OpenRouter key but kept an OpenAI model, 
                # OpenRouter might still support it, but better to log a warning
                logger.warning(f"OpenRouter key used with OpenAI model {self.model}")
        else:
            self.base_url = "https://api.openai.com/v1"
            
        self.max_tokens = 2048
        self.input_price = 0.015  # Default OpenAI pricing
        self.output_price = 0.06

    async def generate(self, prompt: str, context: Dict[str, Any]) -> LLMResponse:
        """Generate a response using OpenAI API"""
        if not self.api_key:
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="OPENAI_API_KEY not set"
            )

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Add OpenRouter specific headers if detected
            if self.api_key.startswith("sk-or-v1-"):
                headers["HTTP-Referer"] = "https://ai-orchestra.com"
                headers["X-Title"] = "AI Orchestra"

            messages = self._build_messages(context)

            payload = {
                "model": self.model,
                "messages": messages,
                "max_tokens": self.max_tokens,
                "temperature": 0.7
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    usage = data.get("usage", {})
                    tokens_used = usage.get("total_tokens", 0)
                    cost = self._calculate_cost(tokens_used)

                    return LLMResponse(
                        response=content,
                        tokens_used=tokens_used,
                        cost=cost,
                        status="success",
                        provider=self.provider
                    )
                else:
                    error_msg = f"OpenAI API error: {response.status_code} - {response.text}"
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
            logger.error("OpenAI request timed out")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"OpenAI error: {str(e)}")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message=str(e)
            )

    def _build_messages(self, context: Dict[str, Any]) -> list:
        """Build messages list from context"""
        messages = []

        if context.get("system_prompt"):
            messages.append({
                "role": "system",
                "content": context["system_prompt"]
            })

        if context.get("conversation_summary"):
            messages.append({
                "role": "system",
                "content": f"Conversation summary: {context['conversation_summary']}"
            })

        for msg in context.get("recent_messages", []):
            messages.append({
                "role": msg.role.value,
                "content": msg.content
            })

        messages.append({
            "role": "user",
            "content": context.get("user_input", "")
        })

        return messages

    def _calculate_cost(self, tokens_used: int) -> float:
        """Calculate cost based on tokens used"""
        return (tokens_used / 1000) * (self.input_price + self.output_price)
