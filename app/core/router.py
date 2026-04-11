from typing import Optional
from app.models.schemas import LLMProvider
from app.core.policy_engine import PolicyEngine
from app.utils.logger import logger


class Router:
    """Router engine for selecting LLM providers"""

    def __init__(self, policy_engine: Optional[PolicyEngine] = None):
        self.policy = policy_engine or PolicyEngine()

    def select(self, user_input: str, force_provider: Optional[LLMProvider] = None) -> LLMProvider:
        """Select the best provider for the query"""
        if force_provider:
            logger.info(f"Force provider: {force_provider.value}")
            return force_provider
        
        provider = self.policy.select_for_query(user_input)
        logger.info(f"Router selected: {provider.value}")
        return provider

    def get_fallback(self, failed_provider: Optional[LLMProvider] = None) -> Optional[LLMProvider]:
        """Get next fallback provider"""
        chain = self.policy.get_fallback_chain(failed_provider)
        
        if chain:
            fallback = chain[0]
            logger.info(f"Fallback selected: {fallback.value}")
            return fallback
        
        return None

    def get_all_providers(self):
        """Get all available providers"""
        return self.policy.fallback_priority.copy()
