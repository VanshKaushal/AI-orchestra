from typing import Optional, Dict, Any
from datetime import datetime
from app.models.schemas import (
    LLMProvider, Message, MessageRole, 
    ChatRequest, ChatResponse, LLMResponse
)
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.anthropic_adapter import AnthropicAdapter
from app.adapters.ollama_adapter import OllamaAdapter
from app.adapters.gemini import GeminiAdapter
from app.adapters.grok import GrokAdapter
from app.core.router import Router
from app.core.policy_engine import PolicyEngine
from app.core.context_builder import ContextBuilder
from app.core.state_manager import StateManager
from app.core.switch_engine import SwitchEngine
from app.core.quality_checker import QualityChecker
from app.core.usage_tracker import UsageTracker
from app.memory.short_term import ShortTermMemory
from app.memory.long_term import LongTermMemory
from app.utils.logger import logger


class Orchestrator:
    """Main orchestration engine for AI Orchestra.
    
    Provides:
    - Seamless LLM switching (auto + manual)
    - Persistent conversation state
    - Context reconstruction (not raw chat transfer)
    - Automatic fallback on failures
    """

    def __init__(self):
        self.adapters = {
            LLMProvider.OPENAI: OpenAIAdapter(),
            LLMProvider.ANTHROPIC: AnthropicAdapter(),
            LLMProvider.OLLAMA: OllamaAdapter(),
            LLMProvider.GEMINI: GeminiAdapter(),
            LLMProvider.GROK: GrokAdapter()
        }
        
        self.router = Router()
        self.policy = PolicyEngine()
        self.context_builder = ContextBuilder()
        self.state_manager = StateManager()
        self.switch_engine = SwitchEngine(self.adapters, self.router)
        self.quality_checker = QualityChecker()
        self.usage_tracker = UsageTracker()
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory()
        
        logger.info("AI Orchestra Orchestrator initialized")

    async def process(self, request: ChatRequest) -> ChatResponse:
        """Process a chat request with automatic fallback and state management"""
        user_id = request.user_id or "default"
        user_input = request.message
        
        logger.info(f"Processing request for user {user_id}: {user_input[:50]}...")
        
        history = self.short_term.get_history(user_id)
        summary = self.long_term.get_summary(user_id)
        
        state_context = self.context_builder.build(
            user_input, history, summary, user_id
        )
        
        selected = self.router.select(user_input, request.force_provider)
        logger.info(f"Selected provider: {selected.value}")
        
        response, actual_provider, switch_reason = await self._generate_with_switch(
            state_context,
            user_input,
            original_provider=selected,
            failed_provider=request.force_provider,
            user_id=user_id
        )
        
        self._store_interaction(user_id, user_input, response, actual_provider)
        
        self.context_builder.update_state(user_id, user_input, response.response)
        
        fallback_triggered = actual_provider != selected
        
        logger.info(f"Response from {actual_provider.value} (fallback={fallback_triggered})")
        
        return ChatResponse(
            response=response.response,
            provider=actual_provider,
            tokens_used=response.tokens_used,
            cost=response.cost,
            fallback_triggered=fallback_triggered,
            fallback_from=selected if fallback_triggered else None,
            switch_reason=switch_reason
        )

    async def _generate_with_switch(
        self,
        context: Dict[str, Any],
        user_input: str,
        original_provider: LLMProvider,
        failed_provider: Optional[LLMProvider] = None,
        user_id: str = "default"
    ) -> tuple[LLMResponse, LLMProvider, Optional[str]]:
        """Generate response with automatic switching on errors or quality issues"""
        
        provider = self.router.get_fallback(failed_provider) if failed_provider else original_provider
        tried_providers = set()
        switch_reason = None
        
        while provider and provider not in tried_providers:
            tried_providers.add(provider)
            
            logger.info(f"Trying provider: {provider.value}")
            
            adapter = self.adapters.get(provider)
            if not adapter:
                provider = self.router.get_fallback(provider)
                continue
            
            try:
                prompt = self.context_builder.build_from_state(user_input, user_id)
                result = await adapter.generate(prompt, context)
                
                if result.status == "success":
                    quality = self.quality_checker.check(result.response)
                    
                    if quality.is_weak and provider != LLMProvider.OLLAMA:
                        logger.warning(f"Weak response from {provider.value}, escalating...")
                        switch_reason = f"quality_check_failed"
                        self.usage_tracker.record_failure(provider)
                        provider = self.router.get_fallback(provider)
                        continue
                    
                    self.usage_tracker.record_success(provider, result.tokens_used, result.cost)
                    self.switch_engine.record_success(provider)
                    return result, provider, switch_reason
                else:
                    logger.warning(f"{provider.value} failed: {result.error_message}")
                    self.usage_tracker.record_failure(provider)
                    self.switch_engine.record_failure(provider)
                    switch_reason = "provider_error"
                    
            except Exception as e:
                logger.error(f"Error with {provider.value}: {str(e)}")
                self.usage_tracker.record_failure(provider)
                self.switch_engine.record_failure(provider)
                switch_reason = "exception"
            
            provider = self.router.get_fallback(provider)
        
        return (
            LLMResponse(
                response="All LLM providers failed. Please check your configuration and try again.",
                tokens_used=0,
                cost=0.0,
                status="error",
                provider=LLMProvider.OLLAMA
            ),
            LLMProvider.OLLAMA,
            "all_providers_failed"
        )

    def _store_interaction(
        self,
        user_id: str,
        user_input: str,
        response: LLMResponse,
        provider: LLMProvider
    ) -> None:
        """Store the interaction in memory"""
        
        user_msg = Message(
            role=MessageRole.USER,
            content=user_input,
            provider=None
        )
        self.short_term.add_message(user_id, user_msg)
        
        assistant_msg = Message(
            role=MessageRole.ASSISTANT,
            content=response.response,
            provider=provider,
            tokens_used=response.tokens_used,
            cost=response.cost
        )
        self.short_term.add_message(user_id, assistant_msg)
        
        self.long_term.add_memory(
            user_id, 
            f"User: {user_input}\nAssistant: {response.response}",
            {"provider": provider.value}
        )

    def get_usage_summary(self) -> str:
        """Get usage summary"""
        return self.usage_tracker.summary()

    def get_state_summary(self, user_id: str = "default") -> str:
        """Get conversation state summary"""
        return self.context_builder.get_state_summary(user_id)

    def switch_provider(self, provider: LLMProvider) -> bool:
        """Manual switch to a specific provider"""
        return self.switch_engine.manual_switch(provider)

    def get_current_provider(self, user_input: str) -> LLMProvider:
        """Get current selected provider"""
        return self.router.select(user_input)

    def clear_conversation(self, user_id: str = "default") -> None:
        """Clear conversation history and state"""
        self.short_term.clear_history(user_id)
        self.context_builder.clear_state(user_id)
        logger.info(f"Cleared conversation for user {user_id}")