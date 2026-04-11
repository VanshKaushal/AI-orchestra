import os
import httpx
from typing import Dict, Any
from app.adapters.base_adapter import BaseAdapter
from app.models.schemas import LLMResponse, LLMProvider
from app.utils.logger import logger


class GeminiAdapter(BaseAdapter):
    """Google Gemini adapter using Gemini API"""

    def __init__(self):
        super().__init__()
        self.provider = LLMProvider.GEMINI
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model = os.getenv("GEMINI_MODEL", "gemini-pro")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"
        self.max_tokens = 2048

        self.input_price = 0.00025
        self.output_price = 0.0005

    async def generate(self, prompt: str, context: Dict[str, Any]) -> LLMResponse:
        """Generate a response using Gemini API"""
        if not self.api_key:
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="GEMINI_API_KEY not set"
            )

        try:
            headers = {
                "Content-Type": "application/json"
            }

            messages = self._build_messages(context, prompt)

            payload = {
                "contents": messages,
                "generationConfig": {
                    "maxOutputTokens": self.max_tokens,
                    "temperature": 0.7,
                    "topP": 0.95,
                    "topK": 40
                }
            }

            url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    url,
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    content = self._parse_response(data)
                    
                    tokens_used = self._estimate_tokens(content)
                    cost = self._calculate_cost(tokens_used)

                    return LLMResponse(
                        response=content,
                        tokens_used=tokens_used,
                        cost=cost,
                        status="success",
                        provider=self.provider
                    )
                else:
                    error_msg = f"Gemini API error: {response.status_code} - {response.text}"
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
            logger.error("Gemini request timed out")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message="Request timed out"
            )
        except Exception as e:
            logger.error(f"Gemini error: {str(e)}")
            return LLMResponse(
                response="",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=self.provider,
                error_message=str(e)
            )

    def _build_messages(self, context: Dict[str, Any], prompt: str) -> list:
        """Build messages from context in Gemini format"""
        messages = []

        if context.get("system_prompt"):
            messages.append({
                "role": "system",
                "parts": [{"text": context["system_prompt"]}]
            })

        if context.get("conversation_summary"):
            messages.append({
                "role": "system",
                "parts": [{"text": f"Context: {context['conversation_summary']}"}]
            })

        for msg in context.get("recent_messages", []):
            role = "user" if msg.role.value == "user" else "model"
            messages.append({
                "role": role,
                "parts": [{"text": msg.content}]
            })

        messages.append({
            "role": "user",
            "parts": [{"text": context.get("user_input", prompt)}]
        })

        return messages

    def _parse_response(self, data: dict) -> str:
        """Parse response from Gemini API"""
        try:
            candidates = data.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            
            return "No response content"
        except Exception as e:
            logger.error(f"Error parsing Gemini response: {e}")
            return "Error parsing response"

    def _estimate_tokens(self, content: str) -> int:
        """Estimate tokens from content length"""
        return len(content) // 4

    def _calculate_cost(self, tokens_used: int) -> float:
        """Calculate cost based on tokens used"""
        return (tokens_used / 1000) * (self.input_price + self.output_price)