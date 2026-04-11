from typing import Dict, List, Optional
from app.models.schemas import LLMProvider


class PolicyEngine:
    """Policy engine for routing and fallback configuration"""

    def __init__(self):
        self.max_tokens_per_model: Dict[LLMProvider, int] = {
            LLMProvider.OPENAI: 2000,
            LLMProvider.ANTHROPIC: 1024,
            LLMProvider.OLLAMA: 2048,
            LLMProvider.GEMINI: 2048,
            LLMProvider.GROK: 2048
        }

        self.fallback_priority: List[LLMProvider] = [
            LLMProvider.OPENAI,
            LLMProvider.ANTHROPIC,
            LLMProvider.GEMINI,
            LLMProvider.GROK,
            LLMProvider.OLLAMA
        ]

        self.default_system_prompt = "You are a helpful AI assistant in the AI Orchestra system. Provide clear, concise, and accurate responses."

    def get_max_tokens(self, provider: LLMProvider) -> int:
        """Get max tokens for a provider"""
        return self.max_tokens_per_model.get(provider, 1024)

    def get_fallback_chain(self, failed_provider: Optional[LLMProvider] = None) -> List[LLMProvider]:
        """Get fallback chain, optionally skipping a failed provider"""
        if failed_provider is None:
            return self.fallback_priority.copy()
        
        chain = [p for p in self.fallback_priority if p != failed_provider]
        
        # Add lowest cost option at the end (Ollama)
        if LLMProvider.OLLAMA not in chain:
            chain.append(LLMProvider.OLLAMA)
        
        return chain

    def select_cheapest(self) -> LLMProvider:
        """Get the cheapest provider"""
        return LLMProvider.OLLAMA

    def select_for_query(self, query: str) -> LLMProvider:
        """Select provider based on query characteristics"""
        word_count = len(query.split())
        query_lower = query.lower()
        
        # Research/analyze queries prefer Gemini
        if any(keyword in query_lower for keyword in ["research", "analyze", "compare", "market", "data", "trends"]):
            return LLMProvider.GEMINI
        
        # Simple conversational queries allow Grok
        if word_count < 50 and any(keyword in query_lower for keyword in ["what", "how", "tell", "explain"]):
            return LLMProvider.GROK
        
        # Simple queries go to cheapest
        if word_count < 100:
            return LLMProvider.OLLAMA
        
        # Complex queries go to OpenAI
        if word_count > 500 or "complex" in query_lower or "detailed" in query_lower:
            return LLMProvider.OPENAI
        
        # Medium queries go to Anthropic
        return LLMProvider.ANTHROPIC
