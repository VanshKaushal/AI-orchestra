from typing import Dict, Optional, List
from datetime import datetime, timedelta
from app.models.schemas import LLMProvider
from app.utils.logger import logger


class SwitchEngine:
    """Handles automatic and manual LLM switching.
    
    AUTO SWITCH triggers:
    - API errors
    - Timeouts
    - Low quality output
    - Manual threshold
    
    MANUAL SWITCH allows:
    - /switch openai
    - /switch anthropic
    - /switch ollama
    """

    def __init__(self, adapters: Dict, router, max_failures: int = 3):
        self.adapters = adapters
        self.router = router
        self.max_failures = max_failures
        
        self._failure_counts: Dict[LLMProvider, int] = {
            p: 0 for p in LLMProvider
        }
        
        self._failure_times: Dict[LLMProvider, List[datetime]] = {
            p: [] for p in LLMProvider
        }
        
        self._manual_override: Optional[LLMProvider] = None
        self._switch_log: List[Dict] = []

    def record_failure(self, provider: LLMProvider) -> None:
        """Record a failure for a provider"""
        self._failure_counts[provider] += 1
        self._failure_times[provider].append(datetime.now())
        
        logger.warning(f"Failure recorded for {provider.value}: count={self._failure_counts[provider]}")
        
        if len(self._failure_times[provider]) > 10:
            self._failure_times[provider] = self._failure_times[provider][-10:]

    def record_success(self, provider: LLMProvider) -> None:
        """Record success - reset failure count"""
        if self._manual_override is None:
            self._failure_counts[provider] = 0
            logger.info(f"Success for {provider.value}, failures reset")

    def should_auto_switch(self, provider: LLMProvider) -> bool:
        """Determine if automatic switching should occur"""
        if self._manual_override:
            return False
        
        failure_count = self._failure_counts.get(provider, 0)
        
        if failure_count >= self.max_failures:
            logger.warning(f"Auto-switch: {provider.value} exceeded failure threshold")
            return True
        
        recent_failures = [
            t for t in self._failure_times.get(provider, [])
            if datetime.now() - t < timedelta(minutes=5)
        ]
        
        if len(recent_failures) >= 3:
            logger.warning(f"Auto-switch: {provider.value} has 3+ failures in 5 minutes")
            return True
        
        return False

    def get_next_provider(self, failed_provider: Optional[LLMProvider] = None) -> Optional[LLMProvider]:
        """Get the next provider to try"""
        if self._manual_override:
            logger.info(f"Manual override active: {self._manual_override.value}")
            return self._manual_override
        
        return self.router.get_fallback(failed_provider)

    def manual_switch(self, provider: LLMProvider) -> bool:
        """Manually switch to a specific provider"""
        self._manual_override = provider
        
        self._log_switch(
            from_provider=None,
            to_provider=provider,
            reason="manual"
        )
        
        logger.info(f"Manual switch to {provider.value}")
        return True

    def clear_manual_switch(self) -> None:
        """Clear manual override"""
        if self._manual_override:
            logger.info(f"Cleared manual override (was {self._manual_override.value})")
            self._manual_override = None

    def is_manual_override_active(self) -> bool:
        """Check if manual override is active"""
        return self._manual_override is not None

    def get_current_provider(self) -> Optional[LLMProvider]:
        """Get currently active provider (manual override or None)"""
        return self._manual_override

    def _log_switch(
        self,
        from_provider: Optional[LLMProvider],
        to_provider: LLMProvider,
        reason: str
    ) -> None:
        """Log a provider switch"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "from": from_provider.value if from_provider else "auto",
            "to": to_provider.value,
            "reason": reason
        }
        self._switch_log.append(entry)
        
        if len(self._switch_log) > 50:
            self._switch_log = self._switch_log[-50:]

    def get_switch_log(self) -> List[Dict]:
        """Get switch log"""
        return self._switch_log.copy()

    def get_failure_counts(self) -> Dict[str, int]:
        """Get failure counts for all providers"""
        return {p.value: c for p, c in self._failure_counts.items()}

    def reset_failures(self, provider: Optional[LLMProvider] = None) -> None:
        """Reset failure counts"""
        if provider:
            self._failure_counts[provider] = 0
            self._failure_times[provider] = []
            logger.info(f"Reset failures for {provider.value}")
        else:
            for p in LLMProvider:
                self._failure_counts[p] = 0
                self._failure_times[p] = []
            logger.info("Reset all failures")