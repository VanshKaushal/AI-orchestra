from typing import NamedTuple
from app.utils.logger import logger


class QualityResult(NamedTuple):
    """Result of quality check"""
    is_weak: bool
    score: float
    issues: list


class QualityChecker:
    """Validates LLM response quality and triggers escalation if weak.
    
    Quality checks:
    - Response length below threshold → weak
    - No structure/content → weak
    - Contains "I don't know" → weak
    - Low information density → weak
    
    If weak → escalate to better model
    """

    def __init__(
        self,
        min_length: int = 20,
        max_repeat_chars: float = 0.3,
        weak_phrases: list = None
    ):
        self.min_length = min_length
        self.max_repeat_chars = max_repeat_chars
        
        self.weak_phrases = weak_phrases or [
            "i don't know",
            "i cannot",
            "i'm not sure",
            "i'm unable",
            "no information",
            "don't have enough",
            "cannot help with",
            "not qualified",
            "as an ai",
            "as a language model",
            "i'm just a",
            "sorry, i"
        ]

    def check(self, response: str) -> QualityResult:
        """Check response quality and return result"""
        if not response or not response.strip():
            return QualityResult(
                is_weak=True,
                score=0.0,
                issues=["empty_response"]
            )
        
        response = response.strip()
        issues = []
        score = 1.0
        
        if len(response) < self.min_length:
            issues.append("too_short")
            score -= 0.4
        
        unique_chars = len(set(response.lower()))
        repeat_ratio = 1 - (unique_chars / max(len(response), 1))
        
        if repeat_ratio > self.max_repeat_chars:
            issues.append("high_repetition")
            score -= 0.3
        
        response_lower = response.lower()
        for phrase in self.weak_phrases:
            if phrase in response_lower:
                issues.append(f"weak_phrase: {phrase}")
                score -= 0.25
                break
        
        if "?" in response and len(response) < 30: # Reduced threshold
            issues.append("questionable_response")
            score -= 0.1 # Reduced penalty
        
        words = response.split()
        if len(set(words)) / max(len(words), 1) < 0.2: # Reduced threshold
            issues.append("low_diversity")
            score -= 0.2
        
        is_weak = score < 0.4 or len(issues) >= 3 # Less aggressive
        
        if is_weak:
            logger.warning(f"Weak response detected: {issues}")
        
        return QualityResult(
            is_weak=is_weak,
            score=max(0.0, score),
            issues=issues
        )

    def should_escalate(self, response: str) -> bool:
        """Quick check if response should trigger escalation"""
        result = self.check(response)
        return result.is_weak

    def get_score(self, response: str) -> float:
        """Get quality score only"""
        return self.check(response).score