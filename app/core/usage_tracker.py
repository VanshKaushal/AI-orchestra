from typing import Dict
from datetime import datetime
from app.models.schemas import LLMProvider, UsageStats
from app.utils.logger import logger


class UsageTracker:
    """Track usage statistics for each LLM provider"""

    def __init__(self):
        self.stats: Dict[LLMProvider, UsageStats] = {
            LLMProvider.OPENAI: UsageStats(provider=LLMProvider.OPENAI),
            LLMProvider.ANTHROPIC: UsageStats(provider=LLMProvider.ANTHROPIC),
            LLMProvider.OLLAMA: UsageStats(provider=LLMProvider.OLLAMA)
        }

    def record_success(self, provider: LLMProvider, tokens_used: int, cost: float) -> None:
        """Record a successful call"""
        stats = self.stats.get(provider)
        if stats:
            stats.tokens_used += tokens_used
            stats.total_cost += cost
            stats.success_count += 1
            logger.info(f"{provider.value}: +{tokens_used} tokens, ${cost:.4f}")

    def record_failure(self, provider: LLMProvider) -> None:
        """Record a failed call"""
        stats = self.stats.get(provider)
        if stats:
            stats.failures += 1
            logger.warning(f"{provider.value}: failure recorded")

    def get_stats(self, provider: LLMProvider) -> UsageStats:
        """Get stats for a provider"""
        return self.stats.get(provider, UsageStats(provider=provider))

    def get_all_stats(self) -> Dict[LLMProvider, UsageStats]:
        """Get all stats"""
        return self.stats

    def get_total_cost(self) -> float:
        """Get total cost across all providers"""
        return sum(s.total_cost for s in self.stats.values())

    def get_total_tokens(self) -> int:
        """Get total tokens across all providers"""
        return sum(s.tokens_used for s in self.stats.values())

    def get_total_failures(self) -> int:
        """Get total failures across all providers"""
        return sum(s.failures for s in self.stats.values())

    def reset(self) -> None:
        """Reset all stats"""
        for provider in self.stats:
            self.stats[provider] = UsageStats(provider=provider)
        logger.info("Usage stats reset")

    def summary(self) -> str:
        """Get summary string"""
        lines = ["=== Usage Summary ==="]
        for provider, stats in self.stats.items():
            lines.append(
                f"{provider.value}: {stats.success_count} calls, "
                f"{stats.tokens_used} tokens, ${stats.total_cost:.4f} cost, "
                f"{stats.failures} failures"
            )
        lines.append(f"Total: ${self.get_total_cost():.4f}, {self.get_total_tokens()} tokens")
        return "\n".join(lines)
