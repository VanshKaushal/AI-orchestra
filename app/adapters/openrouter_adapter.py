import os
import httpx
from typing import Dict, Any
from app.adapters.base_adapter import BaseAdapter
from app.models.schemas import LLMResponse, LLMProvider
from app.utils.logger import logger


class OpenRouterAdapter(BaseAdapter):
    """OpenRouter adapter using OpenAI-compatible API"""

    def __init__(self):
        super().__init__()
        self.provider = LLMProvider.OPENROUTER
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        # Updated to Gemma 7B which is very reliable on OpenRouter free tier
        self.model = os.getenv("OPENROUTER_MODEL", "google/gemma-7b-it:free")
        self.base_url = "https://openrouter.ai/api/v1"
        self.max_tokens = 2048

        # Fallback models for free tier
        self.fallback_models = [
            "google/gemma-7b-it:free",
            "google/gemma-7b-it",
            "google/gemma-2-9b-it:free",
            "google/gemma-2-9b-it",
            "mistralai/mistral-7b-instruct:free",
            "mistralai/mistral-7b-instruct",
            "meta-llama/llama-3-8b-instruct:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "microsoft/phi-3-mini-128k-instruct:free",
            "qwen/qwen-2-7b-instruct:free",
            "open-orca/mistral-7b-openorca:free",
            "huggingfaceh4/zephyr-7b-beta:free"
        ]

        # Pricing for free models is 0
        self.input_price = 0.0
        self.output_price = 0.0

    async def generate(self, prompt: str, context: Dict[str, Any]) -> LLMResponse:
        """Generate a response using OpenRouter API"""
        if not self.api_key:
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="OPENROUTER_API_KEY not set"
            )

        models_to_try = [self.model] + [m for m in self.fallback_models if m != self.model]
        
        last_error = ""
        for model_name in models_to_try:
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://ai-orchestra.com", 
                    "X-Title": "AI Orchestra"
                }

                messages = self._build_messages(context)

                payload = {
                    "model": model_name,
                    "messages": messages,
                    "max_tokens": self.max_tokens,
                    "temperature": 0.7
                }

                logger.info(f"OpenRouter: Trying model {model_name}")

                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers=headers,
                        json=payload
                    )

                    if response.status_code == 200:
                        data = response.json()
                        if "choices" in data and len(data["choices"]) > 0:
                            content = data["choices"][0]["message"]["content"]
                            usage = data.get("usage", {})
                            tokens_used = usage.get("total_tokens", 0)
                            
                            return LLMResponse(
                                response=content,
                                tokens_used=tokens_used,
                                cost=0.0,
                                status="success",
                                provider=self.provider
                            )
                    
                    error_msg = f"OpenRouter API error for {model_name}: {response.status_code} - {response.text}"
                    logger.warning(error_msg)
                    last_error = error_msg
                    
                    # If it's a rate limit, server error, or model not found, try next model
                    if response.status_code in [404, 429, 500, 502, 503, 504]:
                        continue
                    else:
                        # For other errors (like 401 Unauthorized), don't bother trying other models
                        break

            except Exception as e:
                logger.error(f"OpenRouter error with {model_name}: {str(e)}")
                last_error = str(e)
                continue

        return LLMResponse(
            response="",
            tokens_used=0,
            cost=0.0,
            status="error",
            provider=self.provider,
            error_message=f"All OpenRouter models failed. Last error: {last_error}"
        )

    def _build_messages(self, context: Dict[str, Any]) -> list:
        """Build messages list from context"""
        messages = []

        if context.get("system_prompt"):
            messages.append({
                "role": "system",
                "content": context["system_prompt"]
            })

        for msg in context.get("recent_messages", []):
            role = "user"
            if hasattr(msg, 'role'):
                role = msg.role.value if hasattr(msg.role, 'value') else str(msg.role)
            elif isinstance(msg, dict):
                role = msg.get("role", "user")
                
            messages.append({
                "role": role,
                "content": msg.content if hasattr(msg, 'content') else msg.get("content", "")
            })

        messages.append({
            "role": "user",
            "content": context.get("user_input", "")
        })

        return messages
