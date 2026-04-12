import re
from typing import Dict, List, Optional, Callable
from app.utils.logger import logger


class Watchdog:
    """Automatically detect and resolve LLM questions without user interruption.
    
    Watches for question patterns in LLM responses and auto-answers using rules.
    This keeps AI sessions running continuously without pausing for user confirmation.
    """

    def __init__(self, max_iterations: int = 5):
        self.rules: List[Dict] = self._build_default_rules()
        self.handlers: Dict[str, Callable] = {}
        self.max_iterations = max_iterations

    def _build_default_rules(self) -> List[Dict]:
        """Build default auto-answer rules"""
        return [
            {
                "pattern": r"which\s+(framework|library|language|tool)",
                "answer": "Use the most popular/mainstream option that fits the requirements.",
                "priority": 1
            },
            {
                "pattern": r"should\s+i|do\s+you\s+want",
                "answer": "Yes, please proceed with the most straightforward approach.",
                "priority": 1
            },
            {
                "pattern": r"would\s+you\s+like",
                "answer": "Yes, that sounds good.",
                "priority": 1
            },
            {
                "pattern": r"confirm|approval",
                "answer": "Confirmed. Continue with the implementation.",
                "priority": 1
            },
            {
                "pattern": r"should\s+we",
                "answer": "Yes, let's proceed with that.",
                "priority": 1
            },
            {
                "pattern": r"preferred|better",
                "answer": "Use the default/recommended option.",
                "priority": 2
            },
            {
                "pattern": r"any\s+specific|what\s+kind",
                "answer": "Use standard/common choices.",
                "priority": 2
            },
            {
                "pattern": r"let\s+me\s+know|what\s+do\s+you\s+think",
                "answer": "Sounds good, continue.",
                "priority": 2
            }
        ]

    def add_rule(self, pattern: str, answer: str, priority: int = 5) -> None:
        """Add a custom rule"""
        self.rules.append({
            "pattern": pattern,
            "answer": answer,
            "priority": priority
        })
        self.rules.sort(key=lambda r: r.get("priority", 5))
        logger.info(f"Added watchdog rule: {pattern}")

    def detect_question(self, response: str) -> bool:
        """Check if response contains a question needing auto-answer"""
        question_patterns = [
            r"\?",
            r"should\s+i",
            r"would\s+you",
            r"do\s+you\s+want",
            r"any\s+questions",
            r"let\s+me\s+know",
            r"what\s+do\s+you\s+think",
            r"confirm",
            r"which\s+(one|option)",
            r"prefer"
        ]
        
        response_lower = response.lower()
        for pattern in question_patterns:
            if re.search(pattern, response_lower):
                return True
        return False

    def get_auto_answer(self, response: str, context: Optional[Dict] = None) -> Optional[str]:
        """Get auto-answer for detected question"""
        response_lower = response.lower()
        
        for rule in self.rules:
            pattern = rule["pattern"]
            if re.search(pattern, response_lower, re.IGNORECASE):
                answer = rule["answer"]
                
                if context and "framework" in context:
                    if "fastapi" in context["framework"].lower():
                        answer = "Use FastAPI as it matches the requirements."
                    elif "react" in context["framework"].lower():
                        answer = "Use React as the frontend framework."
                
                logger.info(f"Watchdog auto-answer: {answer}")
                return answer
        
        return None

    def process_response(self, response: str, context: Optional[Dict] = None, iteration: int = 0) -> Dict:
        """Process response and return modified response + auto-answer if applicable"""
        has_question = self.detect_question(response)
        auto_answer = None
        
        # Safety: check if we've exceeded max iterations
        if iteration >= self.max_iterations:
            logger.warning(f"Watchdog reached max iterations ({self.max_iterations}). Forcing user input.")
            return {
                "original_response": response,
                "has_question": has_question,
                "auto_answer": None,
                "requires_user_input": True,
                "limit_reached": True
            }

        if has_question:
            auto_answer = self.get_auto_answer(response, context)
        
        return {
            "original_response": response,
            "has_question": has_question,
            "auto_answer": auto_answer,
            "requires_user_input": auto_answer is None and has_question,
            "limit_reached": False
        }

    def should_continue(self, response: str) -> bool:
        """Determine if execution should continue without user input"""
        result = self.process_response(response)
        return result["auto_answer"] is not None

    def inject_answer(self, original_response: str, auto_answer: str) -> str:
        """Inject auto-answer into the response for context continuity"""
        injection = f"\n\n[Auto-answered: {auto_answer}]"
        return original_response + injection


watchdog = Watchdog()